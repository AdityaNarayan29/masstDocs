"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TRACKS, sectionsInTrack, type TrackId } from "@/lib/tracks";

/** The track a URL belongs to, from the sections in lib/tracks.ts. */
export function trackForPath(pathname: string): TrackId | null {
  for (const t of TRACKS) {
    if (sectionsInTrack(t.id).some((s) => pathname === s.url || pathname.startsWith(`${s.url}/`))) return t.id;
  }
  return null;
}

/** Where each track's top-bar link goes: its first section. */
const TRACK_URL: Record<TrackId, string> = Object.fromEntries(
  TRACKS.map((t) => [t.id, sectionsInTrack(t.id)[0]!.url]),
) as Record<TrackId, string>;

/** Tracks in the top bar (desktop). Phones get MobileTabBar instead. */
export function TrackLinks() {
  const current = trackForPath(usePathname());
  return (
    <nav aria-label="Tracks" className="flex items-center gap-1 max-lg:hidden">
      {TRACKS.map((t) => {
        const active = current === t.id;
        return (
          <Link
            key={t.id}
            href={TRACK_URL[t.id]}
            aria-current={active ? "page" : undefined}
            className={[
              "rounded-lg px-3 py-2 text-sm font-bold transition-colors",
              active
                ? "bg-fd-accent text-fd-foreground font-extrabold"
                : "text-[var(--m-ink-2)] hover:bg-fd-accent hover:text-fd-foreground",
            ].join(" ")}
          >
            {t.title}
          </Link>
        );
      })}
    </nav>
  );
}
