import type { Metadata } from "next";
import { aiSource } from "@/lib/source";
import { DocsRenderer } from "@/components/DocsRenderer";
import { buildPageMetadata } from "@/lib/page-metadata";

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  return <DocsRenderer source={aiSource} slug={slug} />;
}

export async function generateStaticParams() {
  return aiSource.generateParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = aiSource.getPage(slug);
  if (!page) return {};
  return buildPageMetadata({
    title: page.data.title,
    description: page.data.description,
    slugs: (slug ?? []) as string[],
    surface: "ai",
  });
}
