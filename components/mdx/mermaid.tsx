"use client";

import { useEffect, useId, useState } from "react";
import { useTheme } from "next-themes";

/**
 * Loading skeleton for mermaid diagrams
 */
function MermaidSkeleton() {
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
}

/**
 * Mermaid component - Client-side fallback renderer
 *
 * This component is only used when pre-rendered SVGs are not available.
 * Most diagrams will be inlined at build time by the remarkMermaidInline plugin.
 */
export function Mermaid({ chart }: { chart: string }) {
  const id = useId();
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          fontFamily: "inherit",
          theme: resolvedTheme === "dark" ? "dark" : "default",
        });

        const { svg } = await mermaid.render(
          id.replace(/:/g, "-"),
          chart.replace(/\\n/g, "\n")
        );

        if (!cancelled) {
          setSvg(svg);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to render diagram"
          );
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [chart, resolvedTheme, id, mounted]);

  if (!mounted || (!svg && !error)) {
    return <MermaidSkeleton />;
  }

  if (error) {
    return (
      <div className="mermaid-error p-4 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 my-6">
        <p className="font-medium">Failed to render diagram</p>
        <p className="text-sm mt-1 opacity-75">{error}</p>
      </div>
    );
  }

  return (
    <div
      className="mermaid-container my-6 overflow-x-auto [&>svg]:max-w-full [&>svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg! }}
    />
  );
}
