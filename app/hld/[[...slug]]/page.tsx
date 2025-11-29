import { hldSource } from "@/lib/source";
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
// HLD Landing Page Component
// -----------------
function HLDLandingPage() {
  return (
    <DocsPage>
      <DocsTitle>High-Level Design (HLD)</DocsTitle>
      <DocsDescription>
        Learn system design through real-world case studies
      </DocsDescription>
      <DocsBody>
        <p>
          High-Level Design focuses on the architectural overview of a system,
          including major components, their interactions, and data flow between
          them.
        </p>
        <h2>What you&apos;ll learn</h2>
        <ul>
          <li>System architecture patterns and best practices</li>
          <li>Scalability and performance considerations</li>
          <li>Database design and data modeling</li>
          <li>API design and integration patterns</li>
          <li>Real-world case studies from top tech companies</li>
        </ul>
        <h2>Get Started</h2>
        <p>
          Explore our{" "}
          <Link href="/hld/case-studies" className="text-primary underline">
            Case Studies
          </Link>{" "}
          to see how real systems are designed.
        </p>
      </DocsBody>
    </DocsPage>
  );
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

  // Show landing page for /hld root
  if (slug.length === 0) {
    return <HLDLandingPage />;
  }

  return <DocsRenderer source={hldSource} slug={slug} />;
}

// -----------------
// Generate static params for HLD pages
// -----------------
export async function generateStaticParams() {
  return hldSource.generateParams();
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
  const page = hldSource.getPage(slug);
  if (!page) return {};
  return {
    title: page.data?.title,
    description: page.data?.description,
  };
}
