"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// "Actual size" in the enlarged view, as a multiple of the natural size.
const FULL = 1.35;
// Dialog padding (matches .dg-dialog-body in app/global.css).
const PAD_X = 64;
const PAD_Y = 88;

type View = { html: string; label: string; w: number; h: number };

// Start fetching a diagram this far before it scrolls into view.
const AHEAD = "1200px 0px";

// One request per SVG file per visit, shared by every copy on the page.
const svgCache = new Map<string, Promise<string>>();
function fetchSvg(src: string) {
  let p = svgCache.get(src);
  if (!p) {
    p = fetch(src).then((r) => {
      if (!r.ok) throw new Error(`diagram ${r.status}`);
      return r.text();
    });
    p.catch(() => svgCache.delete(src)); // allow a retry later
    svgCache.set(src, p);
  }
  return p;
}

/** Inline a placeholder's SVG (no-op once loaded). */
async function loadDiagram(canvas: HTMLElement) {
  const src = canvas.dataset.src;
  if (!src || canvas.firstElementChild) return;
  const svg = await fetchSvg(src);
  if (!canvas.firstElementChild) canvas.innerHTML = svg;
}

/**
 * Site-wide behaviour for diagrams. Pages carry sized placeholders
 * (lib/remark-mermaid-inline.mjs); this:
 * - fetches each SVG from public/mermaid-cache/ shortly before it scrolls
 *   into view and inlines it, so the theme's CSS variables apply;
 * - marks frames that overflow sideways, so CSS can fade the edge and show
 *   a scroll hint;
 * - one dialog that enlarges any diagram: opens fitted to the screen, click
 *   to switch between fitted and full size.
 */
export function DiagramZoom() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<View | null>(null);
  const [full, setFull] = useState(false);
  const pathname = usePathname();

  // Lazy loading. A MutationObserver also catches content that streams in
  // after client-side navigation.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          loadDiagram(e.target as HTMLElement).catch(() => io.observe(e.target));
        }),
      { rootMargin: AHEAD },
    );
    const seen = new WeakSet<Element>();
    const scan = () =>
      document.querySelectorAll<HTMLElement>(".dg-canvas[data-src]").forEach((c) => {
        if (seen.has(c) || c.firstElementChild) return;
        seen.add(c);
        io.observe(c);
      });
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    // Printing shows every diagram.
    const onPrint = () => document.querySelectorAll<HTMLElement>(".dg-canvas[data-src]").forEach((c) => void loadDiagram(c));
    window.addEventListener("beforeprint", onPrint);
    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("beforeprint", onPrint);
    };
  }, []);

  // Overflow hints, re-applied after client-side navigation and on resize.
  useEffect(() => {
    const frames = [...document.querySelectorAll<HTMLElement>(".dg-frame")];
    const update = (frame: HTMLElement) => {
      const max = frame.scrollWidth - frame.clientWidth;
      if (max <= 1) return frame.removeAttribute("data-overflow");
      const x = frame.scrollLeft;
      frame.dataset.overflow = x <= 1 ? "start" : x >= max - 1 ? "end" : "middle";
    };
    const resize = new ResizeObserver((entries) => entries.forEach((e) => update(e.target as HTMLElement)));
    const onScroll = (e: Event) => update(e.currentTarget as HTMLElement);
    frames.forEach((f) => {
      resize.observe(f);
      f.addEventListener("scroll", onScroll, { passive: true });
    });
    return () => {
      resize.disconnect();
      frames.forEach((f) => f.removeEventListener("scroll", onScroll));
    };
  }, [pathname]);

  // Open the dialog from a diagram's canvas or enlarge button.
  useEffect(() => {
    const onClick = async (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target || target.closest(".dg-dialog")) return;
      const trigger = target.closest(".dg-zoom, .dg .dg-canvas");
      const figure = trigger?.closest<HTMLElement>(".dg");
      const canvas = figure?.querySelector<HTMLElement>(".dg-canvas");
      if (!figure || !canvas) return;
      try {
        await loadDiagram(canvas);
      } catch {
        return;
      }
      setFull(false);
      setView({
        html: canvas.innerHTML,
        label: canvas.getAttribute("aria-label") ?? "Diagram",
        w: parseFloat(figure.style.getPropertyValue("--dg-w")) || 800,
        h: parseFloat(figure.style.getPropertyValue("--dg-h")) || 600,
      });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (view && !dialog.current?.open) dialog.current?.showModal();
  }, [view]);

  let width = 0;
  if (view) {
    const box = dialog.current?.getBoundingClientRect();
    const availW = (box?.width || window.innerWidth * 0.96) - PAD_X;
    const availH = (box?.height || window.innerHeight * 0.92) - PAD_Y;
    const fit = Math.min(availW, (availH * view.w) / view.h, view.w * FULL);
    width = full ? view.w * FULL : fit;
  }
  const canToggle = view ? view.w * FULL > width + 1 || full : false;

  return (
    <dialog
      ref={dialog}
      className="dg-dialog"
      aria-label={view?.label}
      onClose={() => setView(null)}
      // A click on the backdrop lands on the dialog element itself.
      onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
    >
      <button
        type="button"
        onClick={() => dialog.current?.close()}
        aria-label="Close"
        className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-lg border border-fd-border bg-fd-background text-fd-muted-foreground hover:text-fd-foreground"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
      {view && canToggle && (
        <p className="absolute left-4 top-4 z-10 rounded-md border border-fd-border bg-fd-background px-2 py-1 text-xs text-fd-muted-foreground">
          {full ? "Click to fit" : "Click to see full size"}
        </p>
      )}
      {view && (
        <div className="dg-dialog-body">
          <div
            className="dg-canvas"
            role="img"
            aria-label={view.label}
            style={{ width, cursor: canToggle ? (full ? "zoom-out" : "zoom-in") : "default" }}
            onClick={() => canToggle && setFull((f) => !f)}
            dangerouslySetInnerHTML={{ __html: view.html }}
          />
        </div>
      )}
    </dialog>
  );
}
