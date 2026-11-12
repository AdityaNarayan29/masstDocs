import "@/app/global.css";
import { RootProvider } from "fumadocs-ui/provider";
import { JetBrains_Mono, Nunito } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { PWAInstallPrompt } from "@/components/ui/PWAInstallPrompt";
import { ChatWidget } from "@/components/chat";
import { DiagramZoom } from "@/components/mdx/DiagramZoom";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { tokenCss } from "@/lib/diagram-theme.mjs";
import { Analytics } from "@vercel/analytics/react";
import CustomSearchDialog from "@/components/search/CustomSearchDialog";
import { RouteProgress } from "@/components/ui/RouteProgress";

// Masst Reels v2 type: one rounded family everywhere (diagrams too, via
// --dg-font), plus a monospace face for code.
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata = {
  title: {
    default: 'Masst Docs | System Design & AI Engineering, Explained in Diagrams',
    template: '%s | Masst Docs',
  },
  description: 'Free system design and AI engineering, explained in diagrams: HLD and LLD case studies, DSA patterns and production LLM systems. New reel every day.',
  metadataBase: new URL('https://docs.masst.dev'),
  // Note: openGraph.images and twitter.images are auto-populated from
  // app/opengraph-image.tsx (Next.js convention). See:
  // https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
  openGraph: {
    title: 'Masst Docs | System Design & AI Engineering, Explained in Diagrams',
    description: 'System design and AI engineering, explained in diagrams. Free, with a new reel every day.',
    url: 'https://docs.masst.dev/',
    siteName: 'Masst Docs',
    type: 'website',
    images: [
      {
        url: 'https://docs.masst.dev/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Masst Docs — System design and AI engineering, explained in diagrams',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@masstdev',
    title: 'Masst Docs | System Design & AI Engineering, Explained in Diagrams',
    description: 'System design and AI engineering, explained in diagrams. Free, with a new reel every day.',
    images: ['https://docs.masst.dev/opengraph-image'],
  },
  alternates: {
    canonical: 'https://docs.masst.dev/',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

// The chat widget needs all three services; hide it rather than show a broken chat.
const chatEnabled = Boolean(
  process.env.GROQ_API_KEY && process.env.PINECONE_API_KEY && process.env.HUGGINGFACE_API_KEY,
);

export default function Layout({ children }: { children: ReactNode }) {

  return (
    <html lang='en' className={`${nunito.className} ${nunito.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <meta
          name='keywords'
          content='system design, system design tutorial, HLD, LLD, high level design, low level design, system design interview, Netflix system design, Uber system design, WhatsApp architecture, mast docs, masst docs, system design roadmap, scalable systems, distributed systems, software architecture'
        />

        {/* Favicon */}
        <link rel='icon' href='/logo.png' sizes='any' />

        {/* PWA Manifest */}
        <link rel='manifest' href='/manifest.json' />

        {/* Apple Touch Icons for iOS */}
        <link rel='apple-touch-icon' sizes='150x150' href='/app-icons/150.png' />
        <link rel='apple-touch-icon' sizes='167x167' href='/app-icons/167.png' />
        <link rel='apple-touch-icon' sizes='180x180' href='/app-icons/180.png' />
        <link rel='apple-touch-icon' sizes='192x192' href='/app-icons/192.png' />
        <link rel='apple-touch-icon' sizes='256x256' href='/app-icons/256.png' />
        <link rel='apple-touch-icon' sizes='310x310' href='/app-icons/310.png' />
        <link rel='apple-touch-icon' sizes='512x512' href='/app-icons/512.png' />
        <link rel='apple-touch-icon' sizes='1024x1024' href='/app-icons/1024.png' />

        {/* Optional: Safari web app behavior */}
        <meta name='mobile-web-app-capable' content='yes' />
        <meta
          name='apple-mobile-web-app-status-bar-style'
          content='black-translucent'
        />

        {/* Optional: Safari pinned tab */}
        <link rel='mask-icon' href='/icons/512.png' color='#0f172a' />

        {/* TWA: Asset links for Android app verification */}
        <link rel='alternate' href='android-app://com.masst.docs/https/docs.masst.dev/' />

        {/* Diagram colour tokens for light and dark mode (lib/diagram-theme.mjs) */}
        <style dangerouslySetInnerHTML={{ __html: tokenCss() }} />

        {/* Structured Data JSON-LD for SEO */}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Masst Docs",
              alternateName: ["Mast Docs", "MasstDocs", "Masst Documentation", "System Design Docs"],
              url: "https://docs.masst.dev/",
              description:
                "Free system design and AI engineering, explained in diagrams: HLD and LLD case studies, DSA patterns and production LLM systems. New reel every day.",
              publisher: {
                "@type": "Organization",
                name: "Masst",
                logo: {
                  "@type": "ImageObject",
                  url: "https://docs.masst.dev/icons/512.png",
                },
              },
              potentialAction: {
                "@type": "SearchAction",
                target: "https://docs.masst.dev/sd?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {/* Course structured data for better search visibility */}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Course",
              name: "System Design and AI Engineering",
              description: "Free course covering system design (HLD and LLD), DSA interview patterns and production AI engineering, with real-world case studies like Netflix, Uber and WhatsApp.",
              provider: {
                "@type": "Organization",
                name: "Masst Docs",
                sameAs: "https://docs.masst.dev/",
              },
              hasCourseInstance: {
                "@type": "CourseInstance",
                courseMode: "online",
                courseWorkload: "PT20H",
              },
              about: [
                "System Design",
                "High Level Design",
                "Low Level Design",
                "Software Architecture",
                "Distributed Systems",
                "System Design Interview",
                "Design Patterns",
                "Object-Oriented Programming",
                "SOLID Principles",
                "Concurrency",
                "Data Structures and Algorithms",
                "AI Engineering",
                "Retrieval-Augmented Generation",
                "LLM Agents",
              ],
              teaches: [
                "Design scalable distributed systems",
                "Create high-level architecture diagrams",
                "Apply Gang of Four design patterns",
                "Implement SOLID principles in OOP",
                "Solve LLD machine-coding problems (parking lot, elevator, splitwise)",
                "Understand Netflix, Uber, WhatsApp architecture",
                "Handle concurrency with thread pools and locks",
                "Recognise DSA interview patterns (sliding window, graphs, dynamic programming)",
                "Build production LLM systems: retrieval, agents, evals, safety and cost",
              ],
              isAccessibleForFree: true,
            }),
          }}
        />
        {/* BreadcrumbList for better navigation in search results */}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "System Design",
                  item: "https://docs.masst.dev/sd",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "HLD Case Studies",
                  item: "https://docs.masst.dev/hld",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: "LLD & Patterns",
                  item: "https://docs.masst.dev/lld",
                },
              ],
            }),
          }}
        />
      </head>
      <body className='flex flex-col min-h-screen'>
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <RootProvider
          search={{
            // Track filter chips live in the dialog itself.
            SearchDialog: CustomSearchDialog,
          }}
        >
          {children}
          <PWAInstallPrompt />
          <DiagramZoom />
          <MobileTabBar />
          {chatEnabled && <ChatWidget />}
          <Analytics />
        </RootProvider>
      </body>
    </html>
  );
}
