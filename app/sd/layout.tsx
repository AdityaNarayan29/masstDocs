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
            title: "System Design",
            description: "Hello World!",
            url: "/sd",
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
            url: "/lld",
          },
        ],
      }}
    >
      {children}
    </DocsLayout>
  );
}
