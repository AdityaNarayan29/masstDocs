import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions, sidebarTabs } from '@/app/layout.config';
import { aiSource } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={aiSource.pageTree}
      {...baseOptions}
      sidebar={{ tabs: sidebarTabs }}
    >
      {children}
    </DocsLayout>
  );
}
