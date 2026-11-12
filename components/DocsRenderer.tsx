import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from "fumadocs-ui/page";
import { readFileSync } from "fs";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { findNeighbour } from "fumadocs-core/server";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { getMDXComponents } from "@/mdx-components";
import { getTrack, sectionForUrl } from "@/lib/tracks";
import { getPractice } from "@/lib/practice";
import { ReadingProgress } from "@/components/article/ReadingProgress";
import { MarkDone } from "@/components/article/MarkDone";

type Source =
  | typeof import("@/lib/source").source
  | typeof import("@/lib/source").hldSource
  | typeof import("@/lib/source").lldSource
  | typeof import("@/lib/source").dsaSource
  | typeof import("@/lib/source").aiSource
  | typeof import("@/lib/source").reelsSource;
type Page = NonNullable<ReturnType<Source["getPage"]>>;

const WORDS_PER_MINUTE = 220;
// Time to study a diagram, on top of reading the text around it.
const SECONDS_PER_DIAGRAM = 20;

/**
 * Minutes to read, from the MDX source: prose, tables and code count;
 * frontmatter, imports and diagram source don't, but each diagram adds study time. (The search index leaves
 * tables and code out, which made table-heavy case studies read "1 min".)
 */
function readingMinutes(page: Page): number {
  let text: string;
  let diagrams = 0;
  try {
    const source = readFileSync(page.data._file.absolutePath, "utf8");
    diagrams = source.match(/```mermaid/g)?.length ?? 0;
    text = source
      .replace(/^---[\s\S]*?\n---\n/, "")
      .replace(/```mermaid[\s\S]*?```/g, "")
      .replace(/^import .*$/gm, "")
      .replace(/<[^>]+>/g, " ");
  } catch {
    const { contents, headings } = page.data.structuredData;
    text = [...contents.map((c) => c.content), ...headings.map((h) => h.content)].join(" ");
  }
  const words = text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE + diagrams * SECONDS_PER_DIAGRAM / 60));
}

export async function DocsRenderer({
  source,
  slug,
  header,
  footer,
}: {
  source: Source;
  slug?: string[];
  /** Rendered before the page body. */
  header?: (page: Page) => ReactNode;
  /** Rendered after the page body, e.g. the reels "Go deeper" card. */
  footer?: (page: Page) => ReactNode;
}) {
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDXContent = page.data.body;
  const section = sectionForUrl(page.url);
  const trackName = section ? getTrack(section.track).title : "this track";
  // Section landing pages are overviews: no reading time or "done" for them.
  const isArticle = section ? page.url !== section.url : true;
  const next = findNeighbour(source.pageTree, page.url).next;
  const hasPractice = Boolean(getPractice(page.url));

  const rail = isArticle ? (
    <div className="flex flex-col gap-3 pt-6">
      <MarkDone url={page.url} trackName={trackName} variant="compact" />
      {hasPractice && (
        <a href="#practice" className="rounded-2xl border bg-fd-card p-4 hover:bg-fd-accent">
          <span className="m-label">Practice</span>
          <span className="mt-1.5 block text-sm font-extrabold">Try designing it yourself ↓</span>
        </a>
      )}
      {next && (
        <Link href={next.url} className="rounded-2xl border bg-fd-card p-4 hover:bg-fd-accent">
          <span className="m-label">Up next</span>
          <span className="mt-1.5 block text-sm font-extrabold">{next.name} →</span>
        </Link>
      )}
    </div>
  ) : null;

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{ single: false, style: "clerk", footer: rail }}
    >
      {isArticle && <ReadingProgress url={page.url} title={page.data.title} />}
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      {isArticle && (
        <div className="not-prose -mt-2 mb-2 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--m-chip)] px-3 py-1 text-[13px] font-bold text-[var(--m-ink-2)]">
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            {readingMinutes(page)} min read
          </span>
          {section && (
            <span className="inline-flex items-center rounded-full bg-[var(--m-chip)] px-3 py-1 text-[13px] font-bold text-[var(--m-ink-2)]">
              {trackName} · {section.title}
            </span>
          )}
        </div>
      )}
      <DocsBody>
        {header?.(page)}
        <MDXContent
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
        {footer?.(page)}
        {isArticle && <MarkDone url={page.url} trackName={trackName} variant="card" />}
      </DocsBody>
    </DocsPage>
  );
}
