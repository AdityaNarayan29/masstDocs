export type PracticeKind = 'hld' | 'lld';

export interface Practice {
  /** The interview question, in one or two sentences. */
  prompt: string;
  /** What a good answer must cover. Also sent to the reviewer. */
  requirements: string[];
  /** Revealed one at a time. */
  hints: string[];
}
