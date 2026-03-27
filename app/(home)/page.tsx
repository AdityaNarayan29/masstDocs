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
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 pb-1 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-400 dark:from-gray-300 dark:via-gray-400 dark:to-gray-500 bg-clip-text text-transparent hover:from-gray-600 hover:via-gray-500 hover:to-gray-300 dark:hover:from-gray-200 dark:hover:via-gray-300 dark:hover:to-gray-400 transition-all cursor-pointer">
            System Design Roadmap
          </h1>
        </Link>
        <p className="text-fd-muted-foreground text-lg max-w-2xl mx-auto">
          Free system design course with HLD and LLD tutorials. Learn how Netflix, Uber, and WhatsApp
          are designed. Perfect for system design interviews.
        </p>
        {/* SEO content - visually hidden but accessible to search engines */}
        <p className="sr-only">
          Master the art of designing scalable distributed systems with our comprehensive documentation.
          Whether you are preparing for technical interviews at top tech companies or building production-grade
          applications, our guides cover everything from fundamental concepts like CAP theorem and database
          sharding to real-world architecture patterns used by industry leaders.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-500 text-white">HLD</span>
          <span className="text-sm text-fd-muted-foreground">High-Level Design</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-xs font-bold bg-blue-500 text-white">LLD</span>
          <span className="text-sm text-fd-muted-foreground">Low-Level Design</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-xs font-bold bg-violet-500 text-white">BOTH</span>
          <span className="text-sm text-fd-muted-foreground">HLD + LLD</span>
        </div>
      </div>

      {/* Roadmap */}
      <SystemDesignRoadmap />

      {/* Quick Links */}
      <h2 className="text-2xl md:text-3xl font-bold mt-8 mb-4 text-center">
        Explore Learning Paths
      </h2>
      <p className="text-fd-muted-foreground text-center mb-6 max-w-2xl mx-auto">
        Our structured curriculum takes you from basic concepts to advanced system architecture.
        Each section builds upon the previous, ensuring a solid foundation for designing complex systems.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/sd/fundamentals"
          className="group p-6 rounded-xl border border-fd-border bg-fd-card hover:border-green-500/50 hover:shadow-lg transition-all"
        >
          <h3 className="font-semibold text-lg mb-2 group-hover:text-green-500 transition-colors">
            Start with Fundamentals
          </h3>
          <p className="text-sm text-fd-muted-foreground">
            Learn CAP theorem, consistency models, scalability patterns, and essential distributed systems concepts that form the foundation of system design.
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
            Deep dive into databases, caching strategies, load balancers, message queues, and other building blocks used in modern architectures.
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
            Explore real-world system designs of Netflix, Uber, WhatsApp, Instagram, and 15+ other popular applications used by millions.
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

      {/* Why Learn System Design */}
      <div className="mt-12 p-6 rounded-xl border border-fd-border bg-fd-card/50">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Why Learn System Design?</h2>
        <p className="text-fd-muted-foreground mb-4">
          System design is a critical skill for software engineers at all levels. Understanding how to architect
          scalable, reliable, and maintainable systems is essential for building successful applications that
          can handle millions of users.
        </p>
        <p className="text-fd-muted-foreground mb-4">
          Whether you are interviewing at companies like Google, Amazon, Meta, or Microsoft, or leading
          architecture decisions at your current company, system design knowledge helps you make better
          technical decisions and communicate effectively with stakeholders.
        </p>
        <p className="text-fd-muted-foreground">
          Our documentation covers both High-Level Design (HLD) for understanding overall system architecture
          and Low-Level Design (LLD) for implementing specific components with clean, maintainable code.
        </p>
      </div>

      {/* Footer note */}
      <p className="text-center text-fd-muted-foreground text-sm mt-8">
        Click sections to expand/collapse. Click colored topic cards to navigate.
      </p>

      {/* Footer Links */}
      <div className="flex justify-center gap-6 mt-8 pt-8 border-t border-fd-border">
        <Link
          href="/ai-architecture"
          className="text-fd-muted-foreground hover:text-fd-foreground transition-colors text-sm font-medium"
        >
          AI Architecture
        </Link>
      </div>

      {/* Social Links */}
      <div className="flex justify-center gap-6 mt-4">
        <a
          href="https://x.com/Adityanaraynn29"
          target="_blank"
          rel="noopener noreferrer"
          className="text-fd-muted-foreground hover:text-fd-foreground transition-colors"
          aria-label="Follow us on Twitter"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <a
          href="https://github.com/AdityaNarayan29"
          target="_blank"
          rel="noopener noreferrer"
          className="text-fd-muted-foreground hover:text-fd-foreground transition-colors"
          aria-label="View our GitHub"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
        </a>
        <a
          href="https://www.linkedin.com/company/masstdev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-fd-muted-foreground hover:text-fd-foreground transition-colors"
          aria-label="Connect on LinkedIn"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </a>
      </div>
    </main>
  );
}
