import { docs } from "@/.source";
import { loader } from "fumadocs-core/source";

/**
 * HLD Configuration
 * Add folder paths here to include them in the HLD tab.
 * All files within these folders (and subfolders) will be shown.
 */
export const HLD_FOLDERS = ["case-studies"];

// Default source
export const source = loader({
  baseUrl: "/sd",
  source: docs.toFumadocsSource(),
});

// Raw HLD source
const rawHldSource = loader({
  baseUrl: "/hld",
  source: docs.toFumadocsSource(),
});

// Pre-compute folder set for fast lookup
const hldFolderSet = new Set(HLD_FOLDERS);

/**
 * Check if a page belongs to an HLD section
 * A page is HLD if its path starts with any of the HLD_FOLDERS
 */
function isHLDPage(page: any): boolean {
  if (!page) return false;

  const slugs = page.slugs as string[];
  if (!slugs || slugs.length === 0) return false;

  // Check if the first slug (top-level folder) is in HLD_FOLDERS
  return hldFolderSet.has(slugs[0]);
}

type PageTreeNode = (typeof rawHldSource.pageTree.children)[number];

/**
 * Filter the page tree to only include HLD folders
 */
function filterPageTree(node: PageTreeNode): PageTreeNode | null {
  if (node.type === "page") {
    // Extract folder from URL: /hld/case-studies/amazon -> case-studies
    const match = node.url?.match(/^\/hld\/([^/]+)/);
    const folder = match?.[1];
    return folder && hldFolderSet.has(folder) ? node : null;
  }

  if (node.type === "folder") {
    // Extract folder name from the index page URL or folder name
    const indexUrl = node.index?.url;
    const match = indexUrl?.match(/^\/hld\/([^/]+)/);
    const folder = match?.[1] ?? String(node.name).toLowerCase().replace(/\s+/g, "-");

    // If this is an HLD folder, include it entirely
    if (hldFolderSet.has(folder)) {
      return node;
    }

    // Otherwise, skip this folder entirely (don't recurse)
    return null;
  }

  return null;
}

/**
 * Get filtered page tree for HLD
 */
function getFilteredPageTree(): typeof rawHldSource.pageTree {
  const root = rawHldSource.pageTree;
  const children = (root.children ?? [])
    .map(filterPageTree)
    .filter((node): node is PageTreeNode => node !== null);
  return { ...root, children };
}

/**
 * Filtered HLD source - includes pages under HLD_FOLDERS
 */
export const hldSource: typeof rawHldSource = {
  ...rawHldSource,
  pageTree: getFilteredPageTree(),
  getPages: () => rawHldSource.getPages().filter(isHLDPage),
  getPage: (slug?: string[], lang?: string) => {
    const page = rawHldSource.getPage(slug, lang);
    return isHLDPage(page) ? page : undefined;
  },
  generateParams: () =>
    rawHldSource.generateParams().filter((params) => {
      const page = rawHldSource.getPage(params.slug, params.lang);
      return isHLDPage(page);
    }) as ReturnType<typeof rawHldSource.generateParams>,
};
