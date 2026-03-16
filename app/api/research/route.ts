import { NextRequest } from 'next/server';
import { decomposeQuery, searchMultipleQueries, formatResearchContext, synthesizeResearch } from '@/lib/chat/research-agent';
import {
  validateInput,
  sanitizeInput,
  getBlockedMessage,
  checkRateLimit,
  checkQueryRelevance,
  getOffTopicMessage,
} from '@/lib/chat/guardrails';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow longer execution for research

interface ResearchRequestBody {
  question: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Check required environment variables
    const missingEnvVars = [];
    if (!process.env.GROQ_API_KEY) missingEnvVars.push('GROQ_API_KEY');
    if (!process.env.PINECONE_API_KEY) missingEnvVars.push('PINECONE_API_KEY');
    if (!process.env.HUGGINGFACE_API_KEY) missingEnvVars.push('HUGGINGFACE_API_KEY');

    if (missingEnvVars.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Research service is not configured',
          detail: `Missing environment variables: ${missingEnvVars.join(', ')}`,
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Rate limiting (stricter for research as it uses more resources)
    const clientIP = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimit = checkRateLimit(`research:${clientIP}`, 10, 60000); // 10 requests per minute

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(rateLimit.resetIn / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
          },
        }
      );
    }

    const body: ResearchRequestBody = await request.json();
    const { question, conversationHistory = [] } = body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return new Response('Invalid question', { status: 400 });
    }

    // Guardrails: Validate and sanitize input
    const sanitizedQuestion = sanitizeInput(question);
    const validationResult = validateInput(sanitizedQuestion);

    if (!validationResult.safe) {
      // Return a friendly blocked message
      const blockedMessage = getBlockedMessage(validationResult);
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              step: 'blocked',
              message: 'Request blocked by safety filter'
            })}\n\n`)
          );
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'token', text: blockedMessage })}\n\n`)
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Guardrail-Blocked': 'true',
          'X-Guardrail-Category': validationResult.category || 'unknown',
        },
      });
    }

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        let isClosed = false;

        const safeEnqueue = (data: Uint8Array) => {
          if (!isClosed) {
            try {
              controller.enqueue(data);
            } catch {
              isClosed = true;
            }
          }
        };

        const closeController = () => {
          if (!isClosed) {
            isClosed = true;
            try {
              controller.close();
            } catch {
              // Already closed
            }
          }
        };

        try {
          // Step 0: Check if query is relevant to system design
          safeEnqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              step: 'validating',
              message: 'Validating your question...'
            })}\n\n`)
          );

          try {
            const relevanceResult = checkQueryRelevance(sanitizedQuestion);

            if (!relevanceResult.isRelevant) {
              // Query is not about system design
              const offTopicMessage = getOffTopicMessage(relevanceResult);
              safeEnqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'progress',
                  step: 'off_topic',
                  message: 'This doesn\'t appear to be a system design question'
                })}\n\n`)
              );
              safeEnqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'token', text: offTopicMessage })}\n\n`)
              );
              safeEnqueue(encoder.encode('data: [DONE]\n\n'));
              closeController();
              return;
            }
          } catch (relevanceError) {
            console.error('Relevance check error:', relevanceError);
            // Continue with the query if relevance check fails
          }

          // Step 1: Decompose
          safeEnqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              step: 'decompose',
              message: 'Analyzing your question...'
            })}\n\n`)
          );

          const subQueries = await decomposeQuery(sanitizedQuestion);

          safeEnqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              step: 'decompose_complete',
              message: `Identified ${subQueries.length} research topics`,
              subQueries
            })}\n\n`)
          );

          // Step 2: Search
          safeEnqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              step: 'search',
              message: `Searching documentation for ${subQueries.length} topics...`,
              total: subQueries.length
            })}\n\n`)
          );

          const queryResults = await searchMultipleQueries(subQueries, 3);

          // Count sources and collect all unique sources for citation
          let totalSources = 0;
          const sourceSummary: { query: string; count: number }[] = [];
          const allSources: Array<{ title: string; url: string; score: number }> = [];
          const seenUrls = new Set<string>();

          for (const [query, contexts] of queryResults) {
            totalSources += contexts.length;
            sourceSummary.push({ query, count: contexts.length });
            for (const ctx of contexts) {
              if (!seenUrls.has(ctx.url)) {
                seenUrls.add(ctx.url);
                allSources.push({ title: ctx.title, url: ctx.url, score: ctx.score });
              }
            }
          }

          safeEnqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              step: 'search_complete',
              message: `Found ${totalSources} relevant sources across ${subQueries.length} topics`,
              sources: sourceSummary
            })}\n\n`)
          );

          // Send detailed sources for citation
          safeEnqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'sources',
              sources: allSources.slice(0, 10) // Top 10 unique sources
            })}\n\n`)
          );

          // Step 3: Format context
          const researchContext = formatResearchContext(queryResults);

          // Step 4: Synthesize
          safeEnqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              step: 'synthesize',
              message: 'Synthesizing comprehensive answer...'
            })}\n\n`)
          );

          const stream = await synthesizeResearch(sanitizedQuestion, researchContext, conversationHistory);

          // Stream the response
          for await (const chunk of stream) {
            if (isClosed) break; // Stop if connection closed
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              safeEnqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'token', text: content })}\n\n`)
              );
            }
          }

          safeEnqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('Research agent error:', error);
          safeEnqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              message: 'Research failed. Please try again.'
            })}\n\n`)
          );
        } finally {
          closeController();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Research API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
