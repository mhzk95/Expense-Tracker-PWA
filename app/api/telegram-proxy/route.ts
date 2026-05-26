import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url || !url.startsWith('https://api.telegram.org/file/bot')) {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return new NextResponse(`Failed to fetch from Telegram: ${res.statusText}`, { status: res.status });
    }

    const blob = await res.blob();
    return new NextResponse(blob, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error("Telegram proxy error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
