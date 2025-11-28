import { source } from "@/lib/source";
import { DocsRenderer } from "@/components/DocsRenderer";

export default function Page({ params }: { params: { slug?: string[] } }) {
  return <DocsRenderer source={source} slug={params.slug} />;
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({
  params,
}: {
  params: { slug?: string[] };
}) {
  const page = source.getPage(params.slug);
  if (!page) return {};
  return { title: page.data.title, description: page.data.description };
}
