export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  feedback?: 'up' | 'down' | null;
  sources?: RetrievedContext[];
}

export interface FeedbackRecord {
  messageId: string;
  feedback: 'up' | 'down';
  query: string;
  response: string;
  timestamp: Date;
  isResearch: boolean;
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    title: string;
    url: string;
    section?: string;
    category: string;
  };
}

export interface EmbeddingRecord {
  id: string;
  values: number[];
  metadata: DocumentChunk['metadata'] & { content: string };
}

export interface RetrievedContext {
  content: string;
  title: string;
  url: string;
  score: number;
}

export interface ResearchState {
  isActive: boolean;
  step: string;
  message: string;
  subQueries?: string[];
  sources?: { query: string; count: number }[];
}
