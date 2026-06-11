import { getDB } from "@/lib/db/indexeddb";

// Use environment variables directly. No UI configuration required anymore.
export const getTelegramToken = () => process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || null;
export const getTelegramChatId = () => process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || null;

export const hasTelegramConnection = () => {
  return !!process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN && !!process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;
};

/**
 * Uploads a file (photo or JSON) to Telegram and returns the file_id
 */
export async function uploadToTelegram(token: string, chatId: string, blob: Blob, filename: string): Promise<string | null> {
  const formData = new FormData();
  formData.append("chat_id", chatId);

  const isPhoto = filename.endsWith(".jpg") || filename.endsWith(".webp") || filename.endsWith(".png");
  const endpoint = isPhoto ? "sendPhoto" : "sendDocument";
  const fieldName = isPhoto ? "photo" : "document";

  const safeFilename = isPhoto ? filename.replace(".webp", ".jpg") : filename;
  formData.append(fieldName, blob, safeFilename);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.ok) {
      const result = data.result;
      return result.document?.file_id || result.sticker?.file_id || result.photo?.[result.photo.length - 1]?.file_id || result.video?.file_id;
    }
    console.error(`Telegram ${endpoint} failed:`, data);
    return null;
  } catch (error) {
    console.error("Error uploading to telegram:", error);
    return null;
  }
}

/**
 * Fetches a file as a Base64 string from a Telegram file_id
 */
export async function downloadFromTelegram(token: string, fileId: string): Promise<Blob | null> {
  try {
    const pathRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const pathData = await pathRes.json();
    if (!pathData.ok) return null;

    const originalUrl = `https://api.telegram.org/file/bot${token}/${pathData.result.file_path}`;
    const fileUrl = `/api/telegram-proxy?url=${encodeURIComponent(originalUrl)}`;
    const fileRes = await fetch(fileUrl);
    return await fileRes.blob();
  } catch (error) {
    console.error("Error downloading from telegram:", error);
    return null;
  }
}
