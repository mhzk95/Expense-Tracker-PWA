import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const update = await request.json();

    // Answer callback query
    if (update.callback_query) {
      const callbackQueryId = update.callback_query.id;
      const data = update.callback_query.data;
      const chatId = update.callback_query.message.chat.id;
      const messageId = update.callback_query.message.message_id;
      const messageText = update.callback_query.message.text;
      const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;

      const [action, id] = data.split('|');

      if (action === 'done' && id) {
        // Update in Prisma
        await prisma.reminder.update({
          where: { id },
          data: { status: 'completed', updatedAt: new Date() }
        });

        // Notify telegram client
        await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
           method: "POST", body: JSON.stringify({ callback_query_id: callbackQueryId, text: "Task marked as completed!" }), headers: {'Content-Type': 'application/json'}
        });
        // Edit original message to remove buttons
        await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
           method: "POST", body: JSON.stringify({ chat_id: chatId, message_id: messageId, text: `✅ *Task Completed:* \n\n${messageText}`, parse_mode: 'Markdown' }), headers: {'Content-Type': 'application/json'}
        });
      } else if (action === 'snooze' && id) {
        const newDate = new Date();
        newDate.setHours(newDate.getHours() + 1);
        await prisma.reminder.update({
          where: { id },
          data: { dueDate: newDate, updatedAt: new Date() }
        });
        
        await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
           method: "POST", body: JSON.stringify({ callback_query_id: callbackQueryId, text: "Snoozed for 1 hour." }), headers: {'Content-Type': 'application/json'}
        });
        await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
           method: "POST", body: JSON.stringify({ chat_id: chatId, message_id: messageId, text: `💤 *Task Snoozed (1h):* \n\n${messageText}`, parse_mode: 'Markdown' }), headers: {'Content-Type': 'application/json'}
        });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: "failed", details: err.message }, { status: 500 });
  }
}
