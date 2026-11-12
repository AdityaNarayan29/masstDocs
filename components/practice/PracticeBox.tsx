"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import type { Practice, PracticeKind } from "@/lib/practice/types";
import type { ReviewResult } from "@/app/api/review/route";

const MIN = 80;
const MAX = 8000;

// Browser-only storage; every access can throw (private mode, blocked storage).
function load<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore: the box still works without persistence.
  }
}

/**
 * "Try it yourself" box at the end of HLD and LLD case studies: the question,
 * the requirements, hints revealed one at a time, and (when Groq is
 * configured) AI feedback on the reader's written answer. The answer and the
 * last review are kept in this browser only.
 */
export function PracticeBox({
  url,
  kind,
  practice,
  reviewEnabled,
}: {
  url: string;
  kind: PracticeKind;
  practice: Practice;
  reviewEnabled: boolean;
}) {
  const answerKey = `masst-practice:${url}:answer`;
  const reviewKey = `masst-practice:${url}:review`;

  const [answer, setAnswer] = useState("");
  const [hintsShown, setHintsShown] = useState(0);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setAnswer(load<string>(answerKey) ?? "");
    setReview(load<ReviewResult>(reviewKey));
  }, [answerKey, reviewKey]);

  const onChange = (value: string) => {
    setAnswer(value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(answerKey, value), 400);
  };

  const showHint = () => {
    setHintsShown((n) => n + 1);
    track("practice_hint", { page: url, hint: hintsShown + 1 });
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    track("practice_submit", { page: url, kind });
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      setReview(data);
      save(reviewKey, data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const length = answer.trim().length;
  const tooShort = length < MIN;
  const placeholder =
    kind === "hld"
      ? "Write your design: requirements and estimates, the main components, data model, how a request flows, and how it scales and fails…"
      : "Write your design: the main classes and their responsibilities, key methods, relationships, patterns you would use, and how you handle concurrency…";

  return (
    <section id="practice" aria-labelledby="practice-heading" className="not-prose mt-12 rounded-xl border border-fd-border bg-fd-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">Practice</p>
      <h2 id="practice-heading" className="mt-1 text-lg font-bold">
        Try it yourself
      </h2>
      <p className="mt-2 font-medium">{practice.prompt}</p>

      <h3 className="mt-4 text-sm font-semibold">Your design should cover</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fd-muted-foreground">
        {practice.requirements.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>

      {hintsShown > 0 && (
        <ol className="mt-4 space-y-2 text-sm">
          {practice.hints.slice(0, hintsShown).map((h, i) => (
            <li key={h} className="rounded-lg border border-fd-border bg-fd-background p-3">
              <span className="font-semibold">Hint {i + 1}:</span> {h}
            </li>
          ))}
        </ol>
      )}
      {hintsShown < practice.hints.length && (
        <button
          type="button"
          onClick={showHint}
          className="mt-3 text-sm font-medium underline underline-offset-4 hover:text-fd-primary"
        >
          Show hint {hintsShown + 1} of {practice.hints.length}
        </button>
      )}

      <label htmlFor="practice-answer" className="mt-5 block text-sm font-semibold">
        Your answer
      </label>
      <textarea
        id="practice-answer"
        value={answer}
        onChange={(e) => onChange(e.target.value)}
        maxLength={MAX}
        rows={10}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-fd-border bg-fd-background p-3 text-sm outline-none focus:ring-2 focus:ring-fd-primary/40"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-fd-muted-foreground">
        <span>
          {length.toLocaleString()} / {MAX.toLocaleString()} characters · saved in this browser
        </span>
        {reviewEnabled ? (
          <button
            type="button"
            onClick={submit}
            disabled={loading || tooShort}
            className="rounded-lg bg-fd-primary px-4 py-2 text-sm font-semibold text-fd-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Reviewing…" : tooShort ? `Write at least ${MIN} characters` : "Get AI feedback"}
          </button>
        ) : (
          <span>Compare your answer with the design above.</span>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-[color-mix(in_srgb,var(--m-fail)_40%,transparent)] bg-[color-mix(in_srgb,var(--m-fail)_10%,transparent)] p-3 text-sm">
          {error}
        </p>
      )}

      {review && (
        <div aria-live="polite" className="mt-5 rounded-lg border border-fd-border bg-fd-background p-4 text-sm">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold">{review.score}/10</span>
            <span className="text-fd-muted-foreground">AI feedback, compared with this page&apos;s design</span>
          </div>
          <p className="mt-2">{review.summary}</p>
          {review.covered.length > 0 && <FeedbackList title="What you covered" items={review.covered} mark="✓" />}
          {review.missed.length > 0 && <FeedbackList title="What to add or fix" items={review.missed} mark="→" />}
          {review.followUps.length > 0 && <FeedbackList title="Follow-up questions to prepare" items={review.followUps} mark="?" />}
          <p className="mt-4 text-xs text-fd-muted-foreground">
            Generated by an AI model. It can be wrong; use it as a second opinion.
          </p>
        </div>
      )}
    </section>
  );
}

function FeedbackList({ title, items, mark }: { title: string; items: string[]; mark: string }) {
  return (
    <>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden className="w-4 shrink-0 text-fd-muted-foreground">
              {mark}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
