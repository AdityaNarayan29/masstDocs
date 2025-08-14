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
