'use client';

import { useState } from 'react';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
} from 'fumadocs-ui/components/dialog/search';
import { useDocsSearch } from 'fumadocs-core/search/client';
import { useI18n } from 'fumadocs-ui/provider';

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animate-search-spin text-fd-primary shrink-0 ${className}`}
      width={18}
      height={18}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path
        d="M21 12a9 9 0 0 1-9 9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

type TagItem = { name: string; value: string };

// Section colors keyed by tag value — matches homepage palette
const TAG_STYLES: Record<string, { bg: string; ring: string }> = {
  sd:  { bg: 'bg-emerald-500', ring: 'ring-emerald-500/40' },
  hld: { bg: 'bg-blue-500',    ring: 'ring-blue-500/40' },
  lld: { bg: 'bg-violet-500',  ring: 'ring-violet-500/40' },
  dsa: { bg: 'bg-orange-500',  ring: 'ring-orange-500/40' },
};

export default function CustomSearchDialog({
  tags = [],
  allowClear = false,
  defaultTag,
  api,
  delayMs,
  ...props
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags?: TagItem[];
  allowClear?: boolean;
  defaultTag?: string;
  api?: string;
  delayMs?: number;
}) {
  const { locale } = useI18n();
  const [tag, setTag] = useState<string | undefined>(defaultTag);
  const { search, setSearch, query } = useDocsSearch({
    type: 'fetch',
    api,
    delayMs: delayMs ?? 250,
    locale,
    tag,
  });

  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          {query.isLoading && <Spinner />}
          <SearchDialogClose />
        </SearchDialogHeader>
        {query.isLoading && (
          <div className="relative h-[3px] overflow-hidden bg-fd-border/30">
            <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-fd-primary to-transparent animate-search-shimmer" />
          </div>
        )}
        <div className="relative">
          <div
            className={
              query.isLoading
                ? 'pointer-events-none opacity-40 blur-[1px] transition-[opacity,filter] duration-150'
                : 'transition-[opacity,filter] duration-150'
            }
          >
            <SearchDialogList items={query.data !== 'empty' ? query.data : null} />
          </div>
          {query.isLoading && (
            <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-fd-popover border border-fd-border shadow-sm">
                <Spinner />
                <span className="text-xs font-medium text-fd-muted-foreground">Searching…</span>
              </div>
            </div>
          )}
        </div>
        {tags.length > 0 && (
          <SearchDialogFooter>
            <div className="flex items-center gap-2 flex-wrap">
              {tags.map((t) => {
                const selected = tag === t.value;
                const style = TAG_STYLES[t.value] ?? { bg: 'bg-gray-500', ring: 'ring-gray-500/40' };
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTag(selected && allowClear ? undefined : t.value)}
                    className={[
                      'px-3 py-1 rounded-md text-xs font-bold text-white transition-all',
                      style.bg,
                      selected
                        ? `opacity-100 scale-105 shadow-md ring-2 ${style.ring}`
                        : 'opacity-60 hover:opacity-90',
                    ].join(' ')}
                  >
                    {t.name}
                  </button>
                );
              })}
              {allowClear && tag && (
                <button
                  type="button"
                  onClick={() => setTag(undefined)}
                  className="px-3 py-1 rounded-md text-xs font-medium text-fd-muted-foreground hover:text-fd-foreground border border-fd-border transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </SearchDialogFooter>
        )}
      </SearchDialogContent>
    </SearchDialog>
  );
}
