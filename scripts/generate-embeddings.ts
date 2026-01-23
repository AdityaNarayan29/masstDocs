#!/usr/bin/env tsx
import { config } from 'dotenv';
config({ path: '.env.local' });
import fs from 'fs/promises';
import path from 'path';
import { Pinecone } from '@pinecone-database/pinecone';
import { InferenceClient } from '@huggingface/inference';

const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

// all-MiniLM-L6-v2 outputs 384-dimensional vectors
export const EMBEDDING_DIMENSION = 384;

const CHUNK_SIZE = 1000; // Characters per chunk
const CHUNK_OVERLAP = 200; // Overlap between chunks
const BATCH_SIZE = 100; // Pinecone batch upsert limit

interface Chunk {
  id: string;
  content: string;
  metadata: {
    title: string;
    url: string;
    category: string;
    section?: string;
  };
}

interface FrontMatter {
  title?: string;
  description?: string;
}

function parseFrontmatter(content: string): { frontmatter: FrontMatter; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const [, yaml, body] = match;
  const frontmatter: FrontMatter = {};

  // Simple YAML parsing for title and description
  const titleMatch = yaml.match(/title:\s*["']?([^"'\n]+)["']?/);
  const descMatch = yaml.match(/description:\s*["']?([^"'\n]+)["']?/);

  if (titleMatch) frontmatter.title = titleMatch[1].trim();
  if (descMatch) frontmatter.description = descMatch[1].trim();

  return { frontmatter, body };
}

function cleanMdxContent(content: string): string {
  // Remove mermaid code blocks (keep a placeholder)
  let cleaned = content.replace(/```mermaid[\s\S]*?```/g, '[diagram]');

  // Remove other code blocks but note their presence
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '[code example]');

  // Remove MDX/JSX components but keep text content
  cleaned = cleaned.replace(/<[A-Z][^>]*>[\s\S]*?<\/[A-Z][^>]*>/g, '');
  cleaned = cleaned.replace(/<[A-Z][^>]*\/>/g, '');

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Remove import statements
  cleaned = cleaned.replace(/^import\s+.*$/gm, '');

  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) {
      // Only add meaningful chunks
      chunks.push(chunk);
    }
    start += chunkSize - overlap;
  }

  return chunks;
}

async function getAllMdxFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function scan(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.name.endsWith('.mdx')) {
        files.push(fullPath);
      }
    }
  }

  await scan(dir);
  return files;
}

async function generateEmbedding(hf: InferenceClient, text: string): Promise<number[]> {
  const result = await hf.featureExtraction({
    model: HF_MODEL,
    inputs: text,
  });
  return result as number[];
}

async function main() {
  // Validate environment variables
  if (!process.env.HUGGINGFACE_API_KEY) {
    console.error('Error: HUGGINGFACE_API_KEY is not set');
    process.exit(1);
  }
  if (!process.env.PINECONE_API_KEY) {
    console.error('Error: PINECONE_API_KEY is not set');
    process.exit(1);
  }

  const indexName = process.env.PINECONE_INDEX || 'masst-docs';

  console.log('Initializing clients...');
  console.log(`Using Hugging Face model: ${HF_MODEL}`);
  console.log(`Embedding dimension: ${EMBEDDING_DIMENSION}`);

  const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

  // Check if index exists
  console.log(`Connecting to Pinecone index: ${indexName}`);
  const index = pinecone.index(indexName);

  // Get all MDX files
  const docsDir = path.join(process.cwd(), 'content/docs');
  console.log(`Scanning ${docsDir} for MDX files...`);

  const mdxFiles = await getAllMdxFiles(docsDir);
  console.log(`Found ${mdxFiles.length} MDX files`);

  const allChunks: Chunk[] = [];

  // Process each file
  for (const filePath of mdxFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { frontmatter, body } = parseFrontmatter(content);

      // Get relative path for URL
      const relativePath = path.relative(docsDir, filePath);
      const slugs = relativePath.replace(/\.mdx$/, '').split(path.sep);
      const url = `/sd/${slugs.join('/')}`;
      const category = slugs[0] || 'general';

      // Clean and chunk content
      const cleanedContent = cleanMdxContent(body);
      const title = frontmatter.title || slugs[slugs.length - 1];

      // Add description as context if available
      const contentWithContext = frontmatter.description
        ? `${title}: ${frontmatter.description}\n\n${cleanedContent}`
        : cleanedContent;

      const textChunks = chunkText(contentWithContext, CHUNK_SIZE, CHUNK_OVERLAP);

      textChunks.forEach((chunk, idx) => {
        allChunks.push({
          id: `${slugs.join('-')}-${idx}`,
          content: chunk,
          metadata: {
            title,
            url,
            category,
            section: textChunks.length > 1 ? `Part ${idx + 1}` : undefined,
          },
        });
      });

      console.log(`  Processed: ${url} (${textChunks.length} chunks)`);
    } catch (error) {
      console.warn(`  Skipping ${filePath}: ${error}`);
    }
  }

  console.log(`\nTotal chunks created: ${allChunks.length}`);
  console.log('Generating embeddings and uploading to Pinecone...\n');

  // Process in batches
  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(allChunks.length / BATCH_SIZE);

    console.log(`Processing batch ${batchNum}/${totalBatches}...`);

    const vectors: Array<{
      id: string;
      values: number[];
      metadata: Record<string, string>;
    }> = [];

    // Generate embeddings one by one (HF API limitation)
    for (let j = 0; j < batch.length; j++) {
      const chunk = batch[j];

      try {
        const embedding = await generateEmbedding(hf, chunk.content);

        const metadata: Record<string, string> = {
          title: chunk.metadata.title,
          url: chunk.metadata.url,
          category: chunk.metadata.category,
          content: chunk.content,
        };
        if (chunk.metadata.section) {
          metadata.section = chunk.metadata.section;
        }

        vectors.push({
          id: chunk.id,
          values: embedding,
          metadata,
        });

        // Progress indicator
        if ((j + 1) % 10 === 0) {
          console.log(`    ${j + 1}/${batch.length} embeddings generated...`);
        }
      } catch (error) {
        console.warn(`    Failed to embed chunk ${chunk.id}: ${error}`);
      }
    }

    // Upsert to Pinecone
    if (vectors.length > 0) {
      await index.upsert(vectors);
      console.log(`  Uploaded ${vectors.length} vectors`);
    }
  }

  console.log('\nEmbedding generation complete!');
  console.log(`Total vectors in Pinecone: ${allChunks.length}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
