"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useRef, useEffect, useCallback } from "react";

const Mermaid = dynamic(
  () => import("@/components/mdx/mermaid").then((mod) => mod.Mermaid),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-40 rounded-xl border border-fd-border bg-fd-card/50 animate-pulse flex items-center justify-center">
        <span className="text-fd-muted-foreground text-sm">
          Loading diagram...
        </span>
      </div>
    ),
  }
);

// ─── Annotation data types ────────────────────────────────────────
interface Annotation {
  label: string;
  numbers: string;
  details: string;
  limitation?: string;
  tradeoff?: string;
  file?: string;
  color: "violet" | "blue" | "cyan" | "amber" | "emerald" | "rose" | "orange";
}

// ─── HoverChip: inline pill that reveals a popover on hover/click ──
function HoverChip({ annotation }: { annotation: Annotation }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<"bottom" | "top">("bottom");
  const chipRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const colorMap: Record<string, { chip: string; border: string; glow: string; badge: string }> = {
    violet: {
      chip: "bg-violet-500/10 text-violet-400 border-violet-500/30 hover:border-violet-400/60 hover:bg-violet-500/20",
      border: "border-violet-500/40",
      glow: "shadow-violet-500/10",
      badge: "bg-violet-500/20 text-violet-300",
    },
    blue: {
      chip: "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:border-blue-400/60 hover:bg-blue-500/20",
      border: "border-blue-500/40",
      glow: "shadow-blue-500/10",
      badge: "bg-blue-500/20 text-blue-300",
    },
    cyan: {
      chip: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:border-cyan-400/60 hover:bg-cyan-500/20",
      border: "border-cyan-500/40",
      glow: "shadow-cyan-500/10",
      badge: "bg-cyan-500/20 text-cyan-300",
    },
    amber: {
      chip: "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:border-amber-400/60 hover:bg-amber-500/20",
      border: "border-amber-500/40",
      glow: "shadow-amber-500/10",
      badge: "bg-amber-500/20 text-amber-300",
    },
    emerald: {
      chip: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:border-emerald-400/60 hover:bg-emerald-500/20",
      border: "border-emerald-500/40",
      glow: "shadow-emerald-500/10",
      badge: "bg-emerald-500/20 text-emerald-300",
    },
    rose: {
      chip: "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:border-rose-400/60 hover:bg-rose-500/20",
      border: "border-rose-500/40",
      glow: "shadow-rose-500/10",
      badge: "bg-rose-500/20 text-rose-300",
    },
    orange: {
      chip: "bg-orange-500/10 text-orange-400 border-orange-500/30 hover:border-orange-400/60 hover:bg-orange-500/20",
      border: "border-orange-500/40",
      glow: "shadow-orange-500/10",
      badge: "bg-orange-500/20 text-orange-300",
    },
  };

  const colors = colorMap[annotation.color] || colorMap.violet;

  const showPopover = useCallback(() => {
    clearTimeout(timeoutRef.current);
    if (chipRef.current) {
      const rect = chipRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setPosition(spaceBelow < 320 ? "top" : "bottom");
    }
    setOpen(true);
  }, []);

  const hidePopover = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  }, []);

  const keepOpen = useCallback(() => {
    clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <span className="relative inline-block">
      <button
        ref={chipRef}
        onMouseEnter={showPopover}
        onMouseLeave={hidePopover}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${colors.chip}`}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${annotation.limitation ? "bg-rose-400" : "bg-current"}`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${annotation.limitation ? "bg-rose-400" : "bg-current"}`} />
        </span>
        {annotation.label}
      </button>

      {open && (
        <div
          ref={popoverRef}
          onMouseEnter={keepOpen}
          onMouseLeave={hidePopover}
          className={`absolute z-50 w-80 md:w-96 ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"} left-1/2 -translate-x-1/2 rounded-xl border ${colors.border} bg-fd-background/95 backdrop-blur-xl shadow-lg ${colors.glow} shadow-xl p-4 transition-all animate-in fade-in slide-in-from-bottom-2 duration-200`}
        >
          {/* Numbers badge */}
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${colors.badge} mb-2`}>
            {annotation.numbers}
          </div>

          {/* Details */}
          <p className="text-sm text-fd-muted-foreground leading-relaxed">
            {annotation.details}
          </p>

          {/* Limitation */}
          {annotation.limitation && (
            <div className="mt-3 p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20">
              <p className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider mb-1">
                Limitation
              </p>
              <p className="text-xs text-rose-300/80 leading-relaxed">
                {annotation.limitation}
              </p>
            </div>
          )}

          {/* Tradeoff */}
          {annotation.tradeoff && (
            <div className="mt-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1">
                Tradeoff
              </p>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                {annotation.tradeoff}
              </p>
            </div>
          )}

          {/* File reference */}
          {annotation.file && (
            <p className="mt-2 text-[10px] font-mono text-fd-muted-foreground/60">
              {annotation.file}
            </p>
          )}
        </div>
      )}
    </span>
  );
}

// ─── AnnotationRow: renders a row of chips under a diagram ──────
function AnnotationRow({ annotations }: { annotations: Annotation[] }) {
  return (
    <div className="flex flex-wrap gap-2 mt-4 mb-2">
      {annotations.map((a) => (
        <HoverChip key={a.label} annotation={a} />
      ))}
    </div>
  );
}

// ─── Annotation Data ─────────────────────────────────────────────

const OVERVIEW_ANNOTATIONS: Annotation[] = [
  {
    label: "MDX Content",
    numbers: "130+ files | 10 sections | 500-800 chunks",
    details:
      "Static MDX files organized into fundamentals, building-blocks, communication, architecture, design-patterns, security, observability, system-components, and 26 case studies.",
    limitation:
      "Content is manually authored. No automated ingestion from external sources. Adding a new doc requires re-running generate-embeddings.ts to update the vector index.",
    file: "content/docs/**/*.mdx",
    color: "violet",
  },
  {
    label: "Chunking",
    numbers: "1000 chars | 200 overlap | min 50 chars",
    details:
      "Character-based sliding window chunking. ~150-200 tokens per chunk, fitting within MiniLM-L6-v2's 256 token max input. Chunks < 50 chars are discarded.",
    limitation:
      "Not semantically aware — splits mid-paragraph/mid-sentence. No ablation study run across chunk sizes. Standard LangChain defaults, not empirically tuned for this corpus.",
    tradeoff:
      "Larger chunks = more context per retrieval but less precise matching. Smaller chunks = better precision but risk losing context.",
    file: "scripts/generate-embeddings.ts:14-16",
    color: "violet",
  },
  {
    label: "Embeddings",
    numbers: "384-dim | ~22MB model | ~100ms/query | 0.87 STS",
    details:
      "HuggingFace Inference API running sentence-transformers/all-MiniLM-L6-v2. Free tier. Generates sequentially (one at a time) to avoid rate limit issues.",
    limitation:
      "Sequential processing: 500-800 chunks takes 50-80 seconds for full re-index. Weaker on nuanced cross-domain queries vs. OpenAI text-embedding-3-small (1536-dim). No batched embedding support used.",
    tradeoff:
      "384-dim = 4x less Pinecone storage vs. OpenAI's 1536-dim. Free tier viable. Quality sufficient for tightly-scoped system design corpus.",
    file: "lib/chat/embeddings.ts:3-5",
    color: "blue",
  },
  {
    label: "Pinecone",
    numbers: "1 index | 100K vector limit (free) | 384-dim | cosine similarity",
    details:
      "Serverless vector DB storing chunks with metadata: title, URL, category, content. Batch upsert in groups of 100.",
    limitation:
      "Free tier: single index, 100K vectors, limited read units. No namespace partitioning. No metadata filtering used in queries — purely vector similarity.",
    tradeoff:
      "Serverless = zero ops, but no control over indexing algorithm. Alternatives: pgvector (co-located with DB), Qdrant (self-hosted, more config), Chroma (requires running server).",
    file: "lib/chat/pinecone.ts",
    color: "cyan",
  },
  {
    label: "Guardrails",
    numbers: "24+ regex patterns | 4 harmful patterns | Levenshtein deobfuscation",
    details:
      "Input-only validation: prompt injection detection, jailbreak patterns, harmful content filtering, Unicode suspicious character detection, off-topic query checking with 40+ system design keywords.",
    limitation:
      "Regex-only — no ML classifier. Bypassed by Unicode homoglyphs, base64, non-English. No output-side filtering. deobfuscate() replaces 0/O with 'o', causing false positives on O(1) notation.",
    tradeoff:
      "Zero-latency validation (no LLM call) vs. accuracy. A Llama Guard classifier would catch more but add 200-500ms latency per request.",
    file: "lib/chat/guardrails.ts:21-54",
    color: "rose",
  },
  {
    label: "Groq LLM",
    numbers: "Llama 3.3 70B | 4096 max tokens | temp 0.7 | ~500 tok/s | $0 (free tier)",
    details:
      "Groq's LPU delivers 5-10x faster inference than OpenAI/Anthropic. Free tier with ~30 RPM limit. Single model used for chat, decomposition (temp 0.3), synthesis (temp 0.7), and evaluation (temp 0).",
    limitation:
      "Free tier = no SLA, rate limits. No fallback provider if Groq goes down. No circuit breaker pattern implemented. 128K context window but effective attention degrades past ~32K.",
    tradeoff:
      "Cost: $0 vs GPT-4o ($2.50/$10 per 1M) or Claude Sonnet ($3/$15 per 1M). Speed: ~500 tok/s vs ~80 tok/s (OpenAI). Quality: competitive with GPT-4-turbo on system design content.",
    file: "lib/chat/groq.ts:15",
    color: "amber",
  },
  {
    label: "SSE Streaming",
    numbers: "ReadableStream + TextEncoder | no WebSocket",
    details:
      "Server-Sent Events over HTTP — unidirectional server→client stream. POST request triggers streaming response. Client parses with ReadableStream.getReader().",
    limitation:
      "No bidirectional communication. No server-initiated messages. Can't push updates to idle clients. Connection drops silently without heartbeat.",
    tradeoff:
      "SSE = no WebSocket server needed, works on Vercel serverless. WebSocket would require persistent connections and a separate runtime (Vercel doesn't support WS on serverless).",
    file: "app/api/chat/route.ts:145-164",
    color: "emerald",
  },
];

const INGESTION_ANNOTATIONS: Annotation[] = [
  {
    label: "MDX Parsing",
    numbers: "frontmatter YAML | JSX stripped | code blocks → [placeholder]",
    details:
      "Custom parser extracts title/description from YAML frontmatter. Mermaid blocks replaced with [diagram], code blocks with [code example]. MDX/JSX components stripped entirely.",
    limitation:
      "Simple regex-based YAML parsing — not a full YAML parser. Doesn't handle nested frontmatter or complex YAML types. JSX content (interactive examples) is lost entirely.",
    file: "scripts/generate-embeddings.ts:34-74",
    color: "violet",
  },
  {
    label: "Batch Upsert",
    numbers: "100 vectors per batch | sequential within batch | HF rate limit",
    details:
      "Embeddings generated one-at-a-time within each batch (HF API limitation), then batch-upserted to Pinecone in groups of 100.",
    limitation:
      "Sequential embedding = 50-80 sec for full corpus. No parallel promises, no concurrency control (p-limit). HF free tier rate limits not explicitly handled — relies on sequential pacing.",
    tradeoff:
      "Conservative sequential approach avoids 429s but is slow. Could use batched HF calls or parallel promises with concurrency=5-10 for 5-10x speedup.",
    file: "scripts/generate-embeddings.ts:200-250",
    color: "blue",
  },
  {
    label: "No Incremental Updates",
    numbers: "Full re-index on every run | no change detection",
    details:
      "The entire corpus is re-processed and re-upserted on every run. No diffing against existing vectors. No deletion of removed content.",
    limitation:
      "Stale vectors persist if a doc is deleted. Duplicate vectors if chunk IDs change. Wastes HF API calls on unchanged content.",
    tradeoff:
      "Simplicity over efficiency. Incremental updates would need content hashing + Pinecone delete-by-filter, adding complexity for a corpus that changes infrequently.",
    file: "scripts/generate-embeddings.ts:121-254",
    color: "orange",
  },
];

const CHAT_ANNOTATIONS: Annotation[] = [
  {
    label: "Rate Limiting",
    numbers: "30 req/min (chat) | 10 req/min (research) | 120 req/min (middleware) | in-memory Map",
    details:
      "Three-tier rate limiting: edge middleware (120/min), chat API (30/min), research API (10/min). All use IP-based identification via x-forwarded-for header.",
    limitation:
      "In-memory Maps reset on cold start. Not distributed — each Vercel function instance has its own counter. Attackers rotating IPs bypass entirely. 'anonymous' fallback if no IP header.",
    tradeoff:
      "Zero infrastructure cost (no Redis) vs. no distributed consistency. Adequate for a documentation site, not for a payment API. Fix: Upstash Redis or Vercel KV.",
    file: "lib/chat/guardrails.ts:356-385 | middleware.ts:27-50",
    color: "rose",
  },
  {
    label: "Context Retrieval",
    numbers: "topK=5 | cosine similarity | graceful degradation",
    details:
      "Queries Pinecone for 5 most similar chunks. Results formatted as [Source N: Title](url) + content. If Pinecone fails, falls back to 'Context retrieval unavailable.'",
    limitation:
      "No re-ranking after retrieval. No score threshold filtering — low-relevance chunks still get injected. No metadata filtering (category, recency). Fallback means model answers from parametric knowledge, potentially hallucinating docs that don't exist.",
    tradeoff:
      "top-5 keeps prompt focused (~5K chars context) but may miss relevant content. A cross-encoder re-ranker (ms-marco-MiniLM) over top-20 → top-5 would significantly improve precision.",
    file: "lib/chat/context.ts:5-26",
    color: "cyan",
  },
  {
    label: "System Prompt",
    numbers: "54 lines | zero-shot | Mermaid syntax rules | no few-shot examples",
    details:
      "Defines role, capabilities, Mermaid diagram syntax with explicit flowchart vs. sequence diagram rules. Context + source links appended dynamically.",
    limitation:
      "Zero-shot — no worked examples of good answers. No chain-of-thought guidance. No output format constraints. Conversation history truncated to 500 chars/message in research mode.",
    tradeoff:
      "Simpler prompt = fewer tokens = lower cost + faster TTFT. Few-shot examples would improve quality but add ~500-1000 tokens per request.",
    file: "lib/chat/groq.ts:17-54",
    color: "amber",
  },
  {
    label: "No Output Guardrails",
    numbers: "0 output filters | 0 citation verification | 0 factual consistency checks",
    details:
      "Input is validated and sanitized, but model output is streamed directly to the client with zero post-processing.",
    limitation:
      "Model can hallucinate non-existent doc URLs, generate inaccurate system design advice, or leak system prompt details. No mechanism to detect or correct these at runtime.",
    tradeoff:
      "Output filtering would require buffering the stream (killing perceived latency) or a secondary model call (doubling cost). Current approach prioritizes streaming UX.",
    file: "app/api/chat/route.ts:146-164",
    color: "rose",
  },
];

const RESEARCH_ANNOTATIONS: Annotation[] = [
  {
    label: "Query Decomposition",
    numbers: "3-5 sub-queries | temp 0.3 | 500 max tokens | JSON extraction via regex",
    details:
      "Single Groq call to break a complex question into searchable sub-queries. Low temperature for deterministic output. Response parsed with regex /\\[...\\]/ to extract JSON array.",
    limitation:
      "Regex-based JSON extraction — fails silently on malformed output (falls back to original query). No structured output / JSON mode. Same 70B model used for a task an 8B model could handle.",
    tradeoff:
      "Single model simplifies dependency chain (1 API key, 1 rate limit pool). But Llama 3.1 8B on Groq would be faster and cheaper for this constrained task.",
    file: "lib/chat/research-agent.ts:58-87",
    color: "amber",
  },
  {
    label: "Parallel Search",
    numbers: "5 sub-queries x 3 chunks = 15 max chunks | Promise.all | top-10 unique sources",
    details:
      "All sub-query embeddings + Pinecone searches run in parallel via Promise.all. Results deduplicated by URL. Top 10 unique sources sent to client for citation.",
    limitation:
      "No adaptive retrieval — always fetches 3 per query regardless of relevance scores. No re-ranking across merged results. Duplicate content from overlapping chunks not detected.",
    tradeoff:
      "15 chunks × ~1000 chars = ~15K chars context — well within Llama 3.3's 128K window but within effective attention span. More chunks = more noise for synthesis.",
    file: "lib/chat/research-agent.ts:89-113",
    color: "blue",
  },
  {
    label: "Synthesis",
    numbers: "temp 0.7 | 4096 max tokens | last 6 messages history | 500 char truncation",
    details:
      "Single streaming Groq call with: SYNTHESIZE_PROMPT + formatted research context + conversation history (last 3 exchanges, each truncated to 500 chars).",
    limitation:
      "Single-pass synthesis — no iterative refinement, no self-reflection, no tool use. Can't decide to search more if initial results are poor. No STORM-style perspective-guided questioning.",
    tradeoff:
      "maxDuration=60s constraint means entire pipeline must complete in under 60 seconds. Iteration loops risk timeout. Fixed pipeline over agentic flexibility.",
    file: "lib/chat/research-agent.ts:136-169",
    color: "emerald",
  },
  {
    label: "Relevance Check",
    numbers: "40+ keywords | min 10 chars | vowel ratio > 0.1 | no LLM call",
    details:
      "Rule-based relevance filtering: system design keyword matching, question pattern detection, length heuristics, gibberish detection via vowel ratio.",
    limitation:
      "Keyword-based — misses valid questions phrased without standard terms. Allows through any question > 20 chars that starts with a question word (low confidence=0.6). No semantic understanding.",
    tradeoff:
      "Zero-latency check (no LLM call) vs. accuracy. An LLM-based relevance classifier would be more accurate but adds 200-500ms and consumes rate limit.",
    file: "lib/chat/guardrails.ts:247-330",
    color: "orange",
  },
  {
    label: "60s Timeout",
    numbers: "maxDuration = 60 | Vercel serverless limit | no background jobs",
    details:
      "Research endpoint has a hard 60-second execution limit set by Vercel's serverless function constraint. All steps must complete within this window.",
    limitation:
      "Complex questions with 5 sub-queries + slow HF/Pinecone responses can timeout. No queuing, no background processing, no retry on partial failure. Client sees generic error.",
    tradeoff:
      "Serverless simplicity vs. long-running capability. A queue-based architecture (Vercel Cron + external worker) would allow unlimited execution time but adds infrastructure complexity.",
    file: "app/api/research/route.ts:13",
    color: "rose",
  },
];

const STACK_ANNOTATIONS: Annotation[] = [
  {
    label: "Groq",
    numbers: "$0/month (free) | ~30 RPM | ~500 tok/s | Llama 3.3 70B | 128K context",
    details:
      "Groq's LPU architecture delivers 5-10x faster token generation than GPU-based providers. Free tier has rate limits but zero cost.",
    limitation:
      "No SLA on free tier. Single provider dependency — if Groq goes down, entire chat feature is unavailable. No fallback chain to OpenAI/Anthropic. Vercel AI SDK (v6.0.49) is a dependency but barely used — could enable quick provider switching.",
    tradeoff:
      "Speed + cost at the expense of reliability guarantees. Upgrading to Groq Pro ($0.59/$0.79 per 1M tokens) would add SLA but still single-provider risk.",
    file: "lib/chat/groq.ts | package.json",
    color: "amber",
  },
  {
    label: "Pinecone",
    numbers: "$0/month (starter) | 100K vectors | 1 index | serverless",
    details:
      "Managed serverless vector DB. No Docker, no self-hosting. SDK works in Node.js runtime. Batch upsert + similarity search.",
    limitation:
      "Free tier: 100K vector cap (current corpus ~500-800 vectors, plenty of room). Single index means no A/B testing of different chunking strategies. No hybrid search (keyword + vector).",
    tradeoff:
      "Zero-ops vs. flexibility. pgvector in Supabase/Neon would co-locate storage + vectors, eliminating an external dependency if corpus grows 10x.",
    file: "lib/chat/pinecone.ts",
    color: "violet",
  },
  {
    label: "HuggingFace",
    numbers: "$0/month (free) | all-MiniLM-L6-v2 | 384-dim | ~100ms/call",
    details:
      "Inference API for embedding generation. Model is 22MB, optimized for semantic similarity (0.87 Spearman on STS benchmark).",
    limitation:
      "Free tier rate limits not documented precisely. Sequential processing required. External dependency for every chat query. If HF API is slow, entire pipeline is slow.",
    tradeoff:
      "Free + good quality vs. latency. Self-hosting with @xenova/transformers or ONNX Runtime would eliminate the dependency and reduce latency to ~20ms but adds 22MB to bundle/runtime.",
    file: "lib/chat/embeddings.ts",
    color: "blue",
  },
  {
    label: "Next.js 15",
    numbers: "App Router | Node.js runtime (API) | Edge runtime (middleware) | Turbopack (dev)",
    details:
      "API routes use Node.js runtime (required by Groq/Pinecone/HF SDKs). Middleware runs at edge for global bot blocking + rate limiting. Static pages served from CDN.",
    limitation:
      "Edge middleware rate limiting is per-instance (not distributed). Node.js API routes have cold start latency on Vercel. maxDuration=60s hard limit on serverless.",
    tradeoff:
      "Monolithic simplicity vs. microservice flexibility. All AI logic lives in 3 API routes. Separation into a dedicated AI service would only pay off at much higher scale.",
    file: "app/api/chat/route.ts:11 | middleware.ts",
    color: "emerald",
  },
];

const COST_ANNOTATIONS: Annotation[] = [
  {
    label: "Total Monthly Cost",
    numbers: "~$1/month | all free tiers | domain only paid cost",
    details:
      "Vercel Hobby (free), Groq free tier, HuggingFace free Inference API, Pinecone Starter (free). Only cost is the custom domain (~$12/year).",
    limitation:
      "Free tier dependency means no SLA anywhere. If Groq removes free tier, chat has zero fallback. No budget for monitoring/observability tools.",
    tradeoff:
      "At 1000 queries/day: Groq Pro ~$5-15/mo, Pinecone Standard ~$70/mo. Total still under $100/mo. But current $0 cost enables indefinite operation without revenue.",
    color: "emerald",
  },
  {
    label: "Cost Per Chat Query",
    numbers: "~$0.00 | 1 HF embed + 1 Pinecone query + ~2K input / ~1K output tokens",
    details:
      "All on free tiers. If paid: HF embed ~$0.0001, Pinecone query ~$0.0001, Groq ~$0.003. Total ~$0.003/query.",
    tradeoff:
      "Same pipeline on GPT-4o would cost ~$0.015/query (5x more). On Claude Sonnet ~$0.021/query (7x more). Groq's free tier is the single biggest cost advantage.",
    color: "amber",
  },
  {
    label: "Cost Per Research Query",
    numbers: "~$0.00 | 1 decompose + 5 embeds + 5 Pinecone + 1 synthesis",
    details:
      "3x the LLM tokens of a regular chat query (decomposition + synthesis). 5x the embedding calls. Still free on current tiers.",
    limitation:
      "Research is 3x more expensive than chat. At scale, research rate limit (10/min) exists specifically to manage this cost multiplier.",
    tradeoff:
      "If paid: ~$0.009/research query on Groq Pro. Rate limiting at 10/min vs. 30/min for chat reflects this 3x cost difference.",
    color: "orange",
  },
  {
    label: "Scaling Cost Cliff",
    numbers: "~30 RPM free → $0.59/$0.79 per 1M tokens (Groq Pro)",
    details:
      "First breakpoint: Groq free tier rate limit (~30 RPM). Second: Pinecone free tier (100K vectors). Third: HuggingFace Inference API limits.",
    limitation:
      "No gradual cost scaling — jumps from $0 to ~$70/mo (Pinecone) + variable LLM costs. No cost monitoring or alerting in place.",
    color: "rose",
  },
];

const EVAL_ANNOTATIONS: Annotation[] = [
  {
    label: "RAG Evaluation",
    numbers: "20 test cases | 3 difficulties | 4 categories | LLM-as-judge",
    details:
      "Offline evaluation pipeline measuring keyword precision, topic coverage, and LLM-judged relevance/coherence/completeness (1-10 scale). Grading: A+ (90%) to F (<60%).",
    limitation:
      "Self-evaluation bias: same Llama 3.3 model judges its own output quality. No human-annotated ground truth. Content truncated to 2000 chars for evaluation but full content used in production. Only 20 test cases — not statistically significant.",
    tradeoff:
      "LLM-as-judge is fast and cheap to run vs. human evaluation. But Llama models systematically over-rate Llama outputs. Proper evaluation needs: different judge model, human baselines, RAGAS/TruLens frameworks.",
    file: "scripts/evaluate-rag.ts:77-245",
    color: "violet",
  },
  {
    label: "No Production Monitoring",
    numbers: "0 server-side query logs | 0 latency dashboards | 0 quality tracking",
    details:
      "Vercel Analytics tracks page views. Chat feedback (thumbs up/down) stored only in localStorage (100 record cap). No server-side analytics for chat queries.",
    limitation:
      "Can't measure: queries/day, P50/P95 latency, retrieval precision in production, feedback positive %, cost per query. No alerting on quality degradation. Feedback data never leaves the user's browser.",
    tradeoff:
      "Zero observability cost/complexity vs. flying blind on production quality. Structured logging to Axiom or Datadog would enable systematic improvement.",
    file: "components/chat/ChatWidget.tsx:11-21",
    color: "rose",
  },
];

// ─── Main Page ───────────────────────────────────────────────────

export default function AIArchitecturePage() {
  return (
    <main className="flex flex-1 flex-col px-4 py-8 md:px-8 lg:px-16 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-fd-muted-foreground hover:text-fd-foreground transition-colors mb-4 inline-block"
        >
          &larr; Back to Home
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
          AI Architecture
        </h1>
        <p className="text-fd-muted-foreground text-lg max-w-3xl">
          A deep dive into how Masst Docs uses AI — from document ingestion and
          vector embeddings to real-time RAG-powered chat and deep research.
        </p>
        <p className="text-xs text-fd-muted-foreground/60 mt-2">
          Hover over the annotated chips below each diagram to see exact numbers, limitations, and tradeoffs.
        </p>
      </div>

      {/* High-Level Overview */}
      <Section title="High-Level System Overview">
        <p className="text-fd-muted-foreground mb-4">
          The AI system in Masst Docs is a Retrieval-Augmented Generation (RAG)
          pipeline. Instead of relying solely on a language model&apos;s training
          data, every response is grounded in the actual documentation content
          stored in a vector database.
        </p>
        <Mermaid
          chart={`graph TD
    subgraph Ingestion["Offline: Document Ingestion"]
        MDX["130+ MDX Files<br/>(content/docs)"] --> Parse["Parse & Clean<br/>frontmatter + body"]
        Parse --> Chunk["Chunk Text<br/>1000 chars, 200 overlap"]
        Chunk --> Embed["Generate Embeddings<br/>HuggingFace<br/>all-MiniLM-L6-v2"]
        Embed --> Upsert["Upsert Vectors<br/>384 dimensions"]
        Upsert --> Pinecone[("Pinecone<br/>masst-docs index")]
    end

    subgraph Runtime["Online: Query Processing"]
        User["User Query"] --> Guardrails["Input Guardrails<br/>Sanitize + Validate"]
        Guardrails --> QueryEmbed["Generate Query<br/>Embedding<br/>HuggingFace"]
        QueryEmbed --> Search["Semantic Search<br/>Top-K Results"]
        Pinecone -.-> Search
        Search --> Context["Format Context<br/>with Sources"]
        Context --> LLM["Groq LLM<br/>Llama 3.3 70B"]
        LLM --> Stream["SSE Stream<br/>to Client"]
        Stream --> Client["Chat Widget<br/>React Client"]
    end

    style Ingestion fill:#1a1a2e,stroke:#6366f1,color:#e2e8f0
    style Runtime fill:#1a1a2e,stroke:#06b6d4,color:#e2e8f0
    style Pinecone fill:#1e293b,stroke:#8b5cf6,color:#c4b5fd
    style LLM fill:#1e293b,stroke:#f59e0b,color:#fde68a`}
        />
        <AnnotationRow annotations={OVERVIEW_ANNOTATIONS} />
      </Section>

      {/* Document Ingestion Pipeline */}
      <Section title="Document Ingestion Pipeline">
        <p className="text-fd-muted-foreground mb-4">
          The ingestion pipeline runs offline via{" "}
          <code className="px-1.5 py-0.5 rounded bg-fd-card border border-fd-border text-sm">
            scripts/generate-embeddings.ts
          </code>
          . It processes all MDX documentation files into searchable vector
          embeddings.
        </p>
        <Mermaid
          chart={`sequenceDiagram
    participant Script as generate-embeddings.ts
    participant FS as File System
    participant HF as HuggingFace API
    participant PC as Pinecone

    Script->>FS: Scan content/docs/**/*.mdx
    FS-->>Script: 130+ MDX files

    loop For each MDX file
        Script->>Script: Parse frontmatter (title, description)
        Script->>Script: Clean MDX (remove JSX, code blocks)
        Script->>Script: Chunk text (1000 chars, 200 overlap)

        loop For each chunk
            Script->>HF: featureExtraction(chunk)
            Note over HF: Model: all-MiniLM-L6-v2
            HF-->>Script: 384-dim vector
        end
    end

    loop Batch upsert (100 vectors)
        Script->>PC: upsert(vectors + metadata)
        Note over PC: Index: masst-docs
        PC-->>Script: Success
    end`}
        />
        <AnnotationRow annotations={INGESTION_ANNOTATIONS} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <InfoCard
            title="Text Chunking"
            description="Documents are split into 1000-character chunks with 200-character overlap to preserve context across boundaries."
            color="violet"
          />
          <InfoCard
            title="Embedding Model"
            description="HuggingFace's all-MiniLM-L6-v2 generates 384-dimensional dense vectors optimized for semantic similarity."
            color="blue"
          />
          <InfoCard
            title="Vector Storage"
            description="Pinecone stores vectors with metadata (title, URL, category, content) for fast approximate nearest-neighbor search."
            color="cyan"
          />
        </div>
      </Section>

      {/* Chat API Flow */}
      <Section title="Chat API — Real-Time RAG">
        <p className="text-fd-muted-foreground mb-4">
          When a user sends a message, the chat API retrieves relevant
          documentation context and augments the LLM prompt with it — this is
          the &quot;retrieval&quot; in Retrieval-Augmented Generation.
        </p>
        <Mermaid
          chart={`sequenceDiagram
    participant User as Chat Widget
    participant API as /api/chat
    participant Guard as Guardrails
    participant HF as HuggingFace
    participant PC as Pinecone
    participant Groq as Groq (Llama 3.3 70B)

    User->>API: POST { messages }
    API->>Guard: Rate limit check (30/min)
    API->>Guard: Sanitize + validate input

    alt Input blocked
        Guard-->>User: SSE: blocked message
    end

    API->>HF: generateEmbedding(query)
    HF-->>API: 384-dim query vector

    API->>PC: query(vector, topK=5)
    PC-->>API: 5 matching chunks + metadata

    API->>API: Format context with source links
    API->>Groq: stream(system + context + messages)

    loop SSE stream
        Groq-->>API: delta token
        API-->>User: data: {text: token}
    end
    API-->>User: data: [DONE]`}
        />
        <AnnotationRow annotations={CHAT_ANNOTATIONS} />

        <div className="mt-6 p-4 rounded-xl border border-fd-border bg-fd-card/50">
          <h4 className="font-semibold mb-2">Key Design Decisions</h4>
          <ul className="space-y-2 text-fd-muted-foreground text-sm">
            <li>
              <strong className="text-fd-foreground">Streaming SSE</strong> —
              Responses are streamed token-by-token via Server-Sent Events for
              instant perceived latency.
            </li>
            <li>
              <strong className="text-fd-foreground">Rate Limiting</strong> —
              IP-based rate limiting at 30 requests/minute prevents abuse
              without requiring authentication.
            </li>
            <li>
              <strong className="text-fd-foreground">Input Guardrails</strong>{" "}
              — Sanitization and validation filter unsafe or off-topic queries
              before hitting the LLM.
            </li>
            <li>
              <strong className="text-fd-foreground">Context Window</strong> —
              Top 5 most relevant chunks are injected into the system prompt,
              keeping the context focused.
            </li>
          </ul>
        </div>
      </Section>

      {/* Deep Research Flow */}
      <Section title="Deep Research Agent">
        <p className="text-fd-muted-foreground mb-4">
          The research agent handles complex, multi-faceted questions by
          decomposing them into sub-queries, searching independently, and
          synthesizing a comprehensive answer with citations.
        </p>
        <Mermaid
          chart={`graph TD
    Q["User Question"] --> Validate["Validate & Check<br/>Relevance"]
    Validate --> Decompose["Decompose Query<br/>via Groq LLM"]
    Decompose --> SQ1["Sub-query 1"]
    Decompose --> SQ2["Sub-query 2"]
    Decompose --> SQ3["Sub-query 3"]
    Decompose --> SQ4["Sub-query 4"]
    Decompose --> SQ5["Sub-query 5"]

    SQ1 --> S1["Semantic Search"]
    SQ2 --> S2["Semantic Search"]
    SQ3 --> S3["Semantic Search"]
    SQ4 --> S4["Semantic Search"]
    SQ5 --> S5["Semantic Search"]

    S1 --> Merge["Merge & Deduplicate<br/>Sources"]
    S2 --> Merge
    S3 --> Merge
    S4 --> Merge
    S5 --> Merge

    Merge --> Format["Format Research<br/>Context"]
    Format --> Synth["Synthesize Answer<br/>Groq LLM + Citations"]
    Synth --> Stream["Stream Response<br/>with Progress Events"]

    style Q fill:#1e293b,stroke:#8b5cf6,color:#c4b5fd
    style Decompose fill:#1e293b,stroke:#f59e0b,color:#fde68a
    style Merge fill:#1e293b,stroke:#06b6d4,color:#67e8f9
    style Synth fill:#1e293b,stroke:#10b981,color:#6ee7b7`}
        />
        <AnnotationRow annotations={RESEARCH_ANNOTATIONS} />

        <Mermaid
          chart={`sequenceDiagram
    participant User as Chat Widget
    participant API as /api/research
    participant Groq as Groq LLM
    participant HF as HuggingFace
    participant PC as Pinecone

    User->>API: POST { question }
    API->>API: Validate + relevance check

    API-->>User: SSE: progress(validating)

    API->>Groq: Decompose into sub-queries
    Groq-->>API: ["sub-query 1", ..., "sub-query 5"]
    API-->>User: SSE: progress(decompose_complete)

    par Parallel search
        API->>HF: embed(sub-query 1)
        HF-->>API: vector
        API->>PC: query(vector, topK=3)
        PC-->>API: results
    and
        API->>HF: embed(sub-query 2)
        HF-->>API: vector
        API->>PC: query(vector, topK=3)
        PC-->>API: results
    and
        API->>HF: embed(sub-query N)
        HF-->>API: vector
        API->>PC: query(vector, topK=3)
        PC-->>API: results
    end

    API-->>User: SSE: sources(top 10 unique)
    API->>Groq: Synthesize(context + question)

    loop Stream tokens
        Groq-->>API: token
        API-->>User: SSE: token
    end
    API-->>User: SSE: [DONE]`}
        />
      </Section>

      {/* Tech Stack */}
      <Section title="Technology Stack">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TechCard
            name="Groq"
            role="LLM Inference"
            detail="Runs Llama 3.3 70B with ultra-low latency. Used for both chat responses and query decomposition in the research agent."
            color="amber"
          />
          <TechCard
            name="Pinecone"
            role="Vector Database"
            detail="Stores 384-dimensional embeddings with metadata. Supports fast approximate nearest-neighbor search for semantic retrieval."
            color="violet"
          />
          <TechCard
            name="HuggingFace"
            role="Embedding Generation"
            detail="all-MiniLM-L6-v2 model generates dense embeddings for both documents (offline) and queries (real-time)."
            color="blue"
          />
          <TechCard
            name="Next.js"
            role="API Routes & SSE"
            detail="App Router API routes handle streaming responses via ReadableStream, enabling real-time token delivery to the client."
            color="emerald"
          />
        </div>
        <AnnotationRow annotations={STACK_ANNOTATIONS} />
      </Section>

      {/* Cost & Economics */}
      <Section title="Cost & Economics">
        <p className="text-fd-muted-foreground mb-4">
          The entire AI pipeline runs on free tiers. Here are the exact numbers
          and where the cost cliffs are.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-fd-border">
                <th className="text-left py-2 pr-4 text-fd-foreground font-semibold">Service</th>
                <th className="text-left py-2 pr-4 text-fd-foreground font-semibold">Current Cost</th>
                <th className="text-left py-2 pr-4 text-fd-foreground font-semibold">Tier</th>
                <th className="text-left py-2 text-fd-foreground font-semibold">Limit</th>
              </tr>
            </thead>
            <tbody className="text-fd-muted-foreground">
              <tr className="border-b border-fd-border/50">
                <td className="py-2 pr-4 font-medium">Vercel</td>
                <td className="py-2 pr-4 font-mono text-emerald-400">$0</td>
                <td className="py-2 pr-4">Hobby (free)</td>
                <td className="py-2">100GB bandwidth, 60s function timeout</td>
              </tr>
              <tr className="border-b border-fd-border/50">
                <td className="py-2 pr-4 font-medium">Groq</td>
                <td className="py-2 pr-4 font-mono text-emerald-400">$0</td>
                <td className="py-2 pr-4">Free tier</td>
                <td className="py-2">~30 RPM, ~14.4K req/day</td>
              </tr>
              <tr className="border-b border-fd-border/50">
                <td className="py-2 pr-4 font-medium">HuggingFace</td>
                <td className="py-2 pr-4 font-mono text-emerald-400">$0</td>
                <td className="py-2 pr-4">Free Inference API</td>
                <td className="py-2">Rate limited, shared infra</td>
              </tr>
              <tr className="border-b border-fd-border/50">
                <td className="py-2 pr-4 font-medium">Pinecone</td>
                <td className="py-2 pr-4 font-mono text-emerald-400">$0</td>
                <td className="py-2 pr-4">Starter (free)</td>
                <td className="py-2">100K vectors, 1 index</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">Domain</td>
                <td className="py-2 pr-4 font-mono text-amber-400">~$1/mo</td>
                <td className="py-2 pr-4">Custom domain</td>
                <td className="py-2">docs.masst.dev</td>
              </tr>
            </tbody>
          </table>
        </div>
        <AnnotationRow annotations={COST_ANNOTATIONS} />
      </Section>

      {/* Evaluation & Monitoring */}
      <Section title="Evaluation & Monitoring">
        <p className="text-fd-muted-foreground mb-4">
          How the RAG pipeline quality is measured — and where the gaps are.
        </p>
        <Mermaid
          chart={`graph LR
    subgraph Offline["Offline Evaluation"]
        TC["20 Test Cases<br/>easy/medium/hard"] --> Retrieve["Retrieve Context<br/>topK=5"]
        Retrieve --> KP["Keyword Precision"]
        Retrieve --> TC2["Topic Coverage"]
        Retrieve --> LJ["LLM-as-Judge<br/>relevance + coherence + completeness"]
        KP --> Grade["Overall Grade<br/>A+ to F"]
        TC2 --> Grade
        LJ --> Grade
    end

    subgraph Production["Production (gaps)"]
        NoLogs["No Server Logs"]
        NoLatency["No Latency Dashboard"]
        LocalFB["Feedback in<br/>localStorage only"]
    end

    style Offline fill:#1a1a2e,stroke:#8b5cf6,color:#e2e8f0
    style Production fill:#1a1a2e,stroke:#ef4444,color:#fca5a5`}
        />
        <AnnotationRow annotations={EVAL_ANNOTATIONS} />
      </Section>

      {/* End-to-End Data Flow */}
      <Section title="End-to-End Data Flow">
        <Mermaid
          chart={`graph LR
    subgraph Sources["Content Sources"]
        MDX["MDX Docs<br/>130+ files"]
    end

    subgraph Processing["Embedding Pipeline"]
        Clean["Parse &<br/>Clean"]
        ChunkStep["Chunk<br/>1000 chars"]
        EmbedStep["Embed<br/>HuggingFace"]
    end

    subgraph Storage["Vector Storage"]
        PineconeDB[("Pinecone<br/>masst-docs")]
    end

    subgraph Query["Query Time"]
        UserQ["User<br/>Question"]
        QEmbed["Query<br/>Embedding"]
        Retrieve["Semantic<br/>Search"]
        Augment["Augment<br/>Prompt"]
    end

    subgraph Generation["Response"]
        GroqLLM["Groq<br/>Llama 3.3"]
        SSE["SSE<br/>Stream"]
    end

    MDX --> Clean --> ChunkStep --> EmbedStep --> PineconeDB
    UserQ --> QEmbed --> Retrieve
    PineconeDB -.-> Retrieve
    Retrieve --> Augment --> GroqLLM --> SSE

    style Sources fill:#1a1a2e,stroke:#6366f1,color:#e2e8f0
    style Processing fill:#1a1a2e,stroke:#8b5cf6,color:#e2e8f0
    style Storage fill:#1a1a2e,stroke:#ec4899,color:#e2e8f0
    style Query fill:#1a1a2e,stroke:#06b6d4,color:#e2e8f0
    style Generation fill:#1a1a2e,stroke:#10b981,color:#e2e8f0`}
        />
      </Section>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-fd-border text-center">
        <p className="text-fd-muted-foreground text-sm">
          Built with Next.js 15, Groq, Pinecone, HuggingFace, and Mermaid.
        </p>
        <Link
          href="/"
          className="text-sm text-fd-muted-foreground hover:text-fd-foreground transition-colors mt-2 inline-block"
        >
          &larr; Back to Home
        </Link>
      </div>
    </main>
  );
}

