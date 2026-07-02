import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Follow redirect
    const response = await fetch(url, {
      method: 'HEAD', // HEAD is often enough, but some services require GET
      redirect: 'follow',
    });

    return NextResponse.json({ expandedUrl: response.url });
  } catch (error) {
    console.error("Expand URL error:", error);
    return NextResponse.json({ error: "Failed to expand URL" }, { status: 500 });
  }
}
