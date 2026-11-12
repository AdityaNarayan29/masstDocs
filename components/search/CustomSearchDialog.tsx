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
import { TRACKS, sectionsInTrack } from '@/lib/tracks';

// Filters are tracks; each covers its sections' search tags (app/api/search).
const TRACK_FILTERS = TRACKS.map((t) => ({ name: t.title, value: sectionsInTrack(t.id).map((s) => s.id) }));

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


export default function CustomSearchDialog({
  defaultTag,
  api,
  delayMs,
  ...props
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTag?: string;
  api?: string;
  delayMs?: number;
}) {
  const { locale } = useI18n();
  const [tag, setTag] = useState<string[] | undefined>(defaultTag ? [defaultTag] : undefined);
  const tagKey = tag?.join(',');
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
        <SearchDialogFooter>
          <div className="flex flex-wrap items-center gap-2">
            {[{ name: 'All', value: undefined as string[] | undefined }, ...TRACK_FILTERS].map((t) => {
              const selected = (t.value?.join(',') ?? undefined) === tagKey;
              return (
                <button
                  key={t.name}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setTag(t.value)}
                  className={[
                    'rounded-full border px-3 py-1 text-[13px] transition-colors',
                    selected
                      ? 'border-[var(--m-info)] bg-[var(--m-tint)] font-extrabold text-[var(--m-info)]'
                      : 'font-bold text-[var(--m-ink-2)] hover:bg-fd-accent',
                  ].join(' ')}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </SearchDialogFooter>
      </SearchDialogContent>
    </SearchDialog>
  );
}
