import "@/app/global.css";
import { RootProvider } from "fumadocs-ui/provider";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { PWAInstallPrompt } from "@/components/ui/PWAInstallPrompt";
import { ChatWidget } from "@/components/chat";

const inter = Inter({
  subsets: ["latin"],
});

export default function Layout({ children }: { children: ReactNode }) {

  return (
    <html lang='en' className={inter.className} suppressHydrationWarning>
      <head>
        <title>Masst Docs | System Design Tutorial, HLD & LLD Guide</title>
        <meta
          name='description'
          content='Free System Design tutorial with HLD, LLD examples. Learn Netflix, Uber, WhatsApp architecture. Best system design roadmap for interviews.'
        />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <meta
          name='keywords'
          content='system design, system design tutorial, HLD, LLD, high level design, low level design, system design interview, Netflix system design, Uber system design, WhatsApp architecture, mast docs, masst docs, system design roadmap, scalable systems, distributed systems, software architecture'
        />
        <link rel='canonical' href='https://docs.masst.dev/' />

        {/* Open Graph / Social Sharing */}
        <meta
          property='og:title'
          content='Masst Docs | System Design Tutorial, HLD & LLD Guide'
        />
        <meta
          property='og:description'
          content='Free System Design tutorial. Learn Netflix, Uber, WhatsApp HLD with diagrams. Best roadmap for system design interviews.'
        />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://docs.masst.dev/' />
        <meta property='og:image' content='https://docs.masst.dev/og-image.png' />
        <meta property='og:image:width' content='1200' />
        <meta property='og:image:height' content='630' />
        <meta property='og:image:type' content='image/png' />
        <meta property='og:image:alt' content='Masst Docs - System Design Tutorial Platform' />
        <meta property='og:site_name' content='Masst Docs' />
        <meta property='og:updated_time' content={new Date().toISOString()} />

        {/* Twitter Card */}
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:site' content='@masstdev' />
        <meta
          name='twitter:title'
          content='Masst Docs | System Design Tutorial, HLD & LLD Guide'
        />
        <meta
          name='twitter:description'
          content='Free System Design tutorial. Learn Netflix, Uber, WhatsApp HLD with diagrams. Best roadmap for system design interviews.'
        />
        <meta name='twitter:image' content='https://docs.masst.dev/og-image.png' />
        <meta name='twitter:image:alt' content='Masst Docs - System Design Tutorial Platform' />

        {/* Favicon */}
        <link rel='icon' href='/logo.png' sizes='any' />

        {/* PWA Manifest */}
        <link rel='manifest' href='/manifest.json' />

        {/* Theme color for browser UI */}
        <meta name='theme-color' content='#000000' />

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
                "Free System Design tutorial platform. Learn HLD, LLD, and real-world architecture of Netflix, Uber, WhatsApp, and more.",
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
              name: "System Design Tutorial",
              description: "Complete system design course covering HLD, LLD, distributed systems, and real-world case studies like Netflix, Uber, and WhatsApp.",
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
              ],
              teaches: [
                "Design scalable distributed systems",
                "Create high-level architecture diagrams",
                "Implement low-level design patterns",
                "Understand Netflix, Uber, WhatsApp architecture",
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
              ],
            }),
          }}
        />
      </head>
      <body className='flex flex-col min-h-screen'>
        <RootProvider>
          {children}
          <PWAInstallPrompt />
          <ChatWidget />
        </RootProvider>
      </body>
    </html>
  );
}
