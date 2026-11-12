import { reelsSource } from "@/lib/source";
import { pageByUrl } from "@/lib/roadmap";
import { getSection, getTrack } from "@/lib/tracks";
import { TrackedLink } from "./TrackedLink";

const INSTAGRAM = "https://www.instagram.com/masstdev/";

type Reel = { reel: number; url: string; title: string };

function allReels(): Reel[] {
  return reelsSource
    .getPages()
    .flatMap((p) => (p.data.reel ? [{ reel: p.data.reel, url: p.url, title: p.data.title }] : []))
    .sort((a, b) => a.reel - b.reel);
}

/**
 * Card shown under every reel's notes: the course pages to read next
 * (from the `related` frontmatter), the track they belong to, and the
 * neighbouring reels. Rendered by app/reels, so authors only fill in
 * frontmatter.
 */
export function GoDeeper({
  reel,
  related = [],
  instagram,
}: {
  reel: number;
  related?: string[];
  instagram?: string;
}) {
  const pages = related.map(pageByUrl).filter((p) => p !== null);
  const primary = pages[0];
  const track = primary ? getTrack(getSection(primary.section).track) : null;

  const reels = allReels();
  const i = reels.findIndex((r) => r.reel === reel);
  const prev = i > 0 ? reels[i - 1] : undefined;
  const next = i >= 0 && i < reels.length - 1 ? reels[i + 1] : undefined;

  return (
    <section
      aria-labelledby="go-deeper"
      className="not-prose mt-12 rounded-2xl border border-fd-border bg-fd-card p-5"
    >
      <h2 id="go-deeper" className="text-lg font-extrabold">
        Go deeper
      </h2>
      {track && (
        <p className="mt-1 text-sm text-fd-muted-foreground">
          Part of the <span className="font-medium text-fd-foreground">{track.title}</span> track ({track.blurb}).
        </p>
      )}

      {pages.length > 0 && (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {pages.map((p) => (
            <li key={p.url}>
              <TrackedLink
                href={p.url}
                event="reel_to_course"
                data={{ reel, to: p.url }}
                className="group flex h-full items-start gap-3 rounded-xl border border-fd-border p-3 hover:bg-fd-accent transition-colors"
              >
                <span>
                  <span className="font-medium group-hover:underline underline-offset-4">{p.title}</span>
                  <span className="block text-xs text-fd-muted-foreground">{getSection(p.section).title}</span>
                </span>
              </TrackedLink>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-fd-border pt-4 text-sm">
        <div className="flex flex-wrap gap-4">
          {prev && (
            <TrackedLink href={prev.url} event="reel_to_reel" data={{ reel, to: prev.url }} className="hover:underline underline-offset-4">
              ← {prev.title}
            </TrackedLink>
          )}
          {next && (
            <TrackedLink href={next.url} event="reel_to_reel" data={{ reel, to: next.url }} className="hover:underline underline-offset-4">
              {next.title} →
            </TrackedLink>
          )}
        </div>
        <a href={instagram ?? INSTAGRAM} className="font-medium hover:underline underline-offset-4">
          {instagram ? "Watch this reel on Instagram →" : "@masstdev on Instagram →"}
        </a>
      </div>
    </section>
  );
}
