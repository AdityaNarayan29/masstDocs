import { HLD_PRACTICE } from './hld';
import { LLD_PRACTICE } from './lld';
import type { Practice, PracticeKind } from './types';

export type { Practice, PracticeKind };

export function getPractice(url: string): { kind: PracticeKind; practice: Practice } | null {
  if (HLD_PRACTICE[url]) return { kind: 'hld', practice: HLD_PRACTICE[url] };
  if (LLD_PRACTICE[url]) return { kind: 'lld', practice: LLD_PRACTICE[url] };
  return null;
}

/** AI review needs only Groq; the reference design comes from the page itself. */
export const reviewEnabled = () => Boolean(process.env.GROQ_API_KEY);

export const ANSWER_MIN = 80;
export const ANSWER_MAX = 8000;
