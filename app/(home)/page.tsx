import Link from "next/link";
import { HeroDiagram } from "@/components/home/HeroDiagram";
import { FeatureDiagram } from "@/components/home/FeatureDiagram";
import { ContinueCard, SectionProgress, TodaysPractice } from "@/components/home/HomeCards";
import { LOADERS, latestReels, pageCount } from "@/lib/roadmap";
import { HLD_PRACTICE } from "@/lib/practice/hld";
import { LLD_PRACTICE } from "@/lib/practice/lld";
import { INTERVIEW_FRAMEWORK, SECTIONS, TRACKS, sectionsInTrack } from "@/lib/tracks";
import { socialLinks } from "@/app/layout.config";

const INSTAGRAM = "https://www.instagram.com/masstdev/";

const POPULAR_TOPICS = [
  { title: "CAP Theorem", url: "/sd/fundamentals/cap-theorem" },
  { title: "Load Balancers", url: "/sd/building-blocks/load-balancer" },
  { title: "Caching Strategies", url: "/sd/building-blocks/cache-strategies" },
  { title: "Database Sharding", url: "/sd/building-blocks/sharding" },
  { title: "Message Queues", url: "/sd/building-blocks/message-queues" },
  { title: "Microservices", url: "/sd/fundamentals/microservices" },
  { title: "Netflix design", url: "/hld/netflix" },
  { title: "Uber design", url: "/hld/uber" },
  { title: "WhatsApp design", url: "/hld/whatsapp" },
  { title: "Parking lot (LLD)", url: "/lld/case-studies/parking-lot" },
  { title: "SOLID Principles", url: "/lld/foundations/solid" },
  { title: "Sliding Window", url: "/dsa/patterns/arrays-strings/sliding-window" },
  { title: "RAG retrieval", url: "/ai/retrieval" },
  { title: "LLM agents", url: "/ai/agents" },
];

/** "Design a URL shortener like bit.ly that …" → "Design a URL shortener". */
function shortPrompt(prompt: string) {
  const cut = [":", " like ", " that ", " with ", ", ", "."]
    .map((sep) => prompt.indexOf(sep))
    .filter((i) => i > 0);
  return cut.length ? prompt.slice(0, Math.min(...cut)) : prompt;
}

