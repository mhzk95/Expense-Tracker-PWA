import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ExpenseTrackerBot/1.0; +https://example.com)',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch URL: ${res.statusText}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const getMetaTag = (name: string) => 
      $(`meta[property='og:${name}']`).attr('content') ||
      $(`meta[name='twitter:${name}']`).attr('content') ||
      $(`meta[name='${name}']`).attr('content');

    const title = getMetaTag('title') || $('title').text() || '';
    const description = getMetaTag('description') || '';
    const image = getMetaTag('image') || '';

    return NextResponse.json({
      title: title.trim(),
      description: description.trim(),
      image: image.trim(),
    });

  } catch (error: any) {
    console.error('Link preview failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
