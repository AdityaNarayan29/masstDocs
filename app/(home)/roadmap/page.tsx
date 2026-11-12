import type { Metadata } from "next";
import { RoadmapClient } from "@/components/home/RoadmapClient";
import { buildRoadmapTree } from "@/lib/roadmap";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Every page of Masst Docs in reading order, across system design, AI engineering, HLD and LLD case studies, DSA patterns and reel notes.",
  alternates: { canonical: "https://docs.masst.dev/roadmap" },
};

export default function RoadmapPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 pt-14 pb-16 md:px-6">
      <span className="m-label">Roadmap</span>
      <h1 className="mt-2 text-[40px] leading-tight font-extrabold tracking-[-0.03em]">Every page, in reading order</h1>
      <p className="mt-3 max-w-2xl font-medium text-fd-muted-foreground">
        Open a section, click a topic to read it. Pages you mark as done show here, in the sidebar and on the home page. Progress is saved in this browser.
      </p>
      <div className="mt-8">
        <RoadmapClient tree={buildRoadmapTree()} />
      </div>
    </main>
  );
}