/** Cover-style headline for a reel card: the title without its "#43 · " prefix. */
const reelHeadline = (title: string) => title.replace(/^#\d+\s*·\s*/, "");

export default function HomePage() {
  const reels = latestReels(4);
  const newest = reels[0];
  const totalPages = SECTIONS.reduce((sum, s) => sum + pageCount(s.id), 0);
  const practice = Object.entries(HLD_PRACTICE).map(([url, p]) => ({ url, title: shortPrompt(p.prompt) }));
  const pagesOf = (id: (typeof SECTIONS)[number]["id"]) => LOADERS[id].getPages().map((p) => p.url);
  const learnTracks = TRACKS.filter((t) => t.id !== "reels");

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 pb-16 md:px-6">
      {/* Hero */}
      <section className="flex flex-wrap items-center gap-12 pt-14 pb-12 md:pt-[72px]">
        <div className="min-w-0 flex-[1_1_520px]">
          {newest && (
            <Link
              href={newest.url}
              className="inline-flex max-w-full items-center gap-2.5 rounded-full border bg-fd-card py-1.5 pr-3.5 pl-1.5 text-[13px] font-bold text-[var(--m-ink-2)] hover:bg-fd-accent"
            >
              <span className="shrink-0 whitespace-nowrap rounded-full bg-[var(--m-tint)] px-2.5 py-0.5 text-[11px] font-extrabold tracking-[0.12em] text-[var(--m-info)]">NEW REEL</span>
              <span className="truncate">{newest.title}</span>
              <span aria-hidden="true" className="text-fd-muted-foreground">→</span>
            </Link>
          )}
          <h1 className="mt-6 text-[40px] leading-[1.04] font-extrabold tracking-[-0.035em] sm:text-[52px] lg:text-[60px]">
            System design and AI engineering, <span className="text-fd-muted-foreground">explained in diagrams.</span>
          </h1>
          <p className="mt-5 max-w-[540px] text-lg leading-relaxed font-medium text-[var(--m-ink-2)] sm:text-[19px]">
            Free, from the basics to real designs like Netflix, UPI and ChatGPT. A new reel every day at 9:30 PM IST, with notes here.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={TRACKS[0]!.start.url} className="inline-flex h-12 items-center gap-2 rounded-[14px] bg-fd-primary px-[22px] text-[15px] font-extrabold text-fd-primary-foreground hover:opacity-90">
              Start learning <span aria-hidden="true">→</span>
            </Link>
            <Link href="/reels" className="inline-flex h-12 items-center gap-2 rounded-[14px] border bg-fd-card px-[22px] text-[15px] font-extrabold hover:bg-fd-accent">
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
              Watch the reels
            </Link>
          </div>
          <p className="mt-7 text-[13px] font-bold tracking-[0.12em] text-fd-muted-foreground">
            {Math.floor(totalPages / 10) * 10}+ PAGES · 900+ DIAGRAMS · {practice.length + Object.keys(LLD_PRACTICE).length} PRACTICE QUESTIONS
          </p>
        </div>
        <div className="min-w-0 flex-[1_1_420px]">
          <HeroDiagram />
        </div>
      </section>

      {/* Personal row */}
      <section aria-label="Your progress" className="grid gap-4 md:grid-cols-2">
        <ContinueCard fallback={TRACKS[0]!.start} />
        <TodaysPractice items={practice} />
      </section>

      {/* Tracks */}
      <section aria-labelledby="tracks" className="mt-[72px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="tracks" className="text-[32px] font-extrabold tracking-[-0.03em]">Three tracks</h2>
            <p className="mt-2 font-medium text-fd-muted-foreground">Learn how systems work, study real designs, then practise for the interview.</p>
          </div>
          <Link href="/roadmap" className="text-sm font-extrabold text-[var(--m-info)] hover:underline">
            See the full roadmap →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {learnTracks.map((track, i) => (
            <div key={track.id} className="flex flex-col rounded-3xl border bg-fd-card p-6">
              <span className="m-label">Track {i + 1}</span>
              <h3 className="mt-1.5 text-2xl font-extrabold tracking-[-0.02em]">{track.title}</h3>
              <p className="mt-1.5 mb-5 text-sm font-semibold text-fd-muted-foreground">{track.blurb}</p>
              <div className="flex flex-1 flex-col gap-3.5">
                {sectionsInTrack(track.id).map((s) => (
                  <SectionProgress key={s.id} title={s.title} url={s.url} pages={pagesOf(s.id)} />
                ))}
                {track.id === "interview" &&
                  INTERVIEW_FRAMEWORK.map((p) => (
                    <Link key={p.url} href={p.url} className="flex justify-between gap-3 text-[15px] font-extrabold hover:underline hover:underline-offset-4">
                      <span>{p.title}</span>
                      <span aria-hidden="true" className="text-fd-muted-foreground">→</span>
                    </Link>
                  ))}
              </div>
              <Link href={track.start.url} className="mt-6 text-sm font-extrabold hover:underline hover:underline-offset-4">
                Start: {track.start.title} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Latest reels, as 9:16 covers */}
      {reels.length > 0 && (
        <section aria-labelledby="reels" className="mt-[72px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="reels" className="text-[32px] font-extrabold tracking-[-0.03em]">Latest reels</h2>
              <p className="mt-2 font-medium text-fd-muted-foreground">Every reel has a notes page: the diagram, the interview words and the follow-up questions.</p>
            </div>
            <div className="flex gap-5 text-sm font-extrabold">
              <Link href="/reels" className="text-[var(--m-info)] hover:underline">All reel notes →</Link>
              <a href={INSTAGRAM} className="text-[var(--m-info)] hover:underline">Instagram →</a>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {reels.map((r) => {
              const number = r.url.split("/").pop()?.split("-")[0];
              return (
                <Link key={r.url} href={r.url} className="group flex flex-col">
                  {/* Covers are always the reel look (dark), whatever the site theme. */}
                  <span className="flex aspect-[9/13] flex-col justify-between rounded-[22px] border border-[#2c2c33] bg-[#060607] bg-[radial-gradient(420px_260px_at_50%_-40px,rgba(255,255,255,0.16),transparent_70%)] p-5 text-[#f5f5f7] transition-transform group-hover:-translate-y-0.5">
                    <span className="text-[10px] font-extrabold tracking-[0.2em] text-[#8e8e93]">SYSTEM DESIGN · #{number}</span>
                    <span className="text-[22px] leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-[26px]">{reelHeadline(r.title)}</span>
                    <span className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-[#8e8e93]">@masstdev</span>
                      <span className="grid size-[34px] place-items-center rounded-full bg-white/10">
                        <svg viewBox="0 0 24 24" className="size-3.5" fill="#f5f5f7" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                      </span>
                    </span>
                  </span>
                  <span className="mt-3 line-clamp-2 px-0.5 text-sm font-semibold text-fd-muted-foreground">{r.description}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Design of the week */}
      <section aria-labelledby="featured" className="mt-[72px] flex flex-wrap items-stretch gap-6 rounded-[28px] border bg-[var(--m-raised)] p-6 sm:p-8">
        <div className="flex min-w-0 flex-[1_1_380px] flex-col justify-center">
          <span className="m-label">Design of the week</span>
          <h2 id="featured" className="mt-2 text-[32px] leading-tight font-extrabold tracking-[-0.03em]">How Netflix streams to every screen</h2>
          <p className="mt-3 leading-relaxed font-medium text-[var(--m-ink-2)]">
            Encoding, the Open Connect CDN, recommendations and staying up when parts fail. 28 diagrams, then a practice question to try it yourself.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/hld/netflix" className="inline-flex h-11 items-center rounded-xl bg-fd-primary px-[18px] text-sm font-extrabold text-fd-primary-foreground hover:opacity-90">Read the case study</Link>
            <Link href="/hld/netflix#practice" className="inline-flex h-11 items-center rounded-xl border px-[18px] text-sm font-extrabold hover:bg-fd-accent">Practise it</Link>
          </div>
        </div>
        <div className="min-w-0 flex-[1_1_420px] rounded-[20px] border bg-fd-card p-5 [background-image:radial-gradient(circle_at_1px_1px,var(--m-dots)_1px,transparent_0)] [background-size:18px_18px]">
          <FeatureDiagram />
        </div>
      </section>

      {/* Popular topics: quick jumps (and internal links for search engines) */}
      <section aria-labelledby="popular" className="mt-[72px]">
        <h2 id="popular" className="m-label">Popular topics</h2>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {POPULAR_TOPICS.map((t) => (
            <Link key={t.url} href={t.url} className="rounded-full border bg-fd-card px-4 py-2 text-sm font-bold hover:bg-fd-accent">
              {t.title}
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-[72px] flex flex-wrap items-center justify-between gap-4 border-t pt-7 text-sm font-bold text-fd-muted-foreground">
        <span>Masst Docs · free forever</span>
        <div className="flex flex-wrap items-center gap-5">
          <Link href="/ai-architecture" className="hover:text-fd-foreground">How the AI chat works</Link>
          {socialLinks.map((l) =>
            l.type === "icon" ? (
              <a key={l.url} href={l.url} aria-label={l.label} className="hover:text-fd-foreground">
                {l.icon}
              </a>
            ) : null,
          )}
        </div>
      </footer>
    </main>
  );
}
