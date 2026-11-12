"use client";

import dynamic from "next/dynamic";
import type { TreeNode } from "@/lib/roadmap";

// The roadmap reads localStorage for progress, so it renders client-side only.
const SystemDesignRoadmap = dynamic(() => import("@/components/ui/SystemDesignRoadmap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[700px] rounded-xl border border-fd-border bg-fd-card/50 animate-pulse flex items-center justify-center">
      <span className="text-fd-muted-foreground">Loading roadmap...</span>
    </div>
  ),
});

export function RoadmapClient({ tree }: { tree: TreeNode }) {
  return <SystemDesignRoadmap tree={tree} />;
}
