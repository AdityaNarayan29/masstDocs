import { getPineconeIndex } from './pinecone';
import { generateEmbedding } from './embeddings';
import type { RetrievedContext } from '@/types/chat';

export async function retrieveContext(
  query: string,
  topK: number = 5
): Promise<RetrievedContext[]> {
  const index = getPineconeIndex();
  const queryEmbedding = await generateEmbedding(query);

  const results = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });

  return (
    results.matches?.map(match => ({
      content: (match.metadata?.content as string) || '',
      title: (match.metadata?.title as string) || '',
      url: (match.metadata?.url as string) || '',
      score: match.score || 0,
    })) || []
  );
}

export function formatContextForPrompt(contexts: RetrievedContext[]): string {
  if (contexts.length === 0) {
    return 'No specific documentation context available.';
  }

  return contexts
    .map(
      (ctx, i) =>
        `[Source ${i + 1}: ${ctx.title}](${ctx.url})\n${ctx.content}`
    )
    .join('\n\n---\n\n');
}
