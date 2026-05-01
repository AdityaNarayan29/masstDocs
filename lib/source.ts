import { docs } from "@/.source";
import { loader, type VirtualFile } from "fumadocs-core/source";

/**
 * The default fumadocs source mounts every file under `content/docs` as
 * `<baseUrl>/<path>`. We expose three views over the same docs:
 *
 *   /sd  — everything except the `lld/` subtree
 *   /hld — same content as /sd (HLD reference + case studies)
 *   /lld — only the `lld/` subtree, with the `lld/` prefix stripped from
 *          paths so URLs surface as `/lld/foundations/solid` rather than
 *          `/lld/lld/foundations/solid`
 *
 * To do this we materialize the docs source's files and rebuild scoped
 * sources from them.
 */

const fullSource = docs.toFumadocsSource();
const allFiles: VirtualFile[] =
  typeof fullSource.files === "function" ? fullSource.files() : fullSource.files;

const isLldFile = (f: VirtualFile) => {
  const path = f.path.replace(/\\/g, "/");
  return path === "lld" || path.startsWith("lld/");
};

// Files outside the lld/ subtree (used by /sd and /hld).
const sdFiles: VirtualFile[] = allFiles.filter((f) => !isLldFile(f));

// Files inside lld/, with the lld/ prefix stripped so the loader treats
// them as if they lived at the top level under baseUrl=/lld.
const lldFiles: VirtualFile[] = allFiles.filter(isLldFile).map((f) => {
  const path = f.path.replace(/\\/g, "/");
  const stripped = path === "lld" ? "" : path.slice("lld/".length);
  return {
    ...f,
    path: stripped,
    // Drop any explicit slugs override that still includes "lld" — let
    // the loader recompute slugs from the rewritten path.
    slugs: undefined,
  };
});

// Build scoped Source objects that share the same type as fullSource so
// downstream consumers (DocsRenderer, etc.) see the same `pageData` shape
// (with `body`, `toc`, etc.). We re-use the type via `as typeof fullSource`.
const sdSourceConfig = { files: sdFiles } as typeof fullSource;
const lldSourceConfig = { files: lldFiles } as typeof fullSource;

/**
 * Default /sd source — everything except lld/.
 */
export const source = loader({
  baseUrl: "/sd",
  source: sdSourceConfig,
});

/**
 * /hld source — same files as /sd. The two surfaces share content; the
 * HLD tab is a separate entry point so users who arrive there land on a
 * URL that reads "high-level design" rather than the generic "/sd".
 */
export const hldSource = loader({
  baseUrl: "/hld",
  source: sdSourceConfig,
});

/**
 * /lld source — only the lld/ subtree, paths flattened so URLs are
 * `/lld/foundations/solid` instead of `/lld/lld/foundations/solid`.
 */
export const lldSource = loader({
  baseUrl: "/lld",
  source: lldSourceConfig,
});
