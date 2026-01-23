"use client";

import { memo, useEffect, useState } from "react";
import { useTheme } from "next-themes";

interface ChatMermaidProps {
  chart: string;
}

// Fix common Mermaid syntax errors from LLMs - aggressive approach
function fixMermaidSyntax(chart: string): string {
  let fixed = chart.trim();

  // Remove any BOM or invisible characters
  fixed = fixed.replace(/^\uFEFF/, '');
  fixed = fixed.replace(/\r\n/g, '\n');
  fixed = fixed.replace(/\r/g, '\n');

  // CRITICAL FIX #1: Handle -->| label |> pattern (with spaces)
  // Example: -->| Send Tweet |> becomes -->|Send Tweet|
  fixed = fixed.replace(/-->\|\s*([^|]+?)\s*\|>/g, '-->|$1|');

  // CRITICAL FIX #2: Handle -->|label|> pattern (no spaces)
  fixed = fixed.replace(/-->\|([^|]+)\|>/g, '-->|$1|');

  // CRITICAL FIX #3: Handle --|label|> pattern
  fixed = fixed.replace(/--\|\s*([^|]+?)\s*\|>/g, '--|$1|');

  // CRITICAL FIX #4: Remove any remaining |> anywhere
  fixed = fixed.replace(/\|>/g, '|');

  // Check what type of diagram this should be
  const lines = fixed.split('\n');
  const firstLine = lines[0].trim().toLowerCase();

  // SEQUENCE DIAGRAM handling
  if (firstLine.startsWith('sequencediagram') ||
      (fixed.includes('participant') && !firstLine.startsWith('graph')) ||
      fixed.includes('->>') ||
      fixed.includes('-->>')) {

    // Ensure it starts with sequenceDiagram
    if (!firstLine.startsWith('sequencediagram')) {
      fixed = fixed.replace(/^(graph|flowchart)\s+(TD|TB|LR|RL|BT)\s*/im, '');
      fixed = 'sequenceDiagram\n' + fixed;
    }

    // Clean up participant lines
    fixed = fixed.replace(/participant\s+\w+\s+as\s+"[^"]+"/g, (match) => {
      const nameMatch = match.match(/as\s+"([^"]+)"/);
      return nameMatch ? `participant ${nameMatch[1].replace(/\s+/g, '')}` : match;
    });

    // Fix --> to ->> in sequence diagrams
    fixed = fixed.replace(/(\w+)\s*-->\s*(\w+)\s*:/g, '$1->>$2:');

    return fixed;
  }

  // FLOWCHART handling
  if (firstLine.startsWith('graph') || firstLine.startsWith('flowchart')) {
    // Fix --->|label| to -->|label| (too many dashes)
    fixed = fixed.replace(/---+>/g, '-->');

    // Fix -->|> to -->
    fixed = fixed.replace(/-->\|>/g, '-->');

    return fixed;
  }

  // If no clear diagram type, assume flowchart
  if (!fixed.startsWith('graph') && !fixed.startsWith('flowchart') && !fixed.startsWith('sequenceDiagram')) {
    fixed = 'graph TD\n' + fixed;
  }

  return fixed;
}

// Global counter for unique IDs
let renderCounter = 0;

export const ChatMermaid = memo(function ChatMermaid({
  chart,
}: ChatMermaidProps) {
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processedChart, setProcessedChart] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const uniqueId = `mermaid-render-${++renderCounter}-${Date.now()}`;

    async function renderDiagram() {
      const fixedChart = fixMermaidSyntax(chart);
      setProcessedChart(fixedChart);

      // Debug logging
      console.log('=== MERMAID DEBUG ===');
      console.log('Original:', chart);
      console.log('Fixed:', fixedChart);
      console.log('=====================');

      try {
        const mermaid = (await import("mermaid")).default;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: resolvedTheme === "dark" ? "dark" : "default",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          logLevel: 'error',
          flowchart: {
            htmlLabels: true,
            useMaxWidth: true,
            curve: 'basis',
          },
          sequence: {
            useMaxWidth: true,
            showSequenceNumbers: false,
          },
        });

        const { svg: renderedSvg } = await mermaid.render(uniqueId, fixedChart);

        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        console.error('Failed chart:', fixedChart);

        // Fallback: try stripping all labels
        try {
          const mermaid = (await import("mermaid")).default;
          const fallbackId = `mermaid-fallback-${++renderCounter}-${Date.now()}`;

          let simplifiedChart = fixedChart;

          // Strip all edge labels: -->|anything| becomes -->
          simplifiedChart = simplifiedChart.replace(/-->\|[^|]*\|/g, '-->');
          // Strip all node labels: A[anything] becomes A
          simplifiedChart = simplifiedChart.replace(/(\w+)\[[^\]]*\]/g, '$1');

          console.log('Trying simplified:', simplifiedChart);

          mermaid.initialize({
            startOnLoad: false,
            securityLevel: "loose",
            theme: resolvedTheme === "dark" ? "dark" : "default",
          });

          const { svg: fallbackSvg } = await mermaid.render(fallbackId, simplifiedChart);

          if (!cancelled) {
            setSvg(fallbackSvg);
            setError(null);
          }
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr);
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Diagram syntax error");
            setSvg(null);
          }
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, resolvedTheme]);

  if (error) {
    return (
      <div className="my-2 rounded border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
        <div className="mb-2 font-medium text-amber-600 dark:text-amber-400">
          Could not render diagram
        </div>
        <details className="cursor-pointer" open>
          <summary className="text-fd-muted-foreground hover:text-fd-foreground text-xs">
            Show diagram code
          </summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-fd-muted-foreground bg-fd-background/50 p-2 rounded text-[10px] leading-relaxed">
{processedChart}
          </pre>
        </details>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-2 flex h-20 animate-pulse items-center justify-center rounded bg-fd-muted/30 border border-fd-border/50">
        <div className="flex items-center gap-2 text-xs text-fd-muted-foreground">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Rendering diagram...
        </div>
      </div>
    );
  }

  return (
    <div
      className="my-2 overflow-x-auto rounded bg-white dark:bg-gray-900 p-3 border border-fd-border/50 [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:mx-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});