// ─── Shared Layout Components ─────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}

function InfoCard({
  title,
  description,
  color,
}: {
  title: string;
  description: string;
  color: string;
}) {
  const borderColor =
    {
      violet: "hover:border-violet-500/50",
      blue: "hover:border-blue-500/50",
      cyan: "hover:border-cyan-500/50",
    }[color] || "hover:border-gray-500/50";

  return (
    <div
      className={`p-4 rounded-xl border border-fd-border bg-fd-card ${borderColor} transition-all`}
    >
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-sm text-fd-muted-foreground">{description}</p>
    </div>
  );
}

function TechCard({
  name,
  role,
  detail,
  color,
}: {
  name: string;
  role: string;
  detail: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    amber: "border-amber-500/30 hover:border-amber-500/60",
    violet: "border-violet-500/30 hover:border-violet-500/60",
    blue: "border-blue-500/30 hover:border-blue-500/60",
    emerald: "border-emerald-500/30 hover:border-emerald-500/60",
  };

  return (
    <div
      className={`p-5 rounded-xl border ${colorMap[color] || "border-fd-border"} bg-fd-card transition-all`}
    >
      <h4 className="font-bold text-lg">{name}</h4>
      <p className="text-sm font-medium text-fd-muted-foreground mb-2">
        {role}
      </p>
      <p className="text-sm text-fd-muted-foreground">{detail}</p>
    </div>
  );
}
