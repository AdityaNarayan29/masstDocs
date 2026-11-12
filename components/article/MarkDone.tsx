"use client";

import { track } from "@vercel/analytics";
import { setDone, useDone } from "@/lib/progress";

function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

/** "Mark as done" toggle. `card` closes an article; `compact` sits in the right rail. */
export function MarkDone({ url, trackName, variant }: { url: string; trackName: string; variant: "card" | "compact" }) {
  const done = useDone().has(url);
  const toggle = () => {
    setDone(url, !done);
    if (!done) track("page_done", { page: url });
  };

  const button = (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={done}
      className={[
        "inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-extrabold transition-colors",
        done
          ? "border border-[color-mix(in_srgb,var(--m-ok)_45%,transparent)] bg-[color-mix(in_srgb,var(--m-ok)_12%,transparent)] text-[var(--m-ok)]"
          : "bg-fd-primary text-fd-primary-foreground hover:opacity-90",
      ].join(" ")}
    >
      <Check className="size-4" />
      {done ? "Done" : "Mark as done"}
    </button>
  );

  if (variant === "compact") return button;

  return (
    <div className="not-prose mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-fd-card p-5">
      <div>
        <p className="font-extrabold">{done ? "Nice, that's one more done." : "Finished reading?"}</p>
        <p className="mt-1 text-sm font-semibold text-fd-muted-foreground">
          {done ? `It counts towards your ${trackName} progress.` : `Mark it done to track your progress in ${trackName}.`}
        </p>
      </div>
      {button}
    </div>
  );
}
