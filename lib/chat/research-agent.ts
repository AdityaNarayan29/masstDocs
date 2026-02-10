import type Groq from 'groq-sdk';
import { getGroqClient, GROQ_MODEL } from './groq';
import { retrieveContext } from './context';
import type { RetrievedContext } from '@/types/chat';

export interface ResearchStep {
  type: 'decompose' | 'search' | 'synthesize';
  status: 'pending' | 'running' | 'complete';
  data?: unknown;
}

export interface ResearchProgress {
  step: string;
  subQueries?: string[];
  currentQuery?: string;
  totalQueries?: number;
  completedQueries?: number;
}

const DECOMPOSE_PROMPT = `You are a system design research assistant. Your task is to break down a complex system design question into 3-5 specific, searchable sub-queries.

Rules:
1. Each sub-query should focus on a distinct aspect of the system
2. Include queries for: architecture components, data flow, scaling strategies, and relevant design patterns
3. Make queries specific enough to retrieve relevant documentation
4. Return ONLY a JSON array of strings, no other text

Example:
Question: "How would you design Netflix?"
Output: ["Netflix video streaming architecture", "CDN content delivery for video", "Netflix recommendation system design", "video encoding and transcoding pipeline", "Netflix microservices architecture"]

Now break down this question:`;

const SYNTHESIZE_PROMPT = `You are an expert system design architect synthesizing research findings into a comprehensive answer.

You have gathered research from multiple sources on different aspects of the question. Your task is to:

1. Synthesize all findings into a cohesive, well-structured answer
2. Include a high-level architecture diagram using Mermaid (flowchart for components, sequence diagram for flows)
3. Cite sources using markdown links like [Source Title](/path)
4. Cover: requirements, high-level design, key components, data flow, scaling considerations
5. Be thorough but concise - aim for a complete system design response

When generating Mermaid diagrams:
- Use flowchart (graph TD) for architecture/components
- Use sequenceDiagram for request flows
- Keep node IDs simple (alphanumeric, no spaces)

Research Findings:
`;

export async function decomposeQuery(question: string): Promise<string[]> {
  const groq = getGroqClient();

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    max_tokens: 500,
    temperature: 0.3,
    messages: [
      { role: 'system', content: DECOMPOSE_PROMPT },
      { role: 'user', content: question }
    ],
  });

  const content = response.choices[0]?.message?.content || '[]';

  try {
    // Extract JSON array from response (handle markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const queries = JSON.parse(jsonMatch[0]) as string[];
      // Ensure we have 3-5 queries
      return queries.slice(0, 5);
    }
  } catch {
    console.error('Failed to parse sub-queries:', content);
  }

  // Fallback: use the original question
  return [question];
}

export async function searchMultipleQueries(
  queries: string[],
  topKPerQuery: number = 3
): Promise<Map<string, RetrievedContext[]>> {
  const results = new Map<string, RetrievedContext[]>();

  // Search in parallel for better performance
  const searchPromises = queries.map(async (query) => {
    try {
      const contexts = await retrieveContext(query, topKPerQuery);
      return { query, contexts };
    } catch (error) {
      console.error(`Search failed for query "${query}":`, error);
      return { query, contexts: [] };
    }
  });

  const searchResults = await Promise.all(searchPromises);

  for (const { query, contexts } of searchResults) {
    results.set(query, contexts);
  }

  return results;
}

export function formatResearchContext(
  queryResults: Map<string, RetrievedContext[]>
): string {
  const sections: string[] = [];
  let sourceIndex = 1;

  for (const [query, contexts] of queryResults) {
    if (contexts.length === 0) continue;

    const contextTexts = contexts.map((ctx) => {
      const sourceRef = `[Source ${sourceIndex}: ${ctx.title}](${ctx.url})`;
      sourceIndex++;
      return `${sourceRef}\n${ctx.content}`;
    });

    sections.push(`### Research on: "${query}"\n\n${contextTexts.join('\n\n')}`);
  }

  return sections.join('\n\n---\n\n');
}

export async function synthesizeResearch(
  originalQuestion: string,
  researchContext: string
): Promise<AsyncIterable<Groq.Chat.Completions.ChatCompletionChunk>> {
  const groq = getGroqClient();

  const stream = await groq.chat.completions.create({
    model: GROQ_MODEL,
    max_tokens: 4096,
    temperature: 0.7,
    stream: true,
    messages: [
      {
        role: 'system',
        content: SYNTHESIZE_PROMPT + researchContext
      },
      {
        role: 'user',
        content: `Based on the research above, provide a comprehensive system design answer for: ${originalQuestion}`
      }
    ],
  });

  return stream;
}

export async function* runResearchAgent(
  question: string,
  onProgress?: (progress: ResearchProgress) => void
): AsyncGenerator<{ type: 'progress' | 'token' | 'done'; data: unknown }> {
  // Step 1: Decompose the question
  yield { type: 'progress', data: { step: 'Analyzing your question...' } };
  onProgress?.({ step: 'decompose' });

  const subQueries = await decomposeQuery(question);

  yield {
    type: 'progress',
    data: {
      step: 'Breaking down into research topics',
      subQueries
    }
  };

  // Step 2: Search for each sub-query
  yield {
    type: 'progress',
    data: {
      step: `Researching ${subQueries.length} topics...`,
      totalQueries: subQueries.length,
      completedQueries: 0
    }
  };

  const queryResults = await searchMultipleQueries(subQueries, 3);

  // Count total sources found
  let totalSources = 0;
  for (const contexts of queryResults.values()) {
    totalSources += contexts.length;
  }

  yield {
    type: 'progress',
    data: {
      step: `Found ${totalSources} relevant sources`,
      completedQueries: subQueries.length,
      totalQueries: subQueries.length
    }
  };

  // Step 3: Format research context
  const researchContext = formatResearchContext(queryResults);

  // Step 4: Synthesize the answer
  yield {
    type: 'progress',
    data: { step: 'Synthesizing comprehensive answer...' }
  };

  const stream = await synthesizeResearch(question, researchContext);

  // Stream the response tokens
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield { type: 'token', data: content };
    }
  }

  yield { type: 'done', data: null };
}
