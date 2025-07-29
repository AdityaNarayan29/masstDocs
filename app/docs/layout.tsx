import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/app/layout.config';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...baseOptions}
      sidebar={{
        tabs: [
          {
            title: "Docs home",
            description: "Hello World!",
            // active for `/docs/components` and sub routes like `/docs/components/button`
            url: "/docs",
            // urls: new Set(['/docs/test', '/docs/components']),
          },
          {
            title: "System Design - HLD",
            description: "Hello World!",
            // active for `/docs/components` and sub routes like `/docs/components/button`
            url: "/hld",
            // optionally, you can specify a set of urls which activates the item
            // urls: new Set(['/docs/test', '/docs/components']),
          },
          {
            title: "System Design - LLD",
            description: "Hello World!",
            // active for `/docs/components` and sub routes like `/docs/components/button`
            url: "/lld",
            // optionally, you can specify a set of urls which activates the item
            // urls: new Set(['/docs/test', '/docs/components']),
          },
        ],
      }}
    >
      {children}
    </DocsLayout>
  );
}
