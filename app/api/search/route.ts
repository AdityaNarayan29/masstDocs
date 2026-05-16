import { source, hldSource, lldSource, dsaSource } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

/**
 * Unified search across all four content surfaces. Each result is tagged
 * with the section it belongs to (sd / hld / lld / dsa) so the search UI
 * can show a "filter by section" chip row and label each result.
 *
 * Each surface now owns a disjoint slice of the MDX collection (see
 * lib/source.ts), so a page appears in exactly one tag — no dedup needed.
 *
 * Tags are filterable via `?tag=lld` (single) or `?tag=hld&tag=dsa`
 * (multi). The default search dialog wires this up automatically when
 * tags are passed to RootProvider's search options.
 */

// Short human label appended to result titles so users can see at a
// glance which section a result belongs to.
const SECTION_LABEL: Record<'sd' | 'hld' | 'lld' | 'dsa', string> = {
  sd: 'System Design',
  hld: 'HLD',
  lld: 'LLD',
  dsa: 'DSA',
};

type IndexedPage = {
  url: string;
  data: {
    title?: string;
    description?: string;
    structuredData: unknown;
  };
  __tag: 'sd' | 'hld' | 'lld' | 'dsa';
};

function getAllIndexedPages(): IndexedPage[] {
  const result: IndexedPage[] = [];

  for (const p of source.getPages()) {
    result.push({ url: p.url, data: p.data as IndexedPage['data'], __tag: 'sd' });
  }
  for (const p of hldSource.getPages()) {
    result.push({ url: p.url, data: p.data as IndexedPage['data'], __tag: 'hld' });
  }
  for (const p of lldSource.getPages()) {
    result.push({ url: p.url, data: p.data as IndexedPage['data'], __tag: 'lld' });
  }
  for (const p of dsaSource.getPages()) {
    result.push({ url: p.url, data: p.data as IndexedPage['data'], __tag: 'dsa' });
  }
  return result;
}

// Build a Source-shaped object that hands the merged tagged list to
// createFromSource. The helper only calls getPages() and reads each
// page's url + data, so we just need those fields to be correct.
const combinedSource = {
  ...source,
  getPages: () => getAllIndexedPages() as unknown as ReturnType<typeof source.getPages>,
};

export const { GET } = createFromSource(combinedSource, {
  language: 'english',
  buildIndex(page) {
    const tagged = page as unknown as IndexedPage;
    const label = SECTION_LABEL[tagged.__tag];
    const baseTitle = tagged.data.title ?? '';
    // Suffix the title with the section so each result row is
    // self-identifying. Renders as e.g. "Bloom Filters · System Design".
    const title = `${baseTitle} · ${label}`;
    return {
      id: tagged.url,
      url: tagged.url,
      title,
      description: tagged.data.description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      structuredData: tagged.data.structuredData as any,
      tag: tagged.__tag,
    };
  },
});
