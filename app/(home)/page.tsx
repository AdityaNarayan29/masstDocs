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
          Free system design course with HLD and LLD tutorials. Learn how Netflix, Uber, and WhatsApp
          are designed. Perfect for system design interviews.
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
      <h2 className="text-2xl md:text-3xl font-bold mt-8 mb-4 text-center">
        Explore Learning Paths
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Company HLD Section */}
      <h2 className="text-2xl md:text-3xl font-bold mt-12 mb-4 text-center">
        Company System Design Case Studies
      </h2>
      <p className="text-fd-muted-foreground text-center mb-4 max-w-2xl mx-auto">
        Learn high-level design (HLD) of real-world systems used by top tech companies
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Link href="/sd/case-studies/netflix" className="group p-4 rounded-lg border border-fd-border bg-fd-card hover:border-red-500/50 hover:shadow-md transition-all text-center">
          <span className="font-medium group-hover:text-red-500">Netflix HLD</span>
        </Link>
        <Link href="/sd/case-studies/uber" className="group p-4 rounded-lg border border-fd-border bg-fd-card hover:border-gray-500/50 hover:shadow-md transition-all text-center">
          <span className="font-medium group-hover:text-gray-500">Uber HLD</span>
        </Link>
        <Link href="/sd/case-studies/whatsapp" className="group p-4 rounded-lg border border-fd-border bg-fd-card hover:border-green-500/50 hover:shadow-md transition-all text-center">
          <span className="font-medium group-hover:text-green-500">WhatsApp HLD</span>
        </Link>
        <Link href="/sd/case-studies/instagram" className="group p-4 rounded-lg border border-fd-border bg-fd-card hover:border-pink-500/50 hover:shadow-md transition-all text-center">
          <span className="font-medium group-hover:text-pink-500">Instagram HLD</span>
        </Link>
        <Link href="/sd/case-studies/youtube" className="group p-4 rounded-lg border border-fd-border bg-fd-card hover:border-red-600/50 hover:shadow-md transition-all text-center">
          <span className="font-medium group-hover:text-red-600">YouTube HLD</span>
        </Link>
        <Link href="/sd/case-studies/twitter" className="group p-4 rounded-lg border border-fd-border bg-fd-card hover:border-blue-400/50 hover:shadow-md transition-all text-center">
          <span className="font-medium group-hover:text-blue-400">Twitter HLD</span>
        </Link>
        <Link href="/sd/case-studies/amazon" className="group p-4 rounded-lg border border-fd-border bg-fd-card hover:border-orange-500/50 hover:shadow-md transition-all text-center">
          <span className="font-medium group-hover:text-orange-500">Amazon HLD</span>
        </Link>
        <Link href="/sd/case-studies/slack" className="group p-4 rounded-lg border border-fd-border bg-fd-card hover:border-purple-500/50 hover:shadow-md transition-all text-center">
          <span className="font-medium group-hover:text-purple-500">Slack HLD</span>
        </Link>
      </div>

      {/* Popular Topics */}
      <h2 className="text-2xl md:text-3xl font-bold mt-4 mb-4 text-center">
        System Design Topics
      </h2>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/sd/fundamentals/cap-theorem" className="px-4 py-2 rounded-full border border-fd-border bg-fd-card hover:border-blue-500/50 hover:bg-blue-500/10 transition-all text-sm">
          CAP Theorem
        </Link>
        <Link href="/sd/building-blocks/load-balancer" className="px-4 py-2 rounded-full border border-fd-border bg-fd-card hover:border-blue-500/50 hover:bg-blue-500/10 transition-all text-sm">
          Load Balancers
        </Link>
        <Link href="/sd/building-blocks/cache-strategies" className="px-4 py-2 rounded-full border border-fd-border bg-fd-card hover:border-blue-500/50 hover:bg-blue-500/10 transition-all text-sm">
          Caching Strategies
        </Link>
        <Link href="/sd/building-blocks/sharding" className="px-4 py-2 rounded-full border border-fd-border bg-fd-card hover:border-blue-500/50 hover:bg-blue-500/10 transition-all text-sm">
          Database Sharding
        </Link>
        <Link href="/sd/design-patterns" className="px-4 py-2 rounded-full border border-fd-border bg-fd-card hover:border-green-500/50 hover:bg-green-500/10 transition-all text-sm">
          Design Patterns
        </Link>
        <Link href="/sd/communication" className="px-4 py-2 rounded-full border border-fd-border bg-fd-card hover:border-green-500/50 hover:bg-green-500/10 transition-all text-sm">
          API Design
        </Link>
        <Link href="/sd/fundamentals/microservices" className="px-4 py-2 rounded-full border border-fd-border bg-fd-card hover:border-green-500/50 hover:bg-green-500/10 transition-all text-sm">
          Microservices
        </Link>
        <Link href="/sd/building-blocks/message-queues" className="px-4 py-2 rounded-full border border-fd-border bg-fd-card hover:border-blue-500/50 hover:bg-blue-500/10 transition-all text-sm">
          Message Queues
        </Link>
        <Link href="/hld" className="px-4 py-2 rounded-full border border-fd-border bg-fd-card hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all text-sm">
          HLD Guide
        </Link>
      </div>

      {/* Footer note */}
      <p className="text-center text-fd-muted-foreground text-sm mt-8">
        Click sections to expand/collapse. Click colored topic cards to navigate.
      </p>
    </main>
  );
}
