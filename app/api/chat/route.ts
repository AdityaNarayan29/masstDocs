import { NextRequest } from 'next/server';
import { getGroqClient, GROQ_MODEL, SYSTEM_PROMPT } from '@/lib/chat/groq';
import { retrieveContext, formatContextForPrompt } from '@/lib/chat/context';

export const runtime = 'nodejs';

interface ChatRequestBody {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response('Invalid messages format', { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return new Response('Last message must be from user', { status: 400 });
    }

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
        ...messages.map(m => ({
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
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
