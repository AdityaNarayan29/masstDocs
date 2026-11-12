"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { trackForPath } from "@/components/layout/TrackLinks";
import { TRACKS, sectionsInTrack, type TrackId } from "@/lib/tracks";

const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const ICONS: Record<TrackId | "home", ReactNode> = {
  home: icon(<path d="M3 11 12 4l9 7v9H3z" />),
  concepts: icon(<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5V21h16" />),
  designs: icon(
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
      <path d="M10 6.5h4a2 2 0 0 1 2 2V14" />
    </>,
  ),
  interview: icon(
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>,
  ),
  reels: icon(
    <>
      <rect x="5" y="2" width="14" height="20" rx="3" />
      <path d="m10 9 5 3-5 3z" />
    </>,
  ),
};

/** Bottom tab bar on phones: Home plus the tracks (the top bar's links). */
export function MobileTabBar() {
  const pathname = usePathname();
  const current = pathname === "/" ? "home" : trackForPath(pathname);
  const items = [
    { id: "home" as const, title: "Home", url: "/" },
    ...TRACKS.map((t) => ({ id: t.id, title: t.title, url: sectionsInTrack(t.id)[0]!.url })),
  ];

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-[color-mix(in_srgb,var(--m-raised)_92%,transparent)] px-1.5 pt-1.5 pb-[max(env(safe-area-inset-bottom),10px)] backdrop-blur md:hidden"
    >
      {items.map((item) => {
        const active = current === item.id;
        return (
          <Link
            key={item.id}
            href={item.url}
            aria-current={active ? "page" : undefined}
            className={[
              "flex min-h-11 flex-col items-center justify-center gap-1 text-[11px] font-extrabold",
              active ? "text-fd-foreground" : "text-fd-muted-foreground",
            ].join(" ")}
          >
            {ICONS[item.id]}
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
