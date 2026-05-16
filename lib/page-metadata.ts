import type { Metadata } from "next";

const SITE_URL = "https://docs.masst.dev";
// Generated at build time by app/opengraph-image.tsx and served at /opengraph-image
const OG_IMAGE = `${SITE_URL}/opengraph-image`;

type Surface = "sd" | "hld" | "lld" | "dsa";

/**
 * Each surface owns a disjoint slice of the MDX collection (see
 * lib/source.ts) — case studies live under /hld, the curriculum under /sd,
 * etc. — so the canonical is simply the page's own URL on its surface.
 */
function pickCanonical(slugs: string[], surface: Surface): string {
  const path = slugs.length === 0 ? `/${surface}` : `/${surface}/${slugs.join("/")}`;
  return `${SITE_URL}${path}`;
}

/**
 * Build SEO metadata for a docs page. Sets canonical, openGraph, twitter
 * tags so each page has a unique, indexable card.
 */
export function buildPageMetadata({
  title,
  description,
  slugs,
  surface,
}: {
  title: string;
  description?: string;
  slugs: string[];
  surface: Surface;
}): Metadata {
  const canonical = pickCanonical(slugs, surface);
  const ogTitle = title;
  const ogDescription =
    description ?? "Free system design tutorial — fundamentals, HLD, and LLD with diagrams and code.";

  return {
    title,
    description: ogDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      type: "article",
      siteName: "Masst Docs",
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: ogTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [OG_IMAGE],
    },
  };
}
