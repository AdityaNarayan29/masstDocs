"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDone, useLastRead } from "@/lib/progress";

const BookIcon = (
  <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
    <path d="M4 19.5V21h16" />
  </svg>
);
const PenIcon = (
  <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);

const cardClass =
  "flex items-center gap-4 rounded-[20px] border bg-fd-card p-5 transition-colors hover:bg-fd-accent sm:gap-5 sm:px-6";

/** Last article the reader was on, or the first page for a new reader. */
export function ContinueCard({ fallback }: { fallback: { title: string; url: string } }) {
  const last = useLastRead();
  const target = last ?? { ...fallback, percent: 0 };
  return (
    <Link href={target.url} className={cardClass}>
      <span className="grid size-[52px] shrink-0 place-items-center rounded-2xl bg-[var(--m-tint)] text-[var(--m-info)]">{BookIcon}</span>
      <span className="min-w-0 flex-1">
        <span className="m-label">{last ? "Continue where you left off" : "Start here"}</span>
        <span className="mt-1 block truncate text-lg font-extrabold">{target.title}</span>
        {last ? (
          <span className="mt-2.5 flex items-center gap-2.5">
            <span className="h-1.5 flex-1 rounded-full bg-[var(--m-chip)]">
              <span className="block h-1.5 rounded-full bg-[var(--m-info)]" style={{ width: `${target.percent}%` }} />
            </span>
            <span className="text-xs font-bold text-fd-muted-foreground">{target.percent}%</span>
          </span>
        ) : (
          <span className="mt-1 block text-sm font-semibold text-fd-muted-foreground">The first page of the Concepts track</span>
        )}
      </span>
      <span aria-hidden="true" className="text-xl text-fd-muted-foreground">→</span>
    </Link>
  );
}

/** One practice question per day, the same for everyone on a given day. */
export function TodaysPractice({ items }: { items: { title: string; url: string }[] }) {
  // Pick after mount: the page is static, so "today" must be the reader's day.
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const day = Math.floor(Date.now() / 86_400_000);
    setIndex(day % items.length);
  }, [items.length]);
  const item = items[index]!;
  return (
    <Link href={`${item.url}#practice`} className={cardClass}>
      <span className="grid size-[52px] shrink-0 place-items-center rounded-2xl bg-[var(--m-chip)] text-[var(--m-ink-2)]">{PenIcon}</span>
      <span className="min-w-0 flex-1">
        <span className="m-label">Today&apos;s practice</span>
        <span className="mt-1 block truncate text-lg font-extrabold">{item.title}</span>
        <span className="mt-1 block text-sm font-semibold text-fd-muted-foreground">Write your design, get AI feedback in seconds</span>
      </span>
      <span aria-hidden="true" className="text-xl text-fd-muted-foreground">→</span>
    </Link>
  );
}

/** "12 / 76" plus a bar, counted from the pages the reader marked done. */
export function SectionProgress({ title, url, pages }: { title: string; url: string; pages: string[] }) {
  const done = useDone();
  const count = pages.filter((p) => done.has(p)).length;
  const percent = pages.length ? Math.round((count / pages.length) * 100) : 0;
  return (
    <Link href={url} className="group block">
      <span className="flex justify-between gap-3 text-[15px] font-extrabold">
        <span className="group-hover:underline group-hover:underline-offset-4">{title}</span>
        <span className="text-xs font-bold text-fd-muted-foreground">
          {count} / {pages.length}
        </span>
      </span>
      <span className="mt-2 block h-[5px] rounded-full bg-[var(--m-chip)]">
        <span className="block h-[5px] rounded-full bg-[var(--m-ok)]" style={{ width: `${percent}%` }} />
      </span>
    </Link>
  );
}
