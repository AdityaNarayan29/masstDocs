"use client";

import NextLink from "next/link";
import { useRouter, useParams, usePathname } from "next/navigation";
import NextImage from "next/image";
import { FrameworkProvider } from "fumadocs-core/framework";
import { forwardRef, type ComponentProps, type ReactNode } from "react";

type Props = ComponentProps<typeof NextLink>;

/**
 * A Next.js link that loads its page in advance only when the reader shows
 * intent (hover, touch, keyboard focus), never just because it is on screen.
 *
 * Next.js otherwise preloads every visible link; on a docs page that is the
 * whole sidebar, and each preload is a billed ISR read (we measured 18 per
 * page view). A hover gives a couple of hundred milliseconds of head start,
 * which is enough for these static pages.
 */
export const IntentLink = forwardRef<HTMLAnchorElement, Props>(function IntentLink(
  { href, onMouseEnter, onTouchStart, onFocus, prefetch: _ignored, ...props },
  ref,
) {
  const router = useRouter();
  const url = typeof href === "string" ? href : (href.pathname ?? "");
  const internal = url.startsWith("/") && !url.startsWith("//");
  const warm = () => {
    if (internal) router.prefetch(url);
  };
  return (
    <NextLink
      ref={ref}
      href={href}
      prefetch={false}
      onMouseEnter={(e) => {
        warm();
        onMouseEnter?.(e);
      }}
      onTouchStart={(e) => {
        warm();
        onTouchStart?.(e);
      }}
      onFocus={(e) => {
        warm();
        onFocus?.(e);
      }}
      {...props}
    />
  );
});

/**
 * Makes every Fumadocs link (sidebar, footer, breadcrumbs, links inside
 * content) an IntentLink. Fumadocs reads its Link from this context, so this
 * nests inside RootProvider and overrides its default next/link.
 */
export function IntentLinkProvider({ children }: { children: ReactNode }) {
  return (
    <FrameworkProvider
      Link={IntentLink as never}
      Image={NextImage as never}
      useRouter={useRouter}
      useParams={useParams as never}
      usePathname={usePathname}
    >
      {children}
    </FrameworkProvider>
  );
}
