import { docs } from "@/.source";
import { loader, type VirtualFile } from "fumadocs-core/source";

/**
 * The default fumadocs source mounts every file under `content/docs` as
 * `<baseUrl>/<path>`. We expose four scoped views over the same MDX
 * collection — each surface owns a distinct part of the curriculum so
 * sidebars and search filters agree on what belongs where:
 *
 *   /sd  — the curriculum: fundamentals, building-blocks, architecture,
 *          communication, design-patterns, system-components,
 *          observability, security (NOT case-studies, lld, dsa)
 *   /hld — only the `case-studies/` subtree, with `case-studies/`
 *          stripped from paths so /hld/netflix works
 *   /lld — only the `lld/` subtree, paths flattened
 *   /dsa — only the `dsa/` subtree, paths flattened
 *
 * URL rewriting is done by materializing the source's VirtualFile array
 * and rewriting `path` for the scoped subtrees so the loader serves
 * `/hld/netflix` rather than `/hld/case-studies/netflix`.
 */

const fullSource = docs.toFumadocsSource();
const allFiles: VirtualFile[] =
  typeof fullSource.files === "function" ? fullSource.files() : fullSource.files;

const matchesPrefix = (path: string, prefix: string) =>
  path === prefix || path.startsWith(`${prefix}/`);

const isLldFile = (f: VirtualFile) => matchesPrefix(f.path.replace(/\\/g, "/"), "lld");
const isDsaFile = (f: VirtualFile) => matchesPrefix(f.path.replace(/\\/g, "/"), "dsa");
const isCaseStudyFile = (f: VirtualFile) =>
  matchesPrefix(f.path.replace(/\\/g, "/"), "case-studies");

// Files for /sd — the curriculum, minus case-studies/lld/dsa subtrees.
const sdFiles: VirtualFile[] = allFiles.filter(
  (f) => !isLldFile(f) && !isDsaFile(f) && !isCaseStudyFile(f),
);

// Strip a top-level folder prefix from a VirtualFile path so the loader
// serves /<baseUrl>/<rest> instead of /<baseUrl>/<folder>/<rest>.
const stripPrefix = (prefix: string) => (f: VirtualFile): VirtualFile => {
  const path = f.path.replace(/\\/g, "/");
  const stripped = path === prefix ? "" : path.slice(prefix.length + 1);
  return { ...f, path: stripped, slugs: undefined };
};

// Files inside case-studies/, lld/, dsa/ — prefix stripped.
const hldFiles: VirtualFile[] = allFiles
  .filter(isCaseStudyFile)
  .map(stripPrefix("case-studies"));
const lldFiles: VirtualFile[] = allFiles.filter(isLldFile).map(stripPrefix("lld"));
const dsaFiles: VirtualFile[] = allFiles.filter(isDsaFile).map(stripPrefix("dsa"));

// Scoped Source objects sharing the same type as fullSource so downstream
// consumers (DocsRenderer, etc.) see the same `pageData` shape with
// `body`, `toc`, etc.
const sdSourceConfig = { files: sdFiles } as typeof fullSource;
const hldSourceConfig = { files: hldFiles } as typeof fullSource;
const lldSourceConfig = { files: lldFiles } as typeof fullSource;
const dsaSourceConfig = { files: dsaFiles } as typeof fullSource;

/**
 * /sd — the curriculum view.
 */
export const source = loader({
  baseUrl: "/sd",
  source: sdSourceConfig,
});

/**
 * /hld — real-world case studies only. /hld lands on the case-studies
 * index page; individual pages are reachable at /hld/netflix etc.
 */
export const hldSource = loader({
  baseUrl: "/hld",
  source: hldSourceConfig,
});

/**
 * /lld — only the lld/ subtree, paths flattened.
 */
export const lldSource = loader({
  baseUrl: "/lld",
  source: lldSourceConfig,
});

/**
 * /dsa — only the dsa/ subtree, paths flattened.
 */
export const dsaSource = loader({
  baseUrl: "/dsa",
  source: dsaSourceConfig,
});
