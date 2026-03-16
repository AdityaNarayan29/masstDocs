import { NextRequest } from 'next/server';
import { getGroqClient, GROQ_MODEL, SYSTEM_PROMPT } from '@/lib/chat/groq';
import { retrieveContext, formatContextForPrompt } from '@/lib/chat/context';
import {
  validateInput,
  sanitizeInput,
  getBlockedMessage,
  checkRateLimit,
} from '@/lib/chat/guardrails';

export const runtime = 'nodejs';

interface ChatRequestBody {
  messages: Array<{
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
          error: 'Chat service is not configured',
          detail: `Missing environment variables: ${missingEnvVars.join(', ')}`,
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Rate limiting (using IP as identifier)
    const clientIP = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimit = checkRateLimit(clientIP, 30, 60000); // 30 requests per minute

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

    const body: ChatRequestBody = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response('Invalid messages format', { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return new Response('Last message must be from user', { status: 400 });
    }

    // Guardrails: Validate and sanitize input
    const sanitizedContent = sanitizeInput(lastMessage.content);
    const validationResult = validateInput(sanitizedContent);

    if (!validationResult.safe) {
      // Return a friendly message instead of processing the unsafe input
      const blockedMessage = getBlockedMessage(validationResult);
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        start(controller) {
          const data = JSON.stringify({ text: blockedMessage });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
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

    // Use sanitized content for processing
    const processedMessages = messages.map((m, i) =>
      i === messages.length - 1
        ? { ...m, content: sanitizedContent }
        : m
    );

    // Retrieve relevant context from Pinecone
    let contextText = '';
    try {
      const contexts = await retrieveContext(lastMessage.content, 5);
      contextText = formatContextForPrompt(contexts);
    } catch (error) {
      console.warn('Failed to retrieve context:', error);
      contextText = 'Context retrieval unavailable.';
    }

    // Build system prompt with context
    const systemWithContext = `${SYSTEM_PROMPT}

Here is relevant documentation context to help answer the user's question:

${contextText}

Use this context to provide accurate, relevant answers. Cite sources when directly referencing documentation.`;

    const groq = getGroqClient();

    // Create streaming response
    const stream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 4096,
      stream: true,
      messages: [
        { role: 'system', content: systemWithContext },
        ...processedMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
    });

    // Convert to ReadableStream for SSE
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const data = JSON.stringify({ text: content });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('Stream error:', error);
          const errorData = JSON.stringify({ error: 'Stream interrupted' });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          controller.close();
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
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        detail: process.env.NODE_ENV === 'development' ? message : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
