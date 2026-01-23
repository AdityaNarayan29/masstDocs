import { InferenceClient } from '@huggingface/inference';

const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

// all-MiniLM-L6-v2 outputs 384-dimensional vectors
export const EMBEDDING_DIMENSION = 384;

let hfClient: InferenceClient | null = null;

function getHfClient(): InferenceClient {
  if (!hfClient) {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error('HUGGINGFACE_API_KEY is not set');
    }
    hfClient = new InferenceClient(apiKey);
  }
  return hfClient;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const hf = getHfClient();
  const result = await hf.featureExtraction({
    model: HF_MODEL,
    inputs: text,
  });
  return result as number[];
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const hf = getHfClient();
  const results: number[][] = [];

  // Process one at a time to avoid issues
  for (const text of texts) {
    const result = await hf.featureExtraction({
      model: HF_MODEL,
      inputs: text,
    });
    results.push(result as number[]);
  }

  return results;
}
