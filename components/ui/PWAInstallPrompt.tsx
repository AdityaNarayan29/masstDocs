"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [downloadedPages, setDownloadedPages] = useState(0);
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  // Check if already downloaded for offline
  useEffect(() => {
    const offlineReady = localStorage.getItem("masst-docs-offline-ready");
    if (offlineReady === "true") {
      setIsOfflineReady(true);
    }
  }, []);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    // Track online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Show offline banner after 5 seconds if not already downloaded
    const bannerDismissed = sessionStorage.getItem("offline-banner-dismissed");
    const offlineReady = localStorage.getItem("masst-docs-offline-ready");

    if (!bannerDismissed && offlineReady !== "true") {
      const timer = setTimeout(() => {
        setShowOfflineBanner(true);
      }, 5000);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        window.removeEventListener("appinstalled", handleAppInstalled);
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const downloadForOffline = useCallback(async () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadedPages(0);

    try {
      // Fetch all page URLs
      const response = await fetch("/api/pages");
      const { urls } = await response.json();
      setTotalPages(urls.length);

      // Download each page to cache it
      let completed = 0;
      const batchSize = 5; // Download 5 pages at a time

      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (url: string) => {
            try {
              await fetch(url, { cache: "force-cache" });
            } catch {
              // Ignore individual page errors
            }
            completed++;
            setDownloadedPages(completed);
            setDownloadProgress(Math.round((completed / urls.length) * 100));
          })
        );
      }

      // Mark as offline ready
      localStorage.setItem("masst-docs-offline-ready", "true");
      setIsOfflineReady(true);
      setShowOfflineBanner(false);

      // Show success for 3 seconds
      setTimeout(() => {
        setIsDownloading(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to download for offline:", error);
      setIsDownloading(false);
    }
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  const dismissBanner = () => {
    setShowOfflineBanner(false);
    sessionStorage.setItem("offline-banner-dismissed", "true");
  };

  // Offline indicator
  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-yellow-500/90 px-4 py-2 text-sm font-medium text-yellow-950 shadow-lg backdrop-blur">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 010-5.656m-7.072 7.072a4 4 0 010-5.656m-3.536 3.536a9 9 0 010-12.728"
          />
        </svg>
        You&apos;re offline - viewing cached content
      </div>
    );
  }

  // Download progress indicator
  if (isDownloading) {
    return (
      <div className="fixed bottom-4 left-4 z-50 w-80 rounded-lg border border-fd-border bg-fd-card p-4 shadow-lg">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">
            {downloadProgress === 100 ? "Download complete!" : "Downloading for offline..."}
          </span>
          <span className="text-fd-muted-foreground">
            {downloadedPages}/{totalPages}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-fd-secondary">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              downloadProgress === 100 ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{ width: `${downloadProgress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-fd-muted-foreground">
          {downloadProgress === 100
            ? "All pages cached! You can now read offline."
            : "Please keep this tab open..."}
        </p>
      </div>
    );
  }

  // "Download for offline" banner (shows after 5 seconds)
  if (showOfflineBanner && !isOfflineReady) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border border-fd-border bg-fd-card p-4 shadow-lg sm:left-4 sm:right-auto">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <svg
              className="h-6 w-6 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Make it offline?</h3>
            <p className="mt-1 text-sm text-fd-muted-foreground">
              Download all docs (~20MB) to read without internet
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={downloadForOffline}
                className="rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
              >
                Download
              </button>
              {installPrompt && (
                <button
                  onClick={handleInstall}
                  className="rounded-md border border-fd-border px-3 py-1.5 text-sm font-medium hover:bg-fd-secondary"
                >
                  Install App
                </button>
              )}
              <button
                onClick={dismissBanner}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-fd-muted-foreground hover:bg-fd-secondary"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={dismissBanner}
            className="text-fd-muted-foreground hover:text-fd-foreground"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
