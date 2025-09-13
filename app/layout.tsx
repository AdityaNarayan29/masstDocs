"use client";

import "@/app/global.css";
import { RootProvider } from "fumadocs-ui/provider";
import { Inter } from "next/font/google";
import { useEffect } from "react";
import type { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
});

export default function Layout({ children }: { children: ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err);
        });
    }
  }, []);

  return (
    <html lang='en' className={inter.className} suppressHydrationWarning>
      <head>
        <title>Masst Docs | System Design Documentation</title>
        <meta
          name='description'
          content='Masst Docs is a complete System Design documentation platform. Learn HLD, LLD, system components, case studies, and best practices for building scalable systems.'
        />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='canonical' href='https://docs.masst.dev/' />

        {/* Open Graph / Social Sharing */}
        <meta
          property='og:title'
          content='Masst Docs | System Design Documentation'
        />
        <meta
          property='og:description'
          content='Explore HLD, LLD, system components, case studies, and best practices with Masst Docs.'
        />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://docs.masst.dev/' />
        <meta property='og:image' content='https://x.com/masstdev/photo/' />
        <meta property='og:site_name' content='Masst Docs' />

        {/* Twitter Card */}
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:site' content='@masstdev' />
        <meta
          name='twitter:title'
          content='Masst Docs | System Design Documentation'
        />
        <meta
          name='twitter:description'
          content='Explore HLD, LLD, system components, case studies, and best practices with Masst Docs.'
        />
        <meta name='twitter:image' content='https://x.com/masstdev/photo' />

        {/* Favicon */}
        <link rel='icon' href='/logo.png' sizes='any' />

        {/* PWA Manifest */}
        <link rel='manifest' href='/manifest.json' />

        {/* Theme color for browser UI */}
        <meta name='theme-color' content='#0f172a' />

        {/* Apple Touch Icons for iOS */}
        <link rel='apple-touch-icon' sizes='150x150' href='/icons/150.png' />
        <link rel='apple-touch-icon' sizes='167x167' href='/icons/167.png' />
        <link rel='apple-touch-icon' sizes='180x180' href='/icons/180.png' />
        <link rel='apple-touch-icon' sizes='192x192' href='/icons/192.png' />
        <link rel='apple-touch-icon' sizes='256x256' href='/icons/256.png' />
        <link rel='apple-touch-icon' sizes='310x310' href='/icons/310.png' />
        <link rel='apple-touch-icon' sizes='512x512' href='/icons/512.png' />
        <link rel='apple-touch-icon' sizes='1024x1024' href='/icons/1024.png' />

        {/* Optional: Safari web app behavior */}
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta
          name='apple-mobile-web-app-status-bar-style'
          content='black-translucent'
        />

        {/* Optional: Safari pinned tab */}
        <link rel='mask-icon' href='/icons/512.png' color='#0f172a' />

        {/* Structured Data JSON-LD for SEO */}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Masst Docs",
              url: "https://docs.masst.dev/",
              description:
                "Masst Docs is a complete System Design documentation platform, including HLD, LLD, system components, and case studies.",
              publisher: {
                "@type": "Organization",
                name: "Masst",
                logo: {
                  "@type": "ImageObject",
                  url: "https://docs.masst.dev/icons/512.png",
                },
              },
            }),
          }}
        />
      </head>
      <body className='flex flex-col min-h-screen'>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
