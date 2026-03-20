import { source, hldSource } from '@/lib/source';

type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: 'weekly' | 'daily' | 'monthly' | 'yearly' | 'always' | 'hourly' | 'never';
  priority: number;
};

export default function sitemap(): SitemapEntry[] {
  const baseUrl = 'https://docs.masst.dev';
  // Use a fixed build-time date so CDN can cache the sitemap
  // instead of regenerating on every request
  const now = new Date('2026-03-20');

  // Static pages
  const staticPages: SitemapEntry[] = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];

  // SD documentation pages
  const sdPages: SitemapEntry[] = source.getPages().map((page) => ({
    url: `${baseUrl}/sd/${page.slugs.join('/')}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // HLD documentation pages
  const hldPages: SitemapEntry[] = hldSource.getPages().map((page) => ({
    url: `${baseUrl}/hld/${page.slugs.join('/')}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...sdPages, ...hldPages];
}
