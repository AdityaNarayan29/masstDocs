import { source, hldSource } from '@/lib/source';
import { NextResponse } from 'next/server';

export async function GET() {
  const sdPages = source.getPages();
  const hldPages = hldSource.getPages();

  const urls = [
    '/', // Home page
    ...sdPages.map(page => page.url),
    ...hldPages.map(page => page.url),
  ];

  return NextResponse.json({ urls, count: urls.length });
}
