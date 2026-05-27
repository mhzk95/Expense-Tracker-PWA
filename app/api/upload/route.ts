import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as Blob | null;
    const chatId = formData.get("chat_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;

    if (!botToken || !chatId) {
       return NextResponse.json({ error: "Telegram bot token or chat ID missing" }, { status: 500 });
    }

    const tgFormData = new FormData();
    tgFormData.append("chat_id", chatId);
    
    // Pass generic filename so telegram accepts it as an image
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

    return NextResponse.json({ file_id: largestPhoto.file_id });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
