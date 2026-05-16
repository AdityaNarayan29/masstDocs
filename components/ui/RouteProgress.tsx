'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * Top-of-viewport progress bar that appears whenever the user clicks any
 * internal link and the new route is still being prepared. Hooks into
 * pathname + searchParams changes to detect navigation completion.
 *
 * Mounted once in the root layout; it intercepts clicks on <a> tags whose
 * href is an internal route (same origin, no target=_blank).
 */
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timers = useRef<number[]>([]);

  // Clear timers helper
  const clearTimers = () => {
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
  };

  // When pathname or search changes, complete the bar.
  useEffect(() => {
    if (!visible) return;
    setProgress(100);
    const done = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
    timers.current.push(done);
    return () => clearTimeout(done);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  // Intercept internal link clicks to start the bar.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return; // only primary click
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#')) return;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return;

      // Resolve relative to current origin and skip external links.
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        // Same path + same search? no navigation
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        ) {
          return;
        }
      } catch {
        return;
      }

      // Start the bar
      clearTimers();
      setVisible(true);
      setProgress(8);
      // Trickle: jump quickly to 30, slowly to 70, hold till route change.
      const t1 = window.setTimeout(() => setProgress(30), 80);
      const t2 = window.setTimeout(() => setProgress(55), 300);
      const t3 = window.setTimeout(() => setProgress(70), 700);
      const t4 = window.setTimeout(() => setProgress(85), 1500);
      timers.current.push(t1, t2, t3, t4);
    }

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      clearTimers();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-transparent pointer-events-none"
    >
      <div
        className="h-full bg-fd-primary shadow-[0_0_10px_rgb(var(--color-fd-primary-rgb,59_130_246)/0.6)] transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
