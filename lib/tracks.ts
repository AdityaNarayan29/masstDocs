/**
 * The site is organised as three learning tracks plus Reels. Each track
 * groups one or more sections (route + content folder, see lib/source.ts).
 * URLs never change with the grouping; this file only drives navigation:
 * sidebar tabs, the track bar on section index pages, search filters and
 * the homepage.
 */

export type TrackId = 'concepts' | 'designs' | 'interview' | 'reels';
export type SectionId = 'sd' | 'ai' | 'hld' | 'lld' | 'dsa' | 'reels';

export interface Track {
  id: TrackId;
  title: string;
  blurb: string;
  /** The page a newcomer should open first. */
  start: { title: string; url: string };
}

export interface Section {
  id: SectionId;
  track: TrackId;
  title: string;
  /** Short label for search chips. */
  short: string;
  url: string;
  description: string;
}

export const TRACKS: Track[] = [
  {
    id: 'concepts',
    title: 'Concepts',
    blurb: 'How systems and AI systems work',
    start: { title: 'What is system design?', url: '/sd/fundamentals/what-is-system-design' },
  },
  {
    id: 'designs',
    title: 'Designs',
    blurb: 'Worked designs, high level and code level',
    start: { title: 'Design a URL shortener', url: '/hld/url-shortener' },
  },
  {
    id: 'interview',
    title: 'Interview',
    blurb: 'Patterns and a framework for interviews',
    start: { title: 'How to approach a design interview', url: '/sd/fundamentals/solve' },
  },
  {
    id: 'reels',
    title: 'Reels',
    blurb: 'Notes for every @masstdev reel',
    start: { title: 'All reel notes', url: '/reels' },
  },
];

/** In reading order: each section's "next" is the one after it. */
export const SECTIONS: Section[] = [
  { id: 'sd', track: 'concepts', title: 'System Design', short: 'SD', url: '/sd', description: 'How distributed systems work' },
  { id: 'ai', track: 'concepts', title: 'AI Engineering', short: 'AI', url: '/ai', description: 'Building production LLM systems' },
  { id: 'hld', track: 'designs', title: 'HLD Case Studies', short: 'HLD', url: '/hld', description: 'Netflix, Uber, WhatsApp and more' },
  { id: 'lld', track: 'designs', title: 'LLD & Patterns', short: 'LLD', url: '/lld', description: 'OOP, design patterns, machine coding' },
  { id: 'dsa', track: 'interview', title: 'DSA Patterns', short: 'DSA', url: '/dsa', description: 'Sliding window, graphs, DP and more' },
  { id: 'reels', track: 'reels', title: 'Reel Notes', short: 'Reels', url: '/reels', description: 'Notes for every @masstdev reel' },
];

/** Pages outside /dsa that belong to the Interview track. */
export const INTERVIEW_FRAMEWORK = [
  { title: 'How to approach a design interview', url: '/sd/fundamentals/solve' },
  { title: 'Back-of-envelope estimates', url: '/sd/fundamentals/estimate' },
];

/** Literal class names so Tailwind picks them up. */
export const SECTION_COLORS: Record<SectionId, { bg: string; ring: string; text: string }> = {
  sd: { bg: 'bg-emerald-500', ring: 'ring-emerald-500/40', text: 'text-emerald-600 dark:text-emerald-400' },
  ai: { bg: 'bg-pink-500', ring: 'ring-pink-500/40', text: 'text-pink-600 dark:text-pink-400' },
  hld: { bg: 'bg-blue-500', ring: 'ring-blue-500/40', text: 'text-blue-600 dark:text-blue-400' },
  lld: { bg: 'bg-violet-500', ring: 'ring-violet-500/40', text: 'text-violet-600 dark:text-violet-400' },
  dsa: { bg: 'bg-orange-500', ring: 'ring-orange-500/40', text: 'text-orange-600 dark:text-orange-400' },
  reels: { bg: 'bg-amber-500', ring: 'ring-amber-500/40', text: 'text-amber-600 dark:text-amber-400' },
};

export const getSection = (id: SectionId) => SECTIONS.find((s) => s.id === id)!;
export const getTrack = (id: TrackId) => TRACKS.find((t) => t.id === id)!;
export const sectionsInTrack = (id: TrackId) => SECTIONS.filter((s) => s.track === id);

/** The section to read after this one. Reels lead into the start of the course. */
export function nextSection(id: SectionId): Section {
  if (id === 'reels') return SECTIONS[0]!;
  const i = SECTIONS.findIndex((s) => s.id === id);
  return SECTIONS[i + 1]!;
}
