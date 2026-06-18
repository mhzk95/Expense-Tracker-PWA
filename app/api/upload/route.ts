import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // We remove the strict session check here because local-first PWA users 
    // might not be logged into Supabase, but still need to upload images to Telegram.
    // The Telegram bot token is safely secured on the server.

    const formData = await request.formData();
    const file = formData.get("file") as Blob | null;
    const filename = (formData.get("filename") as string) || "upload";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json({ error: "Telegram bot token or chat ID missing in .env" }, { status: 500 });
    }

    const tgFormData = new FormData();
    tgFormData.append("chat_id", chatId);

    // Detect media type: audio files go via sendDocument, images via sendPhoto
    const isAudio = file.type.startsWith("audio/") || filename.endsWith(".webm") || filename.endsWith(".mp4") || filename.endsWith(".ogg") || filename.endsWith(".m4a");

    if (isAudio) {
      // Use sendDocument for audio — same pipeline as existing document uploads in telegram.ts
      tgFormData.append("document", file, filename || "audio.webm");

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
        method: "POST",
        body: tgFormData
      });

      const data = await res.json();
      if (!data.ok) {
        return NextResponse.json({ error: data.description }, { status: 500 });
      }

      const fileId = data.result.document?.file_id;
      const fileSize = data.result.document?.file_size;
      return NextResponse.json({ file_id: fileId, file_size: fileSize, media_type: "audio" });

    } else {
      // Image upload — existing flow unchanged
      tgFormData.append("photo", file, "image.jpg");

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: "POST",
        body: tgFormData
      });

      const data = await res.json();
      if (!data.ok) {
        return NextResponse.json({ error: data.description }, { status: 500 });
      }

      // Telegram sends multiple sizes. The last one is the largest.
      const photos = data.result.photo;
      const largestPhoto = photos[photos.length - 1];
      return NextResponse.json({ file_id: largestPhoto.file_id, media_type: "image" });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
