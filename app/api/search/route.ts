import { source, hldSource, lldSource, dsaSource } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

/**
 * Unified search across all four content surfaces. Each result is tagged
 * with the section it belongs to (sd / hld / lld / dsa) so the search UI
 * can show a "filter by section" chip row and label each result.
 *
 * Tags are filterable via `?tag=lld` (single) or `?tag=hld&tag=dsa`
 * (multi). The default search dialog wires this up automatically when
 * tags are passed to RootProvider's search options.
 *
 * /sd and /hld share their MDX files (HLD reuses SD's source), so to
 * avoid surfacing the same content twice we route each shared page to
 * exactly one tag: case-studies pages to `hld`, everything else to `sd`.
 * /lld and /dsa each have their own files and are indexed wholesale.
 */

const HLD_TOP_FOLDERS = new Set(['case-studies']);

function isHldFlavored(slugs: readonly string[]): boolean {
  return slugs.length > 0 && HLD_TOP_FOLDERS.has(slugs[0]);
}

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
    if (isHldFlavored(p.slugs)) continue; // route case studies to /hld below
    result.push({ url: p.url, data: p.data as IndexedPage['data'], __tag: 'sd' });
  }
  for (const p of hldSource.getPages()) {
    if (!isHldFlavored(p.slugs)) continue; // only index case studies under /hld
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
    return {
      id: tagged.url,
      url: tagged.url,
      title: tagged.data.title ?? '',
      description: tagged.data.description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      structuredData: tagged.data.structuredData as any,
      tag: tagged.__tag,
    };
  },
});
