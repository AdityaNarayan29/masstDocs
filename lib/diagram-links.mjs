/**
 * One shareable URL per diagram: /d/<slug>, e.g. /d/netflix-high-level-architecture.
 *
 * Built from the diagram manifests (public/mermaid-cache), so the page plugin
 * (share buttons), the /d pages and the share-card renderer all agree.
 * A slug is the page name plus the section heading; when several diagrams
 * share a heading, each gets a short hash suffix. A slug changes only if its
 * diagram's code changes, or its heading gains a second diagram.
 */
import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'public', 'mermaid-cache');

/** Where share cards live. Local files for now; Cloudinary later (DIAGRAM_CARD_BASE). */
export const CARD_BASE = process.env.DIAGRAM_CARD_BASE || '/og/d';
export const cardUrl = (slug) => `${CARD_BASE}/${slug}.png`;

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

let cache = null;

/**
 * @returns {{ bySlug: Map<string, Link>, byHash: Map<string, Link>, byPage: Map<string, Link[]> }}
 * Link = { slug, hash, pageUrl, pageTitle, heading, type, alt, svg, width, height }
 */
export function diagramLinks() {
  if (cache) return cache;
  let seo = {};
  let manifest = {};
  try {
    seo = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, 'seo-manifest.json'), 'utf-8'));
    manifest = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, 'manifest.json'), 'utf-8'));
  } catch {
    // No manifests yet: no share links.
  }

  // Deterministic order: by page, then hash.
  const entries = Object.entries(seo)
    .filter(([hash, e]) => e?.pageUrl && e?.sectionHeading && manifest[hash]?.svg)
    .sort(([ha, a], [hb, b]) => a.pageUrl.localeCompare(b.pageUrl) || ha.localeCompare(hb));

  const baseOf = (e) => {
    const pageSlug = slugify(e.pageUrl.split('/').filter(Boolean).at(-1) ?? 'masst');
    const heading = slugify(e.sectionHeading.replace(/^\s*\d+[.)]\s*/, ''));
    const base = heading.startsWith(pageSlug) ? heading : `${pageSlug}-${heading}`;
    return base.slice(0, 80).replace(/-+$/, '');
  };
  // Shared bases (several diagrams under one heading) all get a hash suffix.
  const counts = new Map();
  for (const [, e] of entries) counts.set(baseOf(e), (counts.get(baseOf(e)) ?? 0) + 1);

  const bySlug = new Map();
  const byHash = new Map();
  const byPage = new Map();
  for (const [hash, e] of entries) {
    const base = baseOf(e);
    const slug = counts.get(base) > 1 ? `${base}-${hash.slice(-4)}` : base;
    const m = manifest[hash];
    const link = {
      slug,
      hash,
      pageUrl: e.pageUrl,
      pageTitle: e.pageTitle,
      heading: e.sectionHeading.replace(/^\s*\d+[.)]\s*/, ''),
      type: e.diagramType,
      alt: e.alt,
      svg: m.svg,
      width: Math.round(m.width),
      height: Math.round(m.height),
    };
    bySlug.set(slug, link);
    byHash.set(hash, link);
    if (!byPage.has(e.pageUrl)) byPage.set(e.pageUrl, []);
    byPage.get(e.pageUrl).push(link);
  }
  cache = { bySlug, byHash, byPage };
  return cache;
}
