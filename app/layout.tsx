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
          content='Masst Docs is a complete System Design documentation platform, including HLD, LLD, fundamentals, and case studies.'
        />
        <meta name='viewport' content='width=device-width, initial-scale=1' />

        {/* Open Graph / Social Sharing */}
        <meta property='og:title' content='Masst Docs | System Design Docs' />
        <meta
          property='og:description'
          content='Explore HLD, LLD, system components, and case studies with Masst Docs.'
        />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://docs.masst.dev/' />
        <meta property='og:image' content='https://x.com/masstdev/photo/' />

        {/* Twitter Card */}
        <meta name='twitter:card' content='Masst Docs' />
        <meta name='twitter:title' content='Masst Docs | System Design Docs' />
        <meta
          name='twitter:description'
          content='Explore HLD, LLD, system components, and case studies with Masst Docs.'
        />
        <meta name='twitter:image' content='https://x.com/masstdev/photo' />

        {/* Favicon */}
        <link rel='icon' href='/logo.png' sizes='any' />

        {/* PWA Manifest */}
        <link rel='manifest' href='/manifest.json' />

        {/* Theme color for browser UI */}
        <meta name='theme-color' content='#0f172a' />

        {/* Apple Touch Icon */}
        <link rel='apple-touch-icon' href='/icons/92.png' />

        {/* Optional: Safari pinned tab */}
        <link rel='mask-icon' href='/icons/512.png' color='#0f172a' />
      </head>
      <body className='flex flex-col min-h-screen'>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
