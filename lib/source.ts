import { docs } from "@/.source";
import { loader } from "fumadocs-core/source";

// Default source
export const source = loader({
  baseUrl: "/sd",
  source: docs.toFumadocsSource(),
});

// Raw HLD source
const rawHldSource = loader({
  baseUrl: "/hld",
  source: docs.toFumadocsSource(),
});

/**
 * Inject HLD flag from `icon` frontmatter
 */
function injectHLDFlag(page: any) {
  if (!page) return page;

  const icon = page.data?.icon;

  // Debug log
  console.log("🔍 PAGE ICON DEBUG:", {
    url: page.url,
    title: page.data?.title,
    icon,
  });

  return {
    ...page,
    data: {
      ...page.data,
      hld: icon === "hld",
    },
  };
}

const isHLD = (p: any) => p?.data?.hld === true;

/**
 * Filtered HLD source
 */
export const hldSource: typeof rawHldSource = {
  ...rawHldSource,
  getPages: () =>
    rawHldSource.getPages().map(injectHLDFlag).filter(isHLD),
  getPage: (slug?: string[], lang?: string) => {
    const page = injectHLDFlag(rawHldSource.getPage(slug, lang));
    return isHLD(page) ? page : undefined;
  },
  generateParams: () =>
    rawHldSource
      .generateParams()
      .filter((params) => {
        const page = injectHLDFlag(
          rawHldSource.getPage(params.slug, params.lang)
        );
        return isHLD(page);
      }) as ReturnType<typeof rawHldSource.generateParams>,
};
