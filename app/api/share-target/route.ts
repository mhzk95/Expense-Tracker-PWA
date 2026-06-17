import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // This route acts as a fallback for the Web Share Target if the Service Worker
  // fails to intercept the POST request. Since we cannot write to the client's
  // IndexedDB from the server, we will parse the form data (except files) and
  // redirect them back to the client-side router with query parameters.
  
  try {
    const formData = await request.formData();
    const title = formData.get('share_title')?.toString() || '';
    const text = formData.get('share_text')?.toString() || '';
    const url = formData.get('share_url')?.toString() || '';
    
    // Create query params for the legacy fallback handler in page.tsx
    const searchParams = new URLSearchParams();
    searchParams.set('action', 'save');
    if (title) searchParams.set('title', title);
    if (text) searchParams.set('text', text);
    if (url) searchParams.set('url', url);
    
    return NextResponse.redirect(new URL(`/research?${searchParams.toString()}`, request.url), 303);
  } catch (e) {
    console.error("Share target fallback error:", e);
    return NextResponse.redirect(new URL('/research?share_error=true', request.url), 303);
  }
}
