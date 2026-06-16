import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    let title = '';
    let description = '';
    let image = '';

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'WhatsApp/2.23.16.76 A', // Whitelisted by Amazon, Flipkart, etc.
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!res.ok) {
      console.warn(`Direct fetch blocked (${res.status}): ${url}. Falling back to Microlink API.`);
      // Fallback to Microlink API to bypass Cloudflare/WAF IP blocks
      const mlRes = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
      if (mlRes.ok) {
        const mlData = await mlRes.json();
        if (mlData.status === 'success' && mlData.data) {
          title = mlData.data.title || '';
          description = mlData.data.description || '';
          image = mlData.data.image?.url || mlData.data.logo?.url || '';
        }
      }
    } else {
      const html = await res.text();
      const $ = cheerio.load(html);

      const getMetaTag = (name: string) => 
        $(`meta[property='og:${name}']`).attr('content') ||
        $(`meta[name='twitter:${name}']`).attr('content') ||
        $(`meta[name='${name}']`).attr('content');

      title = getMetaTag('title') || $('title').text() || '';
      description = getMetaTag('description') || '';
      image = getMetaTag('image') || '';
    }

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
