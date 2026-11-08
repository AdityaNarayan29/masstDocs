import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions, sidebarTabs } from '@/app/layout.config';
import { reelsSource } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={reelsSource.pageTree}
      {...baseOptions}
      sidebar={{ tabs: sidebarTabs }}
    >
      {children}
    </DocsLayout>
  );
}
