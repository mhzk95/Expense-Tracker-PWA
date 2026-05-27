import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file_id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return new NextResponse("Missing Bot Token", { status: 500 });
    }

    const { file_id } = await params;

    // 1. Get file path from Telegram
    const pathRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${file_id}`);
    const pathData = await pathRes.json();
    
    if (!pathData.ok) {
      return new NextResponse("Failed to get file path from Telegram", { status: 404 });
    }

    // 2. Fetch binary data
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${pathData.result.file_path}`;
    const fileRes = await fetch(fileUrl);
    
    if (!fileRes.ok) throw new Error("Failed to download image from Telegram");

    // 3. Stream binary data back to client with appropriate caching (30 days)
    const buffer = await fileRes.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=2592000, immutable'
      },
    });

  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
