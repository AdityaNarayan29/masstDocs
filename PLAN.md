# masstDocs restructure plan

Written 8 Nov 2026. Work through the steps in order, one step per session.

## How to continue

1. Open this file and find the first step whose status is not `done`.
2. If it says **Needs founder**, ask for that input first and don't start the step without it.
3. Do the tasks and tick each box as it's finished.
4. Check the **Done when** list: run `pnpm build` and check the affected pages on `pnpm dev:fast -p 3005`.
5. Set the step's status to `done` and add a line to the log at the bottom.
6. Commit or push only when the founder asks. Deploys go through a GitHub push (Vercel deploys `main`), never `vercel deploy`.

Ground rules for every step:
- **Keep existing URLs.** The tracks are a navigation layer only. If a page has to move or merge, add a redirect in `next.config.mjs` in the same step.
- New pages follow the outline of the AI section (see Step 6).
- Diagrams are Mermaid. Run `pnpm pre-render-mermaid` before building whenever diagrams change.

## Where we are starting from

- About 230 MDX pages and about 340,000 words across six tabs: `/sd`, `/hld`, `/lld`, `/dsa`, `/ai`, `/reels`.
- Average depth per page: AI ~3,700 words, DSA ~2,400, HLD ~2,200, LLD ~870. Core system design is much thinner: building blocks ~460, communication ~370, architecture ~420, security ~630, observability ~580.
- The homepage is titled "System Design Roadmap" and its roadmap only links to `/sd`, `/hld` and `/lld`.
- `middleware.ts` blocks AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended and others), so AI answer engines can't read or cite the site. This works against the SEO work done in June.
- A site-wide AI chat widget is mounted in `app/layout.tsx`. `/api/chat` returns 500 when the Groq, Hugging Face or Pinecone keys are missing.
- `ARCHITECTURE.md` is out of date (it describes 130 pages and two tabs).

**Target position:** "System design and AI engineering, explained in diagrams. Free, with a new reel every day." The site is organised as three tracks, and reels lead into them.

---

## Step 0 — Founder inputs and decisions
Status: `done` · **Needs founder**

- [x] ~~Traffic data~~ skipped for now; revisit at Step 8 from Vercel Analytics for the last 90 days: top 20 pages, top referrers (Instagram, Google, direct) and top countries.
- [x] Confirm the target position above, or change it.
- [x] AI crawler policy: allow AI crawlers so the site can be cited in AI answers (recommended), or keep blocking them.
- [x] Chat widget: keep it site-wide for now, or hide it until Step 7.

**Done when:** all four answers are written in the log. If the traffic data changes priorities, reorder Steps 4–7 here first.

## Step 1 — Housekeeping
Status: `done` · Depends on Step 0 (crawler and chat answers)

- [x] Apply the crawler decision in `middleware.ts` (remove AI bots from `BLOCKED_BOTS` if allowed) and in `public/robots.txt`.
- [x] When chat keys are missing, hide `ChatWidget` and have `/api/chat` and `/api/research` return a clean 503 instead of a 500.
- [x] Remove the hidden `sr-only` SEO paragraph on the homepage. Search engines can penalise hidden text.
- [x] Rewrite `ARCHITECTURE.md` to match the current six scoped sources in `lib/source.ts`, the chat and research APIs, and the reels section.
- [x] Replace the boilerplate `README.md` with what the site is, how to run it (`pnpm dev:fast`) and which environment variables it needs.

**Done when:** `pnpm build` passes, and the site runs locally with no `.env` and shows no chat errors.

## Step 2 — Positioning copy
Status: `done` · Depends on Step 0

- [x] Site title, default description and Open Graph / Twitter metadata in `app/layout.tsx`.
- [x] Generated Open Graph image in `app/opengraph-image.tsx`.
- [x] `manifest.json` name and description.
- [x] One-line descriptions for each tab in `sidebarTabs` (`app/layout.config.tsx`).

**Done when:** every surface uses the new line and none still say "System Design Roadmap" as the whole identity.
Not changed: `twa-manifest.json` (Android app; needs an app rebuild, so leave it until the app is next released).


## Step 3 — Three-track navigation
Status: `done` · Depends on Step 2

The URLs stay the same. Only the grouping and labels change.

