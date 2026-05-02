import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/app/layout.config';
import { source } from '@/lib/source';
import { SidebarSocialFooter } from '@/components/SidebarSocialFooter';

const sidebarTabs = [
  {
    title: "System Design",
    description: "Fundamentals, components, communication",
    url: "/sd",
  },
  {
    title: "HLD Case Studies",
    description: "Real-world high-level designs",
    url: "/hld",
  },
  {
    title: "LLD & Patterns",
    description: "OOP, design patterns, machine coding",
    url: "/lld",
  },
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...baseOptions}
      sidebar={{ tabs: sidebarTabs, footer: <SidebarSocialFooter /> }}
    >
      {children}
    </DocsLayout>
  );
}
