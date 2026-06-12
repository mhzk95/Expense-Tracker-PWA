import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { title, tags, id } = await request.json();

    const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json({ error: "Telegram not configured" }, { status: 400 });
    }

    const message = `🚨 *CRITICAL REMINDER PENDING* 🚨\n\n*Task:* ${title}\n*Tags:* ${tags?.join(', ') || 'None'}\n\nOpen your ExpenseTracker app to resolve this immediately!`;

    const payload: any = {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    };

    if (id) {
      payload.reply_markup = {
        inline_keyboard: [
          [
            { text: "✅ Mark Done", callback_data: `done|${id}` },
            { text: "💤 Snooze 1h", callback_data: `snooze|${id}` }
          ]
        ]
      };
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Telegram API responded with ${res.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Telegram Alert Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
