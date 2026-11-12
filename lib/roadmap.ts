import type { ReactNode } from 'react';
import type { PageTree } from 'fumadocs-core/server';
import { source, hldSource, lldSource, dsaSource, aiSource, reelsSource } from '@/lib/source';
import { SECTIONS, getTrack, type SectionId } from '@/lib/tracks';

/**
 * Homepage roadmap data, generated from the same page trees (and meta.json
 * ordering) as the sidebars, so every page appears without hand upkeep.
 * Page nodes use their URL as id; that id is what progress tracking stores.
 */
export interface TreeNode {
  id: string;
  label: string;
  href?: string;
  section?: SectionId;
  children?: TreeNode[];
  isSection?: boolean;
}

export const LOADERS = {
  sd: source,
  ai: aiSource,
  hld: hldSource,
  lld: lldSource,
  dsa: dsaSource,
  reels: reelsSource,
} as const satisfies Record<SectionId, unknown>;

// The roadmap UI renders four levels under the root: section, folder,
// subfolder, page. Anything deeper is shown as a link to its folder page.
const MAX_DEPTH = 4;

const text = (name: ReactNode, fallback: string) =>
  typeof name === 'string' || typeof name === 'number' ? String(name) : fallback;

function convert(
  nodes: PageTree.Node[],
  section: SectionId,
  depth: number,
  skipUrl: string,
): TreeNode[] {
  const out: TreeNode[] = [];
  for (const node of nodes) {
    if (node.type === 'separator') continue;

    if (node.type === 'page') {
      if (node.url === skipUrl) continue;
      out.push({ id: node.url, label: text(node.name, node.url), href: node.url, section });
      continue;
    }

    const indexUrl = node.index?.url;
    const label = text(node.name, indexUrl ?? 'Section');
    const children = depth < MAX_DEPTH ? convert(node.children, section, depth + 1, skipUrl) : [];

    if (children.length === 0) {
      if (indexUrl) out.push({ id: indexUrl, label, href: indexUrl, section });
      continue;
    }
    out.push({ id: `${section}:${indexUrl ?? label}`, label, section, isSection: true, children });
  }
  return out;
}

export function buildRoadmapTree(): TreeNode {
  return {
    id: 'start',
    label: 'Start here',
    children: SECTIONS.map((s) => ({
      id: `section:${s.id}`,
      label: `${s.title} · ${getTrack(s.track).title}`,
      section: s.id,
      isSection: true,
      // The section's own index page is reachable from the track cards.
      children: convert(LOADERS[s.id].pageTree.children, s.id, 2, s.url),
    })),
  };
}

export const pageCount = (id: SectionId) => LOADERS[id].getPages().length;

/** Newest reels first (highest reel number). */
export function latestReels(limit = 4) {
  return reelsSource
    .getPages()
    .filter((p) => p.url !== '/reels')
    .sort((a, b) => order(a.url) - order(b.url))
    .slice(0, limit)
    .map((p) => ({ url: p.url, title: p.data.title, description: p.data.description }));
}

// Reel slugs start with their number (e.g. 39-aws-dns-outage); higher = newer.
const order = (url: string) => -Number(url.split('/').pop()?.split('-')[0] ?? 0);

/** Find any page on the site by its URL (all six sections). */
export function pageByUrl(url: string) {
  const path = url.split('#')[0]!;
  for (const id of Object.keys(LOADERS) as SectionId[]) {
    const page = LOADERS[id].getPages().find((p) => p.url === path);
    if (page) return { section: id, url: page.url, title: page.data.title, description: page.data.description };
  }
  return null;
}
