import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Known AI/aggressive bot user agents (lowercase for matching)
const BLOCKED_BOTS = [
  "gptbot",
  "chatgpt-user",
  "claudebot",
  "ccbot",
  "bytespider",
  "anthropic-ai",
  "google-extended",
  "facebookbot",
  "applebot-extended",
  "perplexitybot",
  "cohere-ai",
  "mj12bot",
  "dotbot",
  "petalbot",
  "sogou",
  "dataforseobot",
  "amazonbot",
  "youbot",
];

// Simple in-memory rate limiting per IP (edge runtime compatible)
const ipRequestCounts = new Map<
  string,
  { count: number; windowStart: number }
>();

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 120; // max requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestCounts.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipRequestCounts.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  return false;
}

// Periodic cleanup to prevent memory leak (runs every ~1000 requests)
let requestCounter = 0;
function maybeCleanup() {
  requestCounter++;
  if (requestCounter % 1000 !== 0) return;

  const now = Date.now();
  const keys = Array.from(ipRequestCounts.keys());
  for (let i = 0; i < keys.length; i++) {
    const entry = ipRequestCounts.get(keys[i]!);
    if (entry && now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      ipRequestCounts.delete(keys[i]!);
    }
  }
}

export function middleware(request: NextRequest) {
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Block known bad bots
  const isBlockedBot = BLOCKED_BOTS.some((bot) => userAgent.includes(bot));
  if (isBlockedBot) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Block requests with no user agent (likely scrapers)
  if (!userAgent || userAgent === "unknown") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Rate limit per IP
  maybeCleanup();
  if (isRateLimited(ip)) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": "60",
      },
    });
  }

  const response = NextResponse.next();

  // Add security headers
  response.headers.set("X-Robots-Tag", "noai, noimageai");

  return response;
}

export const config = {
  // Run on all page routes, skip static assets and API routes
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js|workbox-).*)",
  ],
};
