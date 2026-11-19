import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IntentLink as Link } from "@/components/IntentLink";
import { ShareBar } from "@/components/diagram/ShareBar";
import { cardUrl, diagramLinks } from "@/lib/diagram-links.mjs";
import { getTrack, sectionForUrl } from "@/lib/tracks";

/**
 * A diagram's own page: what a shared link opens. The link preview is the
 * diagram card (scripts/render-diagram-cards.mjs), the page shows the diagram
 * large, and everything points back to the full explanation.
 */

const SITE = "https://docs.masst.dev";
const TYPE_LABEL: Record<string, string> = {
  flowchart: "Flowchart",
  sequence: "Sequence diagram",
  state: "State diagram",
  architecture: "Architecture diagram",
  pie: "Chart",
  class: "Class diagram",
  er: "Entity relationship diagram",
};

type Link = {
  slug: string;
  hash: string;
  pageUrl: string;
  pageTitle: string;
  heading: string;
  type: string;
  alt: string;
  svg: string;
  width: number;
  height: number;
};

const links = () => diagramLinks() as { bySlug: Map<string, Link>; byPage: Map<string, Link[]> };

export const dynamicParams = false;

export function generateStaticParams() {
  return [...links().bySlug.keys()].map((slug) => ({ slug }));
}

/** The alt text, without the "Part of the … series on MASST Docs." tail. */
const describe = (d: Link) => d.alt.replace(/\s*Part of the .*$/, "").replace(/\.$/, "");
/** "flowchart covering A, B, C" from the alt text, as "Shows A, B, C." */
const covers = (d: Link) => {
  const m = describe(d).match(/covering\s+(.+)$/);
  return m ? `Shows ${m[1].replace(/…/g, "").replace(/,\s*,/g, ",")}.` : "";
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = links().bySlug.get(slug);
  if (!d) return {};
  const title = `${d.pageTitle}: ${d.heading}`;
  const description = `${describe(d)}. One diagram from Masst Docs, with the full explanation one click away.`;
  const image = { url: cardUrl(slug), width: 1200, height: 630, alt: `${title} (${TYPE_LABEL[d.type] ?? "Diagram"})` };
  return {
    title: `${title} | Diagram`,
    description,
    alternates: { canonical: `${SITE}/d/${slug}` },
    openGraph: { type: "article", url: `${SITE}/d/${slug}`, title, description, images: [image], siteName: "Masst Docs" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function DiagramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = links().bySlug.get(slug);
  if (!d) notFound();

  const svg = fs.readFileSync(path.join(process.cwd(), "public", d.svg), "utf-8");
  const section = sectionForUrl(d.pageUrl);
  const track = section ? getTrack(section.track) : null;
  const more = (links().byPage.get(d.pageUrl) ?? []).filter((x) => x.slug !== slug).slice(0, 6);
  const typeLabel = TYPE_LABEL[d.type] ?? "Diagram";
  const fullUrl = `${d.pageUrl}#diagram-${d.hash}`;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-8 md:pt-12">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-bold text-fd-muted-foreground">
        {track && <span>{track.title}</span>}
        {track && <span aria-hidden>›</span>}
        <Link href={d.pageUrl} className="hover:text-fd-foreground">
          {d.pageTitle}
        </Link>
      </nav>
      <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">{d.heading}</h1>
      <p className="mt-3 max-w-2xl text-fd-muted-foreground">
        {typeLabel} from <span className="font-bold text-fd-foreground">{d.pageTitle}</span>. {covers(d)}
      </p>

      <figure
        className="dg not-prose mt-8"
        id={`diagram-${d.hash}`}
        style={{ ["--dg-w" as string]: `${d.width}px`, ["--dg-h" as string]: d.height, ["--dg-max-h" as string]: 760 }}
      >
        <div className="dg-frame">
          <div className="dg-canvas" role="img" aria-label={d.alt} dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
        <button type="button" className="dg-zoom" aria-label="Enlarge diagram" title="Enlarge">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
      </figure>

      <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <ShareBar url={`${SITE}/d/${slug}`} title={`${d.pageTitle}: ${d.heading}`} card={cardUrl(slug)} slug={slug} />
        <Link
          href={fullUrl}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-fd-foreground px-6 text-sm font-extrabold text-fd-background transition-opacity hover:opacity-90"
        >
          Read the full explanation <span aria-hidden>→</span>
        </Link>
      </div>

      {more.length > 0 && (
        <section className="mt-16">
          <h2 className="m-label">More from {d.pageTitle}</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/d/${m.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-fd-border bg-fd-card transition-colors hover:border-[var(--m-info)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- static card file, already sized */}
                  <img src={cardUrl(m.slug)} alt="" width={1200} height={630} loading="lazy" className="aspect-[1200/630] w-full object-cover" />
                  <span className="block px-4 py-3 text-sm font-extrabold group-hover:text-[var(--m-info)]">{m.heading}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
