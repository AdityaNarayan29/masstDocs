"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";

/**
 * Share actions on a diagram's own page (/d/<slug>). Every target gets the
 * page link, whose preview is the diagram card, so a share always leads back.
 */
export function ShareBar({ url, title, card, slug }: { url: string; title: string; card: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const text = `${title}, explained in one diagram`;
  const enc = encodeURIComponent;
  const targets = [
    { id: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { id: "x", label: "X", href: `https://x.com/intent/post?text=${enc(text)}&url=${enc(url)}` },
    { id: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${enc(`${text} ${url}`)}` },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      track("diagram_share", { slug, via: "copy" });
    } catch {
      // Clipboard blocked: the address bar still has the link.
    }
  };

  const chip =
    "inline-flex min-h-10 items-center gap-2 rounded-full border border-fd-border bg-fd-background px-4 text-sm font-extrabold transition-colors hover:border-[var(--m-info)] hover:text-[var(--m-info)]";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={copy} className={chip} aria-live="polite">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {copied ? <path d="m5 12 5 5L20 7" /> : <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />}
        </svg>
        {copied ? "Copied" : "Copy link"}
      </button>
      {targets.map((t) => (
        <a
          key={t.id}
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          className={chip}
          onClick={() => track("diagram_share", { slug, via: t.id })}
        >
          {t.label}
        </a>
      ))}
      <a
        href={card}
        download={`${slug}.png`}
        className={chip}
        onClick={() => track("diagram_download", { slug })}
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
        Download image
      </a>
    </div>
  );
}
