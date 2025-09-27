import { hldSource } from "@/lib/source";
import { DocsRenderer } from "@/components/DocsRenderer";
import type { Metadata } from "next";

// --- Recursive filter for HLD pages/folders ---
function filterHLDTree(node: any): any | null {
  if (node.type === "page") return node.data?.icon === "hld" ? node : null;
  if (node.type === "folder") {
    const children = (node.children ?? []).map(filterHLDTree).filter(Boolean);
    const index =
      node.index &&
      node.index.type === "page" &&
      node.index.data?.icon === "hld"
        ? node.index
        : undefined;
    if (!children.length && !index) return null;
    return {
      type: "folder",
      name: String(node.name),
      url: "",
      children,
      index,
    };
  }
  return null;
}

// -----------------
// Page component
// -----------------
export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const awaitedParams = await params;
  const slug = awaitedParams.slug ?? [];

  const filteredSource: any = {
    ...hldSource,
    getPages: () =>
      hldSource.getPages().filter((p: any) => p.data?.icon === "hld"),
    getPageTree: () => {
      const root = hldSource.getPageTree();
      const children = (root.children ?? []).map(filterHLDTree).filter(Boolean);
      return { name: String(root.name), children };
    },
  };

  return <DocsRenderer source={filteredSource} slug={slug} />;
}

// -----------------
// Generate static params for HLD pages
// -----------------
export async function generateStaticParams() {
  return hldSource
    .generateParams()
    .filter(
      (params: any) =>
        hldSource.getPage(params.slug, params.lang)?.data?.icon === "hld"
    );
}

// -----------------
// Generate metadata dynamically
// -----------------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const awaitedParams = await params;
  const slug = awaitedParams.slug ?? [];
  const page: any = await hldSource.getPage(slug);
  if (!page) return {};
  return {
    title: page.data?.title,
    description: page.data?.description,
  };
}
