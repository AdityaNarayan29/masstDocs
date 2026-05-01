import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/app/layout.config';
import { lldSource } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={lldSource.pageTree}
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
            url: "/hld",
          },
          {
            title: "System Design - LLD",
            description: "LLD!",
            url: "/lld",
          },
        ],
      }}
    >
      {children}
    </DocsLayout>
  );
}
