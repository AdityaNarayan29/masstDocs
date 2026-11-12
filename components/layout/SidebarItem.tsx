"use client";

import type { PageTree } from "fumadocs-core/server";
import { SidebarItem as BaseItem } from "fumadocs-ui/components/layout/sidebar";
import { useDone } from "@/lib/progress";

/** Sidebar page link with a green check once the reader has marked it done. */
export function SidebarItem({ item }: { item: PageTree.Item }) {
  const done = useDone().has(item.url);
  return (
    <BaseItem href={item.url} external={item.external} icon={item.icon}>
      <span className="flex-1">{item.name}</span>
      {done && (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0"
          fill="none"
          stroke="var(--m-ok)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          role="img"
          aria-label="Done"
        >
          <path d="M5 12l5 5L20 7" />
        </svg>
      )}
    </BaseItem>
  );
}
