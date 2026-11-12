"use client";

import type React from "react";
import { memo, useEffect, useId, useState } from "react";

/**
 * Loading skeleton for mermaid diagrams
 */
const MermaidSkeleton = memo(function MermaidSkeleton() {
  return (
    <div className="mermaid-skeleton animate-pulse my-6">
      <div className="h-64 w-full rounded-lg bg-fd-muted/50 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-fd-muted-foreground/30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
          />
        </svg>
      </div>
    </div>
  );
});

/**
 * Mermaid component - client-side fallback renderer.
 *
 * Only used for diagrams that are not pre-rendered yet (run
 * `pnpm pre-render-mermaid`). It renders with the same theme and
 * post-processing as the build (lib/diagram-theme.mjs, lib/diagram-svg.mjs),
 * so the result looks the same and follows light/dark mode via CSS.
 */
export const Mermaid = memo(function Mermaid({ chart }: { chart: string }) {
  const id = useId();
  const [diagram, setDiagram] = useState<{ svg: string; width: number; height: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const renderId = `dg-c${id.replace(/[^a-zA-Z0-9]/g, "")}`;

    async function render() {
      try {
        const [{ default: mermaid }, { MERMAID_CONFIG }, { processSvg }] = await Promise.all([
          import("mermaid"),
          import("@/lib/diagram-theme.mjs"),
          import("@/lib/diagram-svg.mjs"),
        ]);
        // Measure text with the font the page actually uses.
        const font = getComputedStyle(document.body).fontFamily.split(",")[0].replace(/["']/g, "").trim();
        mermaid.initialize({
          startOnLoad: false,
          ...MERMAID_CONFIG,
          fontFamily: font,
          themeVariables: { ...MERMAID_CONFIG.themeVariables, fontFamily: font },
        } as Parameters<typeof mermaid.initialize>[0]);
        const { svg } = await mermaid.render(renderId, chart.replace(/\\n/g, "\n"));
        if (!cancelled) setDiagram(processSvg(svg, renderId, font));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to render diagram");
      }
    }

    render();

    return () => {
      cancelled = true;
      // Clean up mermaid's temporary render elements
      document.getElementById(renderId)?.remove();
      document.getElementById(`d${renderId}`)?.remove();
    };
  }, [chart, id]);

  if (error) {
    return (
      <div className="mermaid-error p-4 rounded-lg border border-[color-mix(in_srgb,var(--m-fail)_40%,transparent)] bg-[color-mix(in_srgb,var(--m-fail)_10%,transparent)] text-[var(--m-fail)] my-6">
        <p className="font-medium">Failed to render diagram</p>
        <p className="text-sm mt-1 opacity-75">{error}</p>
      </div>
    );
  }

  if (!diagram) return <MermaidSkeleton />;

  return (
    <figure
      className="dg not-prose"
      style={{ "--dg-w": `${diagram.width}px`, "--dg-h": diagram.height } as React.CSSProperties}
    >
      <div className="dg-frame">
        <div className="dg-canvas" role="img" aria-label="Diagram" dangerouslySetInnerHTML={{ __html: diagram.svg }} />
      </div>
    </figure>
  );
});
