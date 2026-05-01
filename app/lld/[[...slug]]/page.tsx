import { lldSource } from "@/lib/source";
import { DocsRenderer } from "@/components/DocsRenderer";
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from "fumadocs-ui/page";
import Link from "next/link";
import type { Metadata } from "next";

// -----------------
// LLD Landing Page Component
// -----------------
function LLDLandingPage() {
  return (
    <DocsPage>
      <DocsTitle>Low-Level Design (LLD)</DocsTitle>
      <DocsDescription>
        Object-oriented design, design patterns, and machine-coding case studies
      </DocsDescription>
      <DocsBody>
        <p>
          Low-Level Design focuses on class-level structure, object
          interactions, and concrete implementation. It is the bridge between
          high-level architecture and code.
        </p>
        <h2>What you&apos;ll learn</h2>
        <ul>
          <li>OOP principles and SOLID</li>
          <li>Gang of Four design patterns (creational, structural, behavioral)</li>
          <li>Concurrency primitives and patterns</li>
          <li>Machine-coding case studies (parking lot, elevator, splitwise, ...)</li>
        </ul>
        <h2>Get Started</h2>
        <p>
          Begin with{" "}
          <Link href="/lld/foundations/solid" className="text-primary underline">
            SOLID principles
          </Link>{" "}
          or jump into{" "}
          <Link href="/lld/case-studies/parking-lot" className="text-primary underline">
            case studies
          </Link>
          .
        </p>
      </DocsBody>
    </DocsPage>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const awaitedParams = await params;
  const slug = awaitedParams.slug ?? [];

  if (slug.length === 0) {
    return <LLDLandingPage />;
  }

  return <DocsRenderer source={lldSource} slug={slug} />;
}

export async function generateStaticParams() {
  return lldSource.generateParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const awaitedParams = await params;
  const slug = awaitedParams.slug ?? [];
  const page = lldSource.getPage(slug);
  if (!page) return {};
  return {
    title: page.data?.title,
    description: page.data?.description,
  };
}
