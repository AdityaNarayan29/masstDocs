# MasstDocs — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                           │
│                     https://docs.masst.dev                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP requests
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE / CDN                          │
│              Static pages served from edge cache                │
│              ISR for pre-rendered MDX content                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NEXT.JS 15 APPLICATION                        │
│                   React 19 + TypeScript                         │
│                   Tailwind CSS v4 + Fumadocs UI                 │
│                                                                 │
│  ┌──────────────── App Router ────────────────────────────┐    │
│  │                                                         │    │
│  │  (home)/     Landing page + SystemDesignRoadmap         │    │
│  │  /sd/*       Full system design docs (all sections)     │    │
│  │  /hld/*      HLD case studies only (filtered view)      │    │
│  │  /api/search Search endpoint (Fumadocs built-in)        │    │
│  │                                                         │    │
│  └────────┬──────────────┬──────────────┬─────────────────┘    │
│           │              │              │                        │
│           ▼              ▼              ▼                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │  Fumadocs    │ │  MDX Content │ │   Custom     │           │
│  │  Core        │ │  Pipeline    │ │   Components │           │
│  │              │ │              │ │              │           │
│  │ Source loader│ │ 130+ MDX     │ │ ReactFlow    │           │
│  │ Page tree    │ │ files parsed │ │ Mermaid      │           │
│  │ Search index │ │ at build     │ │ Roadmap      │           │
│  │ HLD filter   │ │ time         │ │ DocsRenderer │           │
│  └──────────────┘ └──────┬───────┘ └──────────────┘           │
│                          │                                      │
│                          ▼                                      │
│                 ┌──────────────────┐                            │
│                 │  Build Plugins   │                            │
│                 │                  │                            │
│                 │ remark-mermaid   │                            │
│                 │ -inline          │                            │
│                 │ (pre-renders     │                            │
│                 │  diagrams → SVG) │                            │
│                 └──────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

## Content Architecture

```
content/docs/                        130+ MDX files across 10 sections
├── index.mdx                        Root landing page
│
├── fundamentals/                    Core system design concepts
│   ├── what-is-system-design        ├── scalability
│   ├── availability                 ├── consistency (strong/weak/eventual)
│   ├── cap-theorem                  ├── pacelc-theorem
│   ├── latency-throughput           ├── replication
│   ├── failover                     ├── capacity-planning
│   ├── SOLID                        ├── design-patterns-lld
│   ├── microservices                ├── micro-frontends
│   ├── monorepo                     ├── estimate
│   └── solve
│
├── building-blocks/                 Infrastructure components
│   ├── dns                          ├── cdn
│   ├── load-balancer                ├── reverse-proxy
│   ├── sharding                     ├── consistent-hashing
│   ├── bloom-filters                ├── indexing
│   ├── cache-aside                  ├── cache-strategies
│   ├── write-through                ├── write-behind
│   ├── message-queues               ├── pub-sub
│   ├── task-queues                  ├── leader-election
│   └── distributed-locking
│
├── communication/                   Protocols & patterns
│   ├── http                         ├── rest
│   ├── graphql                      ├── grpc
│   ├── websockets                   └── sse
│
├── architecture/                    Architectural patterns
│   ├── api-gateway                  └── service-discovery
│
├── design-patterns/                 Distributed system patterns
│   ├── circuit-breaker              ├── bulkhead
│   ├── cqrs                         ├── event-sourcing
│   ├── saga                         └── strangler-fig
│
├── security/                        Auth & encryption
│   ├── authentication               ├── authorization
│   ├── api-security                 └── encryption
│
├── observability/                   Monitoring & tracing
│   ├── logging                      ├── monitoring
│   └── tracing
│
├── system-components/               Interactive system design canvas
│   └── db                           (+ Flow component)
│
└── case-studies/                    26 real-world HLD/LLD designs
    ├── url-shortener                ├── instagram
    ├── whatsapp                     ├── netflix
    ├── uber                         ├── twitter
    ├── youtube                      ├── slack
    ├── amazon                       ├── stripe
    ├── coinbase                     ├── google-drive
    ├── google-docs                  ├── dropbox-sign
    ├── leetcode                     ├── chess-com
    ├── atm-system                   ├── parking-lot
    ├── ticket-booking               ├── notification-system
    ├── rate-limiter                 ├── pastebin
    ├── web-crawler                  ├── typeahead
    └── news-feed
```

## Routing & Navigation

```
┌─────────────────────────────────────────────────────────┐
│                    Sidebar Tabs                          │
│                                                         │
│  ┌─────────────────────┐  ┌──────────────────────────┐ │
│  │  System Design (/sd) │  │ System Design - HLD (/hld)│ │
│  │  All 10 sections     │  │ Case studies only         │ │
│  │  130+ pages          │  │ 26 pages (filtered)       │ │
│  └──────────┬──────────┘  └──────────┬───────────────┘ │
│             │                        │                   │
└─────────────┼────────────────────────┼───────────────────┘
              │                        │
              ▼                        ▼
       ┌─────────────┐         ┌─────────────┐
       │ lib/source.ts│         │ lib/source.ts│
       │             │         │             │
       │ source =    │         │ hldSource = │
       │ loader({    │         │ filtered    │
       │   baseUrl:  │         │ loader({    │
       │   "/sd"     │         │   baseUrl:  │
       │ })          │         │   "/hld"    │
       │             │         │ })          │
       │ Full page   │         │ Only pages  │
       │ tree        │         │ under       │
       └──────┬──────┘         │ case-studies│
              │                └──────┬──────┘
              ▼                       ▼
       ┌─────────────┐         ┌─────────────┐
       │ /sd/[[slug]] │         │/hld/[[slug]]│
       │ page.tsx     │         │ page.tsx    │
       │             │         │             │
       │ DocsRenderer│         │ DocsRenderer│
       │ (generic)   │         │ + HLD       │
       │             │         │   landing   │
       └─────────────┘         └─────────────┘
```

## Data Flow

```
1. BUILD TIME      source.config.ts → fumadocs-mdx scans content/docs/
                   → Parses all 130+ MDX files → Generates page tree
                   → remark-mermaid-inline pre-renders diagrams to SVG

2. PAGE REQUEST    User → /sd/building-blocks/load-balancer
                   → [[...slug]]/page.tsx receives slug=["building-blocks","load-balancer"]
                   → source.getPage(slug) → returns MDX page data
                   → DocsRenderer renders MDX with custom components
                   → Returns: DocsPage with title, body, ToC, breadcrumbs

3. HLD FILTER      User → /hld/case-studies/instagram
                   → hldSource checks: slugs[0] === "case-studies" ✓
                   → Page included in filtered tree → renders normally
                   User → /hld/fundamentals/scalability
                   → hldSource checks: slugs[0] === "fundamentals" ✗
                   → Page excluded → 404

4. SEARCH          User → types query in search bar
                   → POST /api/search → Fumadocs search index
                   → Returns: matching pages with titles + descriptions

5. MERMAID         Build: scripts/pre-render-mermaid.mjs → @mermaid-js/mermaid-cli
                   → Scans MDX for ```mermaid blocks → Renders to SVG files
                   Runtime: remarkMermaidInline plugin inlines pre-rendered SVGs
                   Fallback: <Mermaid /> client component renders dynamically

6. HOME PAGE       User → / → (home)/page.tsx
                   → Renders SystemDesignRoadmap (interactive learning tree)
                   → Progress tracked in localStorage
                   → Click topic → navigate to /sd/... page
```

## Custom Components

### SystemDesignRoadmap (`components/ui/SystemDesignRoadmap.tsx`)
```
Features:
  Interactive learning tree with 10 sections + nested topics
  Search with keyboard nav (Ctrl/Cmd + K)
  Progress tracking (localStorage-based visit history)
  Design type badges (HLD / LLD / BOTH)
  Expandable/collapsible sections
  Animated connector lines (SVG)
  Responsive grid layout
  Light/dark theme support

State:
  expandedNodes    Set<string>     Which sections are open
  visitedNodes     Set<string>     Which topics user has visited
  searchQuery      string          Current search input
  searchResults    Topic[]         Filtered matches
```

### Flow (`components/ui/Flow.tsx`)
```
Library: ReactFlow v11.11.4
Purpose: Interactive system component visualization
Features:
  Draggable nodes with custom handles
  Reset button to restore initial state
  Themed styling (fd-border, fd-bg, fd-fg)
  Memory leak prevention on unmount
Usage: <Flow /> in system-components/index.mdx
```

### Mermaid (`components/mdx/mermaid.tsx`)
```
Purpose: Client-side fallback for Mermaid diagrams
Pipeline:
  Build time: pre-render-mermaid.mjs → SVG files
  → remarkMermaidInline inlines SVGs into MDX (fast, no JS)
  → If SVG missing: <Mermaid /> component renders client-side
Features:
  Lazy loads mermaid library
  Dark/light theme detection
  Loading skeleton with animation
  Error handling with user-friendly messages
```

### DocsRenderer (`components/DocsRenderer.tsx`)
```
Purpose: Generic MDX page renderer (shared by /sd and /hld)
Props: source (loader instance), slug (page path)
Flow: getPage(slug) → notFound() if missing → render MDX
Layout: DocsPage → DocsBody → DocsTitle + DocsDescription
```

## Project Structure

```
masstDocs/
├── app/
│   ├── layout.tsx                 Root layout (RootProvider, SEO, PWA)
│   ├── layout.config.tsx          Shared nav config (logo + title)
│   ├── global.css                 Global styles
│   ├── (home)/
│   │   ├── layout.tsx             Home layout
│   │   └── page.tsx               Landing page + SystemDesignRoadmap
│   ├── sd/
│   │   ├── layout.tsx             DocsLayout (full page tree, sidebar tabs)
│   │   └── [[...slug]]/page.tsx   Dynamic page handler → DocsRenderer
│   ├── hld/
│   │   ├── layout.tsx             DocsLayout (filtered HLD tree)
│   │   └── [[...slug]]/page.tsx   HLD landing + DocsRenderer
│   └── api/search/route.ts        Fumadocs search endpoint
│
├── content/docs/                   130+ MDX files (10 sections)
│   ├── fundamentals/              Core concepts (17 pages)
│   ├── building-blocks/           Infrastructure (17 pages)
│   ├── communication/             Protocols (6 pages)
│   ├── architecture/              Patterns (2 pages)
│   ├── design-patterns/           Distributed patterns (6 pages)
│   ├── security/                  Auth & encryption (4 pages)
│   ├── observability/             Monitoring (3 pages)
│   ├── system-components/         Interactive canvas (1 page)
│   └── case-studies/              Real-world designs (26 pages)
│
├── components/
│   ├── DocsRenderer.tsx           Generic MDX page renderer
│   ├── mdx/
│   │   └── mermaid.tsx            Mermaid diagram fallback
│   └── ui/
│       ├── Flow.tsx               ReactFlow system canvas
│       └── SystemDesignRoadmap.tsx Interactive learning tree (1390 lines)
│
├── lib/
│   ├── source.ts                  Fumadocs source config (source + hldSource)
│   └── remark-mermaid-inline.mjs  Build plugin: inlines pre-rendered SVGs
│
├── scripts/
│   ├── pre-render-mermaid.mjs     Pre-renders mermaid → SVG at build time
│   └── watch-mermaid.mjs          Dev watcher for mermaid changes
│
├── public/
│   ├── logo.png                   Site logo
│   ├── manifest.json              PWA manifest
│   ├── sw.js                      Service worker
│   └── app-icons/                 PWA icons (150–1024px)
│
├── source.config.ts               Fumadocs MDX config + remark plugins
├── mdx-components.tsx             Custom MDX component exports
├── package.json                   Dependencies + scripts
├── tsconfig.json                  TypeScript config
├── next.config.mjs                Next.js config
└── postcss.config.mjs             PostCSS + Tailwind
```

## Build Pipeline

```
1. INSTALL         pnpm install → fumadocs-mdx postinstall generates .source/

2. PRE-RENDER      npm run pre-render-mermaid
                   → scripts/pre-render-mermaid.mjs
                   → Scans content/docs/**/*.mdx for ```mermaid blocks
                   → @mermaid-js/mermaid-cli renders each to SVG
                   → Stores SVGs for remarkMermaidInline to inline

3. BUILD           next build
                   → source.config.ts: fumadocs-mdx parses all MDX
                   → remarkMermaidInline: inlines pre-rendered SVGs
                   → Static generation: generateStaticParams() for all pages
                   → Output: .next/ with pre-rendered HTML + client bundles

4. DEV             npm run dev → pre-render-mermaid + next dev --turbo
                   npm run dev:fast → next dev --turbo (skip mermaid pre-render)
                   npm run dev:watch → watches mermaid changes + re-renders
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15.4 + React 19 | App Router, SSG, ISR |
| Language | TypeScript 5.8 | Type safety across project |
| Documentation | Fumadocs (core + mdx + ui) v15.7 | Source loading, page tree, layouts, search |
| Content | MDX (130+ files) | Markdown + JSX for documentation |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| Diagrams | Mermaid 11.11 | Flowcharts, sequence diagrams, architecture |
| Interactive Graphs | ReactFlow 11.11 | Draggable system component canvas |
| Theme | next-themes 0.4 | Dark/light mode toggle |
| PWA | Service Worker + manifest.json | Offline support, installable app |
| SEO | JSON-LD + Open Graph + Twitter Cards | Search engine optimization |
| Package Manager | pnpm 10.12 | Fast, disk-efficient installs |
| Linting | ESLint 8 + eslint-config-next | Code quality |
| Hosting | Vercel | Edge deployment, CDN, preview deploys |

## Content Sections

| Section | Pages | Topics |
|---------|-------|--------|
| Fundamentals | 17 | Scalability, CAP, consistency models, replication, failover, SOLID, microservices |
| Building Blocks | 17 | DNS, CDN, load balancer, caching (4 strategies), queues, sharding, bloom filters |
| Communication | 6 | HTTP, REST, GraphQL, gRPC, WebSockets, SSE |
| Architecture | 2 | API Gateway, Service Discovery |
| Design Patterns | 6 | Circuit Breaker, Bulkhead, CQRS, Event Sourcing, Saga, Strangler Fig |
| Security | 4 | Authentication, Authorization, API Security, Encryption |
| Observability | 3 | Logging, Monitoring, Distributed Tracing |
| System Components | 1 | Database types (interactive Flow canvas) |
| Case Studies | 26 | URL shortener, Instagram, WhatsApp, Netflix, Uber, Twitter, YouTube, Slack, etc. |
| **Total** | **82+** | |

## HLD Filtering Logic (`lib/source.ts`)

```
Configuration:
  HLD_FOLDERS = ["case-studies"]

