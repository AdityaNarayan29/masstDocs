"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const Mermaid = dynamic(
  () => import("@/components/mdx/mermaid").then((mod) => mod.Mermaid),
  {
  ssr: false,
  loading: () => (
    <div className="w-full h-40 rounded-xl border border-fd-border bg-fd-card/50 animate-pulse flex items-center justify-center">
      <span className="text-fd-muted-foreground text-sm">Loading diagram...</span>
    </div>
  ),
});

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
      </div>

      {/* High-Level Overview */}
      <Section title="High-Level System Overview">
        <p className="text-fd-muted-foreground mb-4">
          The AI system in Masst Docs is a Retrieval-Augmented Generation (RAG) pipeline.
          Instead of relying solely on a language model&apos;s training data, every response is
          grounded in the actual documentation content stored in a vector database.
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
      </Section>

      {/* Document Ingestion Pipeline */}
      <Section title="Document Ingestion Pipeline">
        <p className="text-fd-muted-foreground mb-4">
          The ingestion pipeline runs offline via{" "}
          <code className="px-1.5 py-0.5 rounded bg-fd-card border border-fd-border text-sm">
            scripts/generate-embeddings.ts
          </code>
          . It processes all MDX documentation files into searchable vector embeddings.
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
          When a user sends a message, the chat API retrieves relevant documentation
          context and augments the LLM prompt with it — this is the &quot;retrieval&quot;
          in Retrieval-Augmented Generation.
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

        <div className="mt-6 p-4 rounded-xl border border-fd-border bg-fd-card/50">
          <h4 className="font-semibold mb-2">Key Design Decisions</h4>
          <ul className="space-y-2 text-fd-muted-foreground text-sm">
            <li>
              <strong className="text-fd-foreground">Streaming SSE</strong> — Responses are
              streamed token-by-token via Server-Sent Events for instant perceived latency.
            </li>
            <li>
              <strong className="text-fd-foreground">Rate Limiting</strong> — IP-based rate
              limiting at 30 requests/minute prevents abuse without requiring authentication.
            </li>
            <li>
              <strong className="text-fd-foreground">Input Guardrails</strong> — Sanitization
              and validation filter unsafe or off-topic queries before hitting the LLM.
            </li>
            <li>
              <strong className="text-fd-foreground">Context Window</strong> — Top 5 most
              relevant chunks are injected into the system prompt, keeping the context focused.
            </li>
          </ul>
        </div>
      </Section>

      {/* Deep Research Flow */}
      <Section title="Deep Research Agent">
        <p className="text-fd-muted-foreground mb-4">
          The research agent handles complex, multi-faceted questions by decomposing them
          into sub-queries, searching independently, and synthesizing a comprehensive answer
          with citations.
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
      </Section>

      {/* Data Flow Summary */}
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
  const borderColor = {
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
