import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/app/layout.config';

export const metadata: Metadata = {
  title: 'System Design Roadmap | Masst Docs - Free HLD & LLD Tutorial',
  description:
    'Free system design course with interactive roadmap. Learn HLD and LLD of Netflix, Uber, WhatsApp. Best resource for system design interviews.',
  openGraph: {
    title: 'System Design Roadmap | Masst Docs',
    description:
      'Interactive system design roadmap with HLD & LLD tutorials. Learn Netflix, Uber, WhatsApp architecture.',
    url: 'https://docs.masst.dev/',
  },
  twitter: {
    title: 'System Design Roadmap | Masst Docs',
    description:
      'Interactive system design roadmap with HLD & LLD tutorials. Learn Netflix, Uber, WhatsApp architecture.',
  },
  alternates: {
    canonical: 'https://docs.masst.dev/',
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <HomeLayout {...baseOptions}>{children}</HomeLayout>;
}
