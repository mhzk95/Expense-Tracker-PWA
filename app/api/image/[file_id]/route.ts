import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file_id: string }> }
) {
  try {
    let session = null;
    try {
      session = await getServerSession(authOptions);
    } catch (e: any) {
      console.warn("getServerSession failed (possibly EMAXCONNSESSION):", e.message);
    }

    const host = request.headers.get("host") || "";
    const isLocalRequest = host.includes("localhost") || host.includes("127.0.0.1") || host.startsWith("192.168.") || host.startsWith("10.");

    if (!session?.user && process.env.NODE_ENV !== "development" && !isLocalRequest) {
      console.error("[ImageAPI] Unauthorized. Session:", session);
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error("[ImageAPI] Missing Bot Token");
      return new NextResponse("Missing Bot Token", { status: 500 });
    }

    const { file_id } = await params;
    console.log(`[ImageAPI] Fetching file_id: ${file_id}`);

    // 1. Get file path from Telegram
    let pathRes;
    let pathData;
    try {
      pathRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${file_id}`);
      pathData = await pathRes.json();
    } catch (fetchErr: any) {
      console.error("[ImageAPI] Network Error connecting to Telegram:", fetchErr.message);
      if (fetchErr.message?.includes('ENOTFOUND')) {
         return new NextResponse("DNS Error: Cannot resolve api.telegram.org. If Telegram is blocked in your region, ensure your Node.js process is routed through a VPN or proxy.", { status: 502 });
      }
      throw fetchErr;
    }
    
    if (!pathData.ok) {
      console.error(`[ImageAPI] Telegram getFile failed:`, pathData);
      return new NextResponse("Failed to get file path from Telegram", { status: 404 });
    }

    // 2. Fetch binary data
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${pathData.result.file_path}`;
    const fileRes = await fetch(fileUrl);
    
    if (!fileRes.ok) {
      console.error(`[ImageAPI] Telegram download failed: ${fileRes.statusText}`);
      throw new Error("Failed to download image from Telegram");
    }

    // 3. Determine Content-Type based on file extension
    const ext = pathData.result.file_path.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === 'webp') contentType = 'image/webp';
    else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'png') contentType = 'image/png';
    else if (ext === 'webm') contentType = 'audio/webm';
    else if (ext === 'mp3') contentType = 'audio/mpeg';
    else if (ext === 'ogg') contentType = 'audio/ogg';
    else if (ext === 'mp4') contentType = 'video/mp4';

    // 4. Stream binary data back to client with appropriate caching (30 days)
    const buffer = await fileRes.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=2592000, immutable'
      },
    });

  } catch (error: any) {
    console.error("[ImageAPI] Unhandled Error:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}
