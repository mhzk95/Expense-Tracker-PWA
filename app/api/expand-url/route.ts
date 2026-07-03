import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Follow redirect using GET and a mobile user agent to prevent consent page/blocks
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
      },
      redirect: 'follow',
    });

    return NextResponse.json({ expandedUrl: response.url });
  } catch (error) {
    console.error("Expand URL error:", error);
    return NextResponse.json({ error: "Failed to expand URL" }, { status: 500 });
  }
}
