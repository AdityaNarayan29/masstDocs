import type { Metadata } from "next";

const SITE_URL = "https://docs.masst.dev";
// Generated at build time by app/opengraph-image.tsx and served at /opengraph-image
const OG_IMAGE = `${SITE_URL}/opengraph-image`;

/**
 * Sections whose canonical URL is /hld/... (case studies are HLD content).
 * Everything else canonicalizes to /sd/... (or /lld/... for LLD pages).
 */
const HLD_CANONICAL_PREFIXES = ["case-studies"];

type Surface = "sd" | "hld" | "lld" | "dsa";

function pickCanonical(slugs: string[], surface: Surface): string {
  if (surface === "lld") {
    return slugs.length === 0 ? `${SITE_URL}/lld` : `${SITE_URL}/lld/${slugs.join("/")}`;
  }
  if (surface === "dsa") {
    return slugs.length === 0 ? `${SITE_URL}/dsa` : `${SITE_URL}/dsa/${slugs.join("/")}`;
  }

  // For SD and HLD surfaces, route the canonical based on content type.
  if (slugs.length === 0) {
    // /sd root canonicalizes to /sd; /hld root canonicalizes to /hld
    return `${SITE_URL}/${surface}`;
  }
  const top = slugs[0];
  if (HLD_CANONICAL_PREFIXES.includes(top)) {
    return `${SITE_URL}/hld/${slugs.join("/")}`;
  }
  return `${SITE_URL}/sd/${slugs.join("/")}`;
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
