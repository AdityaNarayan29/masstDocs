"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import type { ComponentProps } from "react";

/**
 * A Next link that also records a Vercel Analytics custom event on click.
 * Used for reel → course clicks so we can measure the reels funnel.
 */
export function TrackedLink({
  event,
  data,
  ...props
}: ComponentProps<typeof Link> & { event: string; data: Record<string, string | number> }) {
  return <Link {...props} onClick={() => track(event, data)} />;
}
