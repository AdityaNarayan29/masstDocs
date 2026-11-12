/**
 * "Design of the week" preview: Netflix's request path from devices down to
 * services. One SVG, edges start and end on node borders (viewBox 460 × 290).
 */
type Box = { x: number; y: number; w: number; h: number; label: string; accent?: boolean };

const BOXES: Box[] = [
  { x: 40, y: 20, w: 110, h: 34, label: "TV apps" },
  { x: 175, y: 20, w: 110, h: 34, label: "Mobile" },
  { x: 310, y: 20, w: 110, h: 34, label: "Web" },
  { x: 140, y: 100, w: 180, h: 40, label: "Open Connect edge", accent: true },
  { x: 165, y: 170, w: 130, h: 36, label: "Zuul gateway" },
  { x: 50, y: 236, w: 160, h: 36, label: "Playback service" },
  { x: 250, y: 236, w: 170, h: 36, label: "Recommendations" },
];

// From a box's bottom centre to the next box's top centre.
const EDGES = [
  "M95 54 C95 80 230 74 230 100",
  "M230 54 V100",
  "M365 54 C365 80 230 74 230 100",
  "M230 140 V170",
  "M230 206 C230 224 130 218 130 236",
  "M230 206 C230 224 335 218 335 236",
];

export function FeatureDiagram() {
  return (
    <svg viewBox="0 0 460 290" className="h-auto w-full" role="img" aria-label="Netflix: TV, mobile and web apps reach the Open Connect edge, then the Zuul gateway, which routes to the playback and recommendation services.">
      <defs>
        <marker id="feature-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--color-fd-muted-foreground)" />
        </marker>
      </defs>
      {EDGES.map((d) => (
        <path key={d} d={d} fill="none" stroke="var(--color-fd-muted-foreground)" strokeWidth={1.5} markerEnd="url(#feature-arrow)" />
      ))}
      {BOXES.map((b) => (
        <g key={b.label}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={12} fill="var(--m-raised)" stroke={b.accent ? "var(--m-info)" : "var(--color-fd-border)"} strokeWidth={b.accent ? 1.5 : 1} />
          {b.accent && <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={12} fill="var(--m-tint)" />}
          <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 5} textAnchor="middle" fontSize={13} fontWeight={b.accent ? 800 : 700} fill="var(--color-fd-foreground)">
            {b.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
