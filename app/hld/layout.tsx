import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/app/layout.config';
import { hldSource } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={hldSource.pageTree}
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
            description: "HLD!",
            // active for `/docs/components` and sub routes like `/docs/components/button`
            url: "/hld",
            // optionally, you can specify a set of urls which activates the item
            // urls: new Set(['/docs/hld', '/docs/components']),
          },
        ],
      }}
    >
      {children}
    </DocsLayout>
  );
}
