"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const SystemDesignRoadmap = dynamic(
  () => import("@/components/ui/SystemDesignRoadmap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[700px] rounded-xl border border-fd-border bg-fd-card/50 animate-pulse flex items-center justify-center">
        <span className="text-fd-muted-foreground">Loading roadmap...</span>
      </div>
    ),
  }
);

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col px-4 py-8 md:px-8 lg:px-16 max-w-7xl mx-auto w-full">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <Link href="/sd">
          <h1 className="text-xl md:text-5xl font-bold mb-4 pb-1 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-400 dark:from-gray-300 dark:via-gray-400 dark:to-gray-500 bg-clip-text text-transparent hover:from-gray-600 hover:via-gray-500 hover:to-gray-300 dark:hover:from-gray-200 dark:hover:via-gray-300 dark:hover:to-gray-400 transition-all cursor-pointer">
            System Design Roadmap
          </h1>
        </Link>
        <p className="text-fd-muted-foreground text-lg max-w-2xl mx-auto">
          Master system design from fundamentals to real-world case studies.
          Click on any node to dive deeper into the topic.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
          <span className="text-xs text-fd-muted-foreground">Section</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white">HLD</span>
          <span className="text-xs text-fd-muted-foreground">High-Level Design</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white">LLD</span>
          <span className="text-xs text-fd-muted-foreground">Low-Level Design</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-500 text-white">BOTH</span>
          <span className="text-xs text-fd-muted-foreground">HLD + LLD</span>
        </div>
      </div>

      {/* Roadmap */}
      <SystemDesignRoadmap />

      {/* Quick Links */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/sd/fundamentals"
          className="group p-6 rounded-xl border border-fd-border bg-fd-card hover:border-green-500/50 hover:shadow-lg transition-all"
        >
          <h3 className="font-semibold text-lg mb-2 group-hover:text-green-500 transition-colors">
            Start with Fundamentals
          </h3>
          <p className="text-sm text-fd-muted-foreground">
            Learn CAP theorem, scalability, and core concepts
          </p>
        </Link>
        <Link
          href="/sd/system-components"
          className="group p-6 rounded-xl border border-fd-border bg-fd-card hover:border-orange-500/50 hover:shadow-lg transition-all"
        >
          <h3 className="font-semibold text-lg mb-2 group-hover:text-orange-500 transition-colors">
            System Components
          </h3>
          <p className="text-sm text-fd-muted-foreground">
            Databases, caching, load balancers, and more
          </p>
        </Link>
        <Link
          href="/sd/case-studies"
          className="group p-6 rounded-xl border border-fd-border bg-fd-card hover:border-purple-500/50 hover:shadow-lg transition-all"
        >
          <h3 className="font-semibold text-lg mb-2 group-hover:text-purple-500 transition-colors">
            Case Studies
          </h3>
          <p className="text-sm text-fd-muted-foreground">
            Netflix, Uber, WhatsApp, and 15+ real systems
          </p>
        </Link>
      </div>

      {/* Footer note */}
      <p className="text-center text-fd-muted-foreground text-sm mt-8">
        Click sections to expand/collapse. Click colored topic cards to navigate.
      </p>
    </main>
  );
}
