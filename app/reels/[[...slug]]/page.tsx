import type { Metadata } from "next";
import { reelsSource } from "@/lib/source";
import { DocsRenderer } from "@/components/DocsRenderer";
import { GoDeeper } from "@/components/reels/GoDeeper";
import { buildPageMetadata } from "@/lib/page-metadata";

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  return (
    <DocsRenderer
      source={reelsSource}
      slug={slug}
      footer={(page) =>
        page.data.reel ? (
          <GoDeeper reel={page.data.reel} related={page.data.related} instagram={page.data.instagram} />
        ) : null
      }
    />
  );
}

export async function generateStaticParams() {
  return reelsSource.generateParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = reelsSource.getPage(slug);
  if (!page) return {};
  return buildPageMetadata({
    title: page.data.title,
    description: page.data.description,
    slugs: (slug ?? []) as string[],
    surface: "reels",
  });
}
