"use client";

import { useEffect, useState } from "react";
import { saveLastRead } from "@/lib/progress";

/**
 * Thin progress bar at the very top of an article, in the "moving" colour.
 * Also remembers how far the reader got, for "Continue where you left off".
 */
export function ReadingProgress({ url, title }: { url: string; title: string }) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 100;
      setPercent(p);
      saveLastRead({ url, title, percent: Math.round(p) });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [url, title]);

  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-[3px]">
      <div className="h-full rounded-r-full bg-[var(--m-info)] transition-[width] duration-150" style={{ width: `${percent}%` }} />
    </div>
  );
}
