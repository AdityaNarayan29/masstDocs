import { docs } from "@/.source";
import { loader, type VirtualFile } from "fumadocs-core/source";

/**
 * The default fumadocs source mounts every file under `content/docs` as
 * `<baseUrl>/<path>`. We expose four views over the same docs:
 *
 *   /sd  — everything except `lld/` and `dsa/` subtrees
 *   /hld — same content as /sd (HLD reference + case studies)
 *   /lld — only the `lld/` subtree, with `lld/` stripped from paths
 *   /dsa — only the `dsa/` subtree, with `dsa/` stripped from paths
 *
 * URL rewriting is done by materializing the source's VirtualFile array
 * and rewriting `path` for the scoped subtrees so the loader naturally
 * serves `/dsa/patterns/sliding-window` rather than
 * `/dsa/dsa/patterns/sliding-window`.
 */

const fullSource = docs.toFumadocsSource();
const allFiles: VirtualFile[] =
  typeof fullSource.files === "function" ? fullSource.files() : fullSource.files;

const isLldFile = (f: VirtualFile) => {
  const path = f.path.replace(/\\/g, "/");
  return path === "lld" || path.startsWith("lld/");
};

const isDsaFile = (f: VirtualFile) => {
  const path = f.path.replace(/\\/g, "/");
  return path === "dsa" || path.startsWith("dsa/");
};

// Files outside the lld/ and dsa/ subtrees (used by /sd and /hld).
const sdFiles: VirtualFile[] = allFiles.filter(
  (f) => !isLldFile(f) && !isDsaFile(f),
);

// Files inside lld/, with the lld/ prefix stripped.
const lldFiles: VirtualFile[] = allFiles.filter(isLldFile).map((f) => {
  const path = f.path.replace(/\\/g, "/");
  const stripped = path === "lld" ? "" : path.slice("lld/".length);
  return { ...f, path: stripped, slugs: undefined };
});

// Files inside dsa/, with the dsa/ prefix stripped.
const dsaFiles: VirtualFile[] = allFiles.filter(isDsaFile).map((f) => {
  const path = f.path.replace(/\\/g, "/");
  const stripped = path === "dsa" ? "" : path.slice("dsa/".length);
  return { ...f, path: stripped, slugs: undefined };
});

// Scoped Source objects sharing the same type as fullSource so downstream
// consumers (DocsRenderer, etc.) see the same `pageData` shape with
// `body`, `toc`, etc.
const sdSourceConfig = { files: sdFiles } as typeof fullSource;
const lldSourceConfig = { files: lldFiles } as typeof fullSource;
const dsaSourceConfig = { files: dsaFiles } as typeof fullSource;

/**
 * Default /sd source — everything except lld/ and dsa/.
 */
export const source = loader({
  baseUrl: "/sd",
  source: sdSourceConfig,
});

/**
 * /hld source — same files as /sd. The two share content; HLD is a
 * separate entry point so users who arrive there land on a URL that
 * reads "high-level design" rather than the generic "/sd".
 */
export const hldSource = loader({
  baseUrl: "/hld",
  source: sdSourceConfig,
});

/**
 * /lld source — only the lld/ subtree, paths flattened.
 */
export const lldSource = loader({
  baseUrl: "/lld",
  source: lldSourceConfig,
});

/**
 * /dsa source — only the dsa/ subtree, paths flattened.
 */
export const dsaSource = loader({
  baseUrl: "/dsa",
  source: dsaSourceConfig,
});
