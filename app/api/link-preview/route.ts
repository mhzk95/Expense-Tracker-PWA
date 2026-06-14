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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
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
