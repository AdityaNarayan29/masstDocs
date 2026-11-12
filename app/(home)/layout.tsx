import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/app/layout.config';
import { TrackLinks } from '@/components/layout/TrackLinks';

export const metadata = {
  title: { absolute: 'Masst Docs | System Design & AI Engineering, Explained in Diagrams' },
  description: 'Free system design and AI engineering, explained in diagrams: HLD and LLD case studies, DSA patterns and production LLM systems. New reel every day.',
  openGraph: {
    title: 'Masst Docs | System Design & AI Engineering, Explained in Diagrams',
    description: 'System design and AI engineering, explained in diagrams. Free, with a new reel every day.',
    url: 'https://docs.masst.dev/',
  },
  twitter: {
    title: 'Masst Docs | System Design & AI Engineering, Explained in Diagrams',
    description: 'System design and AI engineering, explained in diagrams. Free, with a new reel every day.',
  },
  alternates: {
    canonical: 'https://docs.masst.dev/',
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout
      {...baseOptions}
      links={[]}
      themeSwitch={{ mode: 'light-dark' }}
      nav={{ ...baseOptions.nav, children: <TrackLinks /> }}
    >
      {children}
    </HomeLayout>
  );
}
