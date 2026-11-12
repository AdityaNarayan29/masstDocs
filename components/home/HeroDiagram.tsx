/**
 * Homepage hero: how a load balancer routes a request. Drawn as one SVG so
 * every edge starts and ends exactly on a node's border; colours come from
 * the theme (app/theme.css), so it follows light and dark mode. A request
 * dot travels the healthy path (paused for reduced motion).
 *
 * Geometry (viewBox 560 × 240): Client and Load balancer sit on y = 120;
 * the three servers are centred on y = 54, 120 and 186.
 */
const NODE = { rx: 14, stroke: "var(--color-fd-border)", fill: "var(--color-fd-card)" };

function Server({ y, label, status }: { y: number; label: string; status: "ok" | "fail" }) {
  return (
    <g>
      <rect x={400} y={y - 20} width={140} height={40} rx={12} fill={NODE.fill} stroke={NODE.stroke} />
      <circle cx={420} cy={y} r={4.5} fill={status === "ok" ? "var(--m-ok)" : "var(--m-fail)"} />
      <text
        x={434}
        y={y + 5}
        fontSize={14}
        fontWeight={700}
        fill={status === "ok" ? "var(--color-fd-foreground)" : "var(--color-fd-muted-foreground)"}
      >
        {label}
      </text>
    </g>
  );
}

export function HeroDiagram() {
  return (
    <figure className="not-prose m-0 flex flex-col gap-5 rounded-[28px] border bg-[var(--m-raised)] p-6 shadow-[var(--m-lift)] [background-image:radial-gradient(circle_at_1px_1px,var(--m-dots)_1px,transparent_0)] [background-size:20px_20px]">
      <div className="flex items-center justify-between gap-4">
        <span className="m-label">How a request finds a server</span>
        <span className="text-xs font-bold text-fd-muted-foreground">Load Balancer</span>
      </div>
      <svg
        viewBox="0 0 560 240"
        className="h-auto w-full"
        role="img"
        aria-label="A client sends a request to a load balancer, which forwards it to healthy servers 1 and 2; server 3 is failing and gets no traffic."
      >
        <defs>
          <marker id="hero-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--color-fd-muted-foreground)" />
          </marker>
          <marker id="hero-arrow-ok" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--m-ok)" />
          </marker>
        </defs>

        {/* Edges end exactly on node borders: Client right = 102, LB left = 170, LB right = 302, servers left = 400. */}
        <path d="M102 120 H170" stroke="var(--color-fd-muted-foreground)" strokeWidth={2} fill="none" markerEnd="url(#hero-arrow)" />
        <path d="M302 120 C352 120 350 54 400 54" stroke="var(--m-ok)" strokeWidth={2} fill="none" markerEnd="url(#hero-arrow-ok)" />
        <path d="M302 120 H400" stroke="var(--m-ok)" strokeWidth={2} fill="none" markerEnd="url(#hero-arrow-ok)" />
        <path d="M302 120 C352 120 350 186 400 186" stroke="var(--m-fail)" strokeWidth={2} strokeDasharray="5 5" fill="none" opacity={0.85} />
        {/* The dead link is cut with a cross where the balancer stops sending. */}
        <g stroke="var(--m-fail)" strokeWidth={2.2} strokeLinecap="round">
          <path d="M361 166 l10 10 M371 166 l-10 10" />
        </g>

        {/* The request travelling Client → LB → Server 1 (drawn under the nodes). */}
        <circle className="hero-request" r={5} fill="var(--m-info)" />

        <rect x={10} y={98} width={92} height={44} rx={NODE.rx} fill={NODE.fill} stroke={NODE.stroke} />
        <text x={56} y={125} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--color-fd-foreground)">Client</text>

        {/* Opaque base so edges and the request dot pass under it, then the "selected" tint. */}
        <rect x={170} y={92} width={132} height={56} rx={NODE.rx} fill="var(--color-fd-card)" />
        <rect x={170} y={92} width={132} height={56} rx={NODE.rx} fill="var(--m-tint)" stroke="var(--m-info)" strokeWidth={1.5} />
        <text x={236} y={117} textAnchor="middle" fontSize={14} fontWeight={800} fill="var(--color-fd-foreground)">Load balancer</text>
        <text x={236} y={135} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--color-fd-muted-foreground)">one address</text>

        <Server y={54} label="Server 1" status="ok" />
        <Server y={120} label="Server 2" status="ok" />
        <Server y={186} label="Server 3" status="fail" />
      </svg>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-[var(--m-chip)] px-3 py-1.5 text-xs font-bold text-[var(--m-ink-2)]">Health check every 10 s</span>
        <span className="rounded-full bg-[var(--m-chip)] px-3 py-1.5 text-xs font-bold text-[var(--m-ink-2)]">Server 3 removed after 2 failed checks</span>
      </div>
    </figure>
  );
}