| Track | Covers | Routes |
|---|---|---|
| Concepts | How systems and AI systems work | `/sd`, `/ai` |
| Designs | Worked designs, high level and code level | `/hld`, `/lld` |
| Interview | Patterns and a framework for interviews | `/dsa`, plus `/sd/fundamentals/solve` and `/sd/fundamentals/estimate` |
| Reels | Notes for each reel (entry point) | `/reels` |

- [x] Group `sidebarTabs` by track (track label above its tabs, or track-prefixed titles if Fumadocs tabs can't nest).
- [x] Add a short "In this track" intro and a "Next track" link to each tab's index page.
- [x] Link the interview framework pages (`solve`, `estimate`) from the `/dsa` index.
- [x] Index reel notes in search (`app/api/search/route.ts` skips `reelsSource` today) and add a Reels tag.
- [x] Make search filters match the tracks (`components/search/CustomSearchDialog.tsx`).

**Done when:** a new visitor can tell from the sidebar alone which three tracks exist. All old URLs still return 200.
How it was done: Fumadocs tabs can't nest, so tabs are ordered by track (SD, AI, HLD, LLD, DSA, Reels) with a coloured icon and a track label. One source of truth: `lib/tracks.ts`. Index pages use `<TrackNav section="..." />` (`components/mdx/TrackNav.tsx`). Step 4 should read the homepage tracks from `lib/tracks.ts` too.


## Step 4 — Homepage rebuild
Status: `done` · Depends on Step 3

- [x] New hero with the position line and two buttons: "Start learning" (Concepts) and "Watch the reels" (`/reels`).
- [x] Three track cards showing page counts and a first page for each.
- [x] Extend `SystemDesignRoadmap` data to cover DSA and AI (now generated from the page trees by `lib/roadmap.ts`; old progress migrated via `lib/roadmap-legacy.ts`), so all ~230 pages are reachable from the roadmap. Keep progress tracking.
- [x] A "Latest reels" strip with the newest 4 notes pages, read from `content/docs/reels/meta.json` so it updates by itself.
- [x] Keep the company case-study grid, moved below the tracks.

**Done when:** the homepage links into all six sections, works on a phone, and Lighthouse performance is no worse than before.
Not measured: Lighthouse. The homepage is now a static server-rendered page (first load 154 kB) instead of a client page, which should help, but run Lighthouse on the Vercel preview before calling it.


## Step 5 — Reels as the way in
Status: `done` · Depends on Step 3

- [x] Add a `<GoDeeper>` component (rendered automatically by `app/reels` from frontmatter, so authors can't forget it): a "go deeper" card shown after each reel's notes, with the track, 2–3 related pages and a "next reel" link.
- [x] Add a reel notes template (frontmatter: reel number, date, Instagram URL, track, related pages).
- [x] Add `scripts/new-reel.mjs`: it creates the notes page from the template and adds it to `reels/meta.json`.
- [x] Update the existing reel pages (#36–#41) to the template.
- [x] Track "reel page → course page" clicks with a Vercel Analytics custom event.

**Done when:** a new reel page can be created with one command, and every reel page links into a track.

## Step 6 — Bring core system design up to the AI-section standard
Status: `in progress` · 6.0 written, **needs founder sign-off** before 6.1–6.9

Page outline (adapted from the AI section): the problem it solves → key idea → diagram walkthrough → how it works in detail → variants and trade-offs → numbers (latency, throughput, cost) → common mistakes → when not to use it → how it shows up in interviews (with follow-up questions) → real systems that use it → quick-reference card. Aim for 1,500–2,500 words per page.

- [x] **6.0** Write the outline as `content/TEMPLATE-concept.mdx` and a sample page (`building-blocks/load-balancer`, ~2,400 words, 3 new diagrams). **Waiting for the founder's sign-off.**
- [ ] **6.1 Caching and traffic:** load-balancer, reverse-proxy, cdn, dns, cache-strategies, cache-aside, write-through, write-behind. Decide whether to merge the three cache pattern pages into `cache-strategies` (this needs redirects).
- [ ] **6.2 Data distribution:** sharding, consistent-hashing, bloom-filters, rate-limiting, heartbeat.
- [ ] **6.3 Async and coordination:** message-queues, pub-sub, task-queues, distributed-locking, leader-election.
- [ ] **6.4 Communication:** http, rest, graphql, grpc, websockets, sse, webhooks.
- [ ] **6.5 Reliability patterns:** idempotency, retry, circuit-breaker, bulkhead, saga, cqrs, event-sourcing, strangler-fig.
- [ ] **6.6 Architecture:** api-gateway, bff, service-discovery, service-mesh.
- [ ] **6.7 Security and observability:** authentication, authorization, api-security, encryption, logging, monitoring, tracing.
- [ ] **6.8 Fundamentals:** list the 22 fundamentals pages under 1,000 words and upgrade them, starting with what-is-system-design, scalability, cap-theorem and consistency.
- [ ] **6.9** Cross-link each upgraded concept page from the HLD case studies that use it, and back again.

**Done when (per batch):** every page in the batch follows the outline, diagrams are pre-rendered, internal links resolve, and `pnpm build` passes.

## Step 7 — Practice loop
Status: `done` (except the chat widget decision) · Depends on Step 1 (chat keys handled)

- [x] Add a "Try it yourself" block to each of the 23 HLD case studies: the prompt, the requirements to cover, and hints that open one at a time.
- [x] Add a `/api/review` endpoint using the existing Groq setup. It takes the reader's design, compares it against the case study (from the page's own search data instead of Pinecone, so only `GROQ_API_KEY` is needed) and returns what they covered, what they missed and follow-up questions. Rate-limited.
- [x] Add a `<PracticeBox>` component, saving answers and scores in the browser.
- [x] Repeat for the 24 LLD case studies (class design instead of architecture).
- [ ] Decide what to do with the generic chat widget. Recommendation: keep it for now and decide from Step 8 data (chat use vs practice submissions).

**Done when:** a reader can submit a design for any HLD case study and get structured feedback, and the page still works with no keys (the box is simply hidden).
Changed from the plan: without keys the exercise and hints still show; only the feedback button is hidden. Not verified: a real model review (no Groq key locally). Every other path was tested: validation, unknown page, injection guard, rate limit (429 after 5/min), and the Groq call itself (reached Groq, rejected only for the fake key).


## Step 8 — Measure and adjust
Status: `waiting` · Instrumentation is in place; review about 4 weeks after Steps 4–7 go live

- [ ] Compare against the Step 0 baseline: pages per visit, reel → course click-through, practice submissions, returning visitors.
- [ ] Choose the next batch from the data: more Step 6 pages, more practice, or more reels.
- [ ] Update this plan with what was learned.

---

Events to read in Vercel Analytics: `reel_to_course`, `reel_to_reel`, `practice_hint`, `practice_submit`, plus page views per section.

## Log

- 2026-11-08 — Plan written. Repo cloned to `~/Projects/masstDocs`; runs on `pnpm dev:fast -p 3005`. Next: Step 0 (needs founder).
- 2026-11-08 — Step 0 decisions: position confirmed as written; allow AI crawlers; keep the chat widget on the live site but hide it when keys are missing, decide its future at Step 7; traffic data skipped for now.
- 2026-11-08 — Step 1 done: AI crawlers allowed (`middleware.ts`, `robots.txt`, removed the `noai` header in `next.config.mjs`); CDN caching extended to all six sections; chat widget hidden without keys (APIs already returned 503); hidden homepage SEO text removed; `ARCHITECTURE.md` and `README.md` rewritten. Note: `next build` regenerates `public/sw.js`; revert it unless you mean to ship it.
- 2026-11-08 — Step 2 done: new title, description, Open Graph and Twitter copy (root and home layouts), JSON-LD covers DSA and AI, new OG image (also fixed clipped headline), manifest description, tab descriptions prefixed by track. Build and type check pass. Next: Step 3.
- 2026-11-08 — Step 3 done: `lib/tracks.ts` defines tracks and sections; sidebar tabs reordered by track with icons and track labels; `<TrackNav>` bar on all six index pages (siblings, next section, interview framework links on /dsa); reels indexed in search with a Reels chip; search chips and colours come from `lib/tracks.ts`. Also fixed 15 broken relative links on the /hld index (they pointed to /case-studies/*, a 404). Build, type check and lint pass. Note: don't run `next build` while the dev server is running (they share `.next`). Next: Step 4.
- 2026-11-08 — Step 4 done: homepage is now a server component with hero (Start learning / Watch the reels), three track cards with live page counts and start pages, latest 4 reels (newest by reel number), the full roadmap generated from all six page trees (211 topics, coloured by section, old progress migrated), then the company / LLD / AI grids and popular topics. Removed the HLD/LLD/BOTH legend, the "Why learn system design" block and the duplicate social row. Checked desktop and a 390px viewport (no horizontal scroll). Build passes. Next: Step 5.
- 2026-11-09 — Production deploy of 905c466 (reels #40, #41) had failed because `reels/index.mdx` used the uncommitted `TrackNav`. With the founder's OK, pushed only the fix (a9b0e66: TrackNav, lib/tracks.ts, mdx-components). Vercel deploy succeeded; /reels/41 is live. Everything else is still uncommitted.
- 2026-11-09 — Step 5 done: reel frontmatter fields (`reel`, `date`, `instagram`, `related`) in `source.config.ts` (added `zod` 4.1.5 as a direct dependency); `GoDeeper` card under every reel (related pages, track, previous/next reel, Instagram); Vercel Analytics events `reel_to_course` and `reel_to_reel`; `content/TEMPLATE-reel.mdx` + `pnpm new-reel` (tested end to end, then removed the test reel); reels #36–#41 migrated. No reel dates or per-reel Instagram links were added: they aren't known, fill them in when available. Next: Step 6.0.
- 2026-11-09 — Step 6.0: `content/TEMPLATE-concept.mdx` and the rewritten Load Balancer page (problem, key idea, L4 vs L7, algorithms incl. power of two choices, health checks, draining, sessions, redundancy, variants, numbers, six mistakes, interview answer and follow-ups, real systems, quick reference). Diagrams pre-rendered with `PUPPETEER_EXECUTABLE_PATH` pointed at system Chrome (also rendered the missing #40/#41 reel diagrams). Waiting for founder sign-off before 6.1–6.9.
- 2026-11-09 — Step 7 done: 47 exercises (`lib/practice/`), `PracticeBox` + top-of-page nudge on every HLD/LLD case study, `/api/review` (Groq JSON mode, zod-validated, 5/min/IP). Build passes. Chat widget decision left to the founder (recommend keep).
- 2026-11-09 — Step 8: analytics events in place; the review itself has to wait for data.
- 2026-11-10 — Diagrams rebuilt (founder asked: sizes inconsistent, broken in dark mode, images heavy, client rendering slow). Causes: all 909 SVGs shared id `my-svg` so styles and arrowheads collided between diagrams; size followed each diagram's shape (179–4,113px wide); 599 hard-coded pastel fills; two SVGs per diagram. Now one theme-aware SVG per diagram (colours as CSS variables, `lib/diagram-theme.mjs` + `lib/diagram-svg.mjs`), Inter font, unique ids, consistent sizing rule with scroll hint, click-to-zoom dialog. 905 diagrams re-rendered in ~5 s, 0 failures; SVG total 41.7 MB → 22.4 MB. Build passes.

- 2026-11-10 — Fixed hydration error on page footers (also live in production): all six loaders' page trees had $id "root", and Fumadocs caches the prev/next list per root.$id in a module-level map, so the server reused another section's list (production HTML had no prev/next links). `lib/source.ts` now gives each tree a unique id. 14 pages checked in Chrome: 0 console errors, correct footers.
- 2026-11-12 — Redesign built into the site, following the founder-approved draft (Masst Reels v2): Masst theme in light and dark (`app/theme.css`, Nunito, JetBrains Mono), notebook layout with tracks in the top bar and section tabs, phone tab bar, read checkmarks in the sidebar, article reading progress / reading time / mark as done / right rail, new server-rendered home page with connected SVG diagrams and continue/practice/progress cards, `/roadmap` page, track filters in search, neutral roadmap and reel cards (colour only for meaning), diagrams re-rendered in Nunito with the pastel fills mapped to state tints. Reels #42–#44 moved to the new frontmatter. Checked: 16 page types with 0 console or hydration errors, mark-as-done / progress / search filter flows, light and dark, desktop and phone; production build passes. Not changed: the AI-architecture explainer page and chat widget keep their own colours.

