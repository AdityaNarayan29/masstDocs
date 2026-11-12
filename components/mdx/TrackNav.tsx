import Link from 'next/link';
import {
  INTERVIEW_FRAMEWORK,
  getSection,
  getTrack,
  nextSection,
  sectionsInTrack,
  type SectionId,
} from '@/lib/tracks';

/**
 * Track bar for the top of each section's index page: which track this
 * section belongs to, its sibling sections, and where to go next.
 * Usage in MDX: <TrackNav section="sd" />
 */
export function TrackNav({ section }: { section: SectionId }) {
  const current = getSection(section);
  const track = getTrack(current.track);
  const siblings = sectionsInTrack(current.track);
  const next = nextSection(section);
  const nextLabel = section === 'reels' ? 'Start the course' : 'Next';

  return (
    <nav
      aria-label={`${track.title} track`}
      className="not-prose my-6 rounded-2xl border border-fd-border bg-fd-card p-5 text-sm"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="m-label">
          {track.title} track
        </span>
        <span className="text-fd-muted-foreground">{track.blurb}</span>
      </div>

      {siblings.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {siblings.map((s) => {
            const active = s.id === section;
            return (
              <Link
                key={s.id}
                href={s.url}
                aria-current={active ? 'page' : undefined}
                className={[
                  'inline-flex items-center gap-2 rounded-md border px-2.5 py-1 transition-colors',
                  active
                    ? 'border-[var(--m-info)] bg-[var(--m-tint)] font-extrabold text-[var(--m-info)]'
                    : 'border-fd-border font-bold text-fd-muted-foreground hover:text-fd-foreground',
                ].join(' ')}
              >
                {s.title}
              </Link>
            );
          })}
        </div>
      )}

      {current.track === 'interview' && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-fd-muted-foreground">Interview framework:</span>
          {INTERVIEW_FRAMEWORK.map((p) => (
            <Link key={p.url} href={p.url} className="font-medium underline underline-offset-4">
              {p.title}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-3 border-t border-fd-border pt-3">
        <Link href={next.url} className="group inline-flex items-center gap-2 font-medium">
          <span className="text-fd-muted-foreground">{nextLabel}:</span>
          <span className="group-hover:underline underline-offset-4">{next.title}</span>
          <span className="text-fd-muted-foreground">({getTrack(next.track).title})</span>
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </nav>
  );
}
