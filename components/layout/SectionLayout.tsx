import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import { baseOptions, socialLinks } from "@/app/layout.config";
import { LOADERS } from "@/lib/roadmap";
import { getSection, sectionsInTrack, type SectionId } from "@/lib/tracks";
import { TrackLinks } from "@/components/layout/TrackLinks";
import { SidebarItem } from "@/components/layout/SidebarItem";

/**
 * Layout for every docs section (/sd, /ai, /hld, /lld, /dsa, /reels):
 * a full-width top bar with the tracks, the current track's sections as
 * tabs under it (when there is more than one), and the section's own
 * sidebar with read checkmarks.
 */
export function SectionLayout({ section, children }: { section: SectionId; children: ReactNode }) {
  const siblings = sectionsInTrack(getSection(section).track);
  const tabs =
    siblings.length > 1
      ? siblings.map((s) => ({ url: s.url, title: s.title, description: s.description }))
      : false;

  return (
    <DocsLayout
      {...baseOptions}
      links={[]}
      tree={LOADERS[section].pageTree}
      tabMode="navbar"
      themeSwitch={{ mode: "light-dark" }}
      nav={{ ...baseOptions.nav, mode: "top", children: <TrackLinks /> }}
      sidebar={{
        tabs,
        components: { Item: SidebarItem },
        footer: (
          <div className="flex items-center gap-1">
            {socialLinks.map((l) =>
              l.type === "icon" ? (
                <a
                  key={l.url}
                  href={l.url}
                  aria-label={l.label}
                  className="grid size-9 place-items-center rounded-lg text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
                >
                  {l.icon}
                </a>
              ) : null,
            )}
          </div>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
