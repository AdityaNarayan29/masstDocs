"use client";

import { useEffect, useId, useState, useMemo, Suspense } from "react";
import { useTheme } from "next-themes";

// Cached manifest data
let manifestCache: Record<
  string,
  { light: string; dark: string }
> | null = null;
let manifestPromise: Promise<typeof manifestCache> | null = null;

/**
 * Generate hash for diagram code (must match the pre-render script)
 */
function hashDiagram(code: string): string {
  let hash = 0;
  const str = code.trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(12, "0").slice(0, 12);
}

/**
 * Load and cache manifest
 */
async function loadManifest() {
  if (manifestCache) return manifestCache;

  if (!manifestPromise) {
    manifestPromise = fetch("/mermaid-cache/manifest.json")
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
  }

  manifestCache = await manifestPromise;
  return manifestCache;
}

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
 * Static Mermaid component that uses pre-rendered SVGs with CSS theme switching
 */
function StaticMermaid({
  lightSvg,
  darkSvg,
}: {
  lightSvg: string;
  darkSvg: string;
}) {
  return (
    <div className="mermaid-container my-6 overflow-x-auto">
      {/* Light theme SVG - hidden in dark mode via CSS */}
      <div
        className="mermaid-light block dark:hidden [&>svg]:max-w-full [&>svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: lightSvg }}
      />
      {/* Dark theme SVG - hidden in light mode via CSS */}
      <div
        className="mermaid-dark hidden dark:block [&>svg]:max-w-full [&>svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: darkSvg }}
      />
    </div>
  );
}

/**
 * Client-side fallback rendering (when pre-rendered SVG not available)
 */
function ClientMermaid({ chart }: { chart: string }) {
  const id = useId();
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [chart, resolvedTheme, id]);

  if (error) {
    return (
      <div className="mermaid-error p-4 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 my-6">
        <p className="font-medium">Failed to render diagram</p>
        <p className="text-sm mt-1 opacity-75">{error}</p>
      </div>
    );
  }

  if (!svg) {
    return <MermaidSkeleton />;
  }

  return (
    <div
      className="mermaid-container my-6 overflow-x-auto [&>svg]:max-w-full [&>svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/**
 * Main Mermaid component
 *
 * Uses pre-rendered SVGs when available, falls back to client-side rendering.
 */
export function Mermaid({ chart }: { chart: string }) {
  const [state, setState] = useState<{
    checked: boolean;
    preRendered: { light: string; dark: string } | null;
  }>({ checked: false, preRendered: null });

  // Generate hash to look up pre-rendered SVG
  const hash = useMemo(() => hashDiagram(chart), [chart]);

  useEffect(() => {
    let cancelled = false;

    async function checkPreRendered() {
      const manifest = await loadManifest();

      if (cancelled) return;

      if (manifest && manifest[hash]) {
        // Fetch both SVGs in parallel
        try {
          const [lightRes, darkRes] = await Promise.all([
            fetch(manifest[hash].light),
            fetch(manifest[hash].dark),
          ]);

          if (cancelled) return;

          if (lightRes.ok && darkRes.ok) {
            const [light, dark] = await Promise.all([
              lightRes.text(),
              darkRes.text(),
            ]);

            if (!cancelled) {
              setState({ checked: true, preRendered: { light, dark } });
              return;
            }
          }
        } catch {
          // Fall through to client-side rendering
        }
      }

      if (!cancelled) {
        setState({ checked: true, preRendered: null });
      }
    }

    checkPreRendered();

    return () => {
      cancelled = true;
    };
  }, [hash]);

  // Still checking for pre-rendered
  if (!state.checked) {
    return <MermaidSkeleton />;
  }

  // Use pre-rendered if available (instant, no JS needed for rendering)
  if (state.preRendered) {
    return (
      <StaticMermaid
        lightSvg={state.preRendered.light}
        darkSvg={state.preRendered.dark}
      />
    );
  }

  // Fall back to client-side rendering
  return <ClientMermaid chart={chart} />;
}
