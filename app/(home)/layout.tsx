import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/app/layout.config';

export const metadata = {
  title: 'System Design Roadmap | Masst Docs - Free HLD & LLD Tutorial',
  description:
    'Free system design tutorial with HLD & LLD. Learn Netflix, Uber, WhatsApp architecture for interviews.',
  openGraph: {
    title: 'System Design Roadmap | Masst Docs',
    description:
      'Free system design roadmap. Learn Netflix, Uber, WhatsApp HLD & LLD for interviews.',
    url: 'https://docs.masst.dev/',
  },
  twitter: {
    title: 'System Design Roadmap | Masst Docs',
    description:
      'Free system design roadmap. Learn Netflix, Uber, WhatsApp HLD & LLD for interviews.',
  },
  alternates: {
    canonical: 'https://docs.masst.dev/',
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <HomeLayout {...baseOptions}>{children}</HomeLayout>;
}
