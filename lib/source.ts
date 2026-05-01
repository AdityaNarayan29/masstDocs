import { docs } from "@/.source";
import { loader } from "fumadocs-core/source";

/**
 * HLD Configuration
 * Add folder paths here to include them in the HLD tab.
 * All files within these folders (and subfolders) will be shown.
 */
export const HLD_FOLDERS = ["case-studies"];

/**
 * LLD Configuration
 * Top-level folder paths included in the LLD tab.
 */
export const LLD_FOLDERS = ["lld"];

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

// Raw LLD source
const rawLldSource = loader({
  baseUrl: "/lld",
  source: docs.toFumadocsSource(),
});

// Pre-compute folder set for fast lookup
const hldFolderSet = new Set(HLD_FOLDERS);
const lldFolderSet = new Set(LLD_FOLDERS);

/**
 * Check if a page belongs to an HLD section
 * A page is HLD if its path starts with any of the HLD_FOLDERS
 */
function isHLDPage(page: ReturnType<typeof rawHldSource.getPage>): boolean {
  if (!page) return false;

  const slugs = page.slugs as string[];
  if (!slugs || slugs.length === 0) return false;

  // Check if the first slug (top-level folder) is in HLD_FOLDERS
  return hldFolderSet.has(slugs[0]);
}

function isLLDPage(page: ReturnType<typeof rawLldSource.getPage>): boolean {
  if (!page) return false;
  const slugs = page.slugs as string[];
  if (!slugs || slugs.length === 0) return false;
  return lldFolderSet.has(slugs[0]);
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
 * Strip the leading "/lld/lld" -> "/lld" so on-disk path lld/foo
 * surfaces in the URL as /lld/foo (not /lld/lld/foo).
 */
function rewriteLldUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  if (url === "/lld/lld") return "/lld";
  if (url.startsWith("/lld/lld/")) return "/lld" + url.slice("/lld/lld".length);
  return url;
}

function rewriteLldNode(node: PageTreeNode): PageTreeNode | null {
  if (node.type === "page") {
    if (!node.url?.startsWith("/lld/lld") && node.url !== "/lld/lld") return null;
    return { ...node, url: rewriteLldUrl(node.url)! } as PageTreeNode;
  }

  if (node.type === "folder") {
    // The top-level lld folder is what we want to flatten — promote its children up.
    const indexUrl = node.index?.url;
    if (indexUrl === "/lld/lld" || indexUrl?.startsWith("/lld/lld")) {
      // Recurse and rewrite descendants
      const rewritten = (node.children ?? [])
        .map(rewriteLldNode)
        .filter((n): n is PageTreeNode => n !== null);
      const newIndex = node.index
        ? { ...node.index, url: rewriteLldUrl(node.index.url)! }
        : node.index;
      return { ...node, index: newIndex, children: rewritten } as PageTreeNode;
    }
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

function getFilteredLldPageTree(): typeof rawLldSource.pageTree {
  const root = rawLldSource.pageTree;
  // Find the top-level "lld" folder, promote its children to root.
  for (const child of root.children ?? []) {
    if (child.type === "folder") {
      const idx = child.index?.url;
      if (idx === "/lld/lld" || idx?.startsWith("/lld/lld")) {
        const rewritten = rewriteLldNode(child);
        if (rewritten && rewritten.type === "folder") {
          // Use the lld folder's children as the new root children;
          // promote its index page too if present.
          const promoted = [...(rewritten.children ?? [])];
          return { ...root, children: promoted };
        }
      }
    }
  }
  return { ...root, children: [] };
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

/**
 * Filtered LLD source - includes pages under LLD_FOLDERS.
 *
 * Surface URLs as /lld/<rest> by stripping the on-disk "lld/" prefix.
 * Lookups (getPage, generateParams) re-add it.
 */
export const lldSource: typeof rawLldSource = {
  ...rawLldSource,
  pageTree: getFilteredLldPageTree(),
  getPages: () => rawLldSource.getPages().filter(isLLDPage),
  getPage: (slug?: string[], lang?: string) => {
    // External callers pass [foundations, solid]; on-disk slug is [lld, foundations, solid]
    const adjusted = slug && slug.length > 0 ? ["lld", ...slug] : ["lld"];
    const page = rawLldSource.getPage(adjusted, lang);
    return isLLDPage(page) ? page : undefined;
  },
  generateParams: () => {
    const filtered = rawLldSource.generateParams().filter((params) => {
      const page = rawLldSource.getPage(params.slug, params.lang);
      return isLLDPage(page);
    });
    const stripped = filtered.map((params) => {
      const slug = (params.slug as string[]) ?? [];
      return { ...params, slug: slug[0] === "lld" ? slug.slice(1) : slug };
    });
    return stripped as unknown as ReturnType<typeof rawLldSource.generateParams>;
  },
};