Filtering:
  rawHldSource = loader({ baseUrl: "/hld", source: docs })

  hldSource = {
    pageTree:       filter children where slugs[0] ∈ HLD_FOLDERS
    getPages():     rawHldSource.getPages().filter(isHLDPage)
    getPage(slug):  return page only if slugs[0] ∈ HLD_FOLDERS
    generateParams: filter static params to HLD pages only
  }

Adding new HLD sections:
  HLD_FOLDERS = ["case-studies", "new-section"]
  → Automatically included in /hld/ tab
```

## PWA & SEO

```
PWA:
  Service Worker:    public/sw.js (registered in root layout)
  Manifest:          public/manifest.json
  Icons:             public/app-icons/ (150px → 1024px)
  Capabilities:      Offline support, installable on mobile/desktop

SEO:
  Canonical URL:     https://docs.masst.dev/
  Open Graph:        Title, description, type, image, site_name
  Twitter Card:      summary_large_image + @masstdev
  JSON-LD:           WebSite schema with publisher Organization
  Per-page meta:     generateMetadata() exports title + description from frontmatter

Android:
  TWA link:          android-app://com.masst.docs/https/docs.masst.dev/
  Asset links:       For native app verification
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Pre-render mermaid + start dev server (Turbopack) |
| `pnpm dev:fast` | Start dev server without mermaid pre-render |
| `pnpm dev:watch` | Watch mermaid files and re-render on change |
| `pnpm build` | Pre-render mermaid + production build |
| `pnpm start` | Start production server |
| `pnpm postinstall` | Generate Fumadocs `.source/` directory |
