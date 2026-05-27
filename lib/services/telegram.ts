import { getDB } from "@/lib/db/indexeddb";

export const getTelegramToken = () => process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || null;
export const getTelegramChatId = () => typeof window !== "undefined" ? localStorage.getItem("telegram_chat_id") : null;
export const getTelegramMessageId = () => typeof window !== "undefined" ? localStorage.getItem("telegram_message_id") : null;

export const setTelegramAuth = (chatId: string, messageId: string) => {
  localStorage.setItem("telegram_chat_id", chatId.trim());
  if (messageId) {
    localStorage.setItem("telegram_message_id", messageId.trim());
  }
};

export const removeTelegramAuth = () => {
  localStorage.removeItem("telegram_chat_id");
  localStorage.removeItem("telegram_message_id");
  localStorage.removeItem("et_uploaded_photos");
};

export const hasTelegramConnection = () => {
  if (typeof window === "undefined") return false;
  return !!process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN && !!localStorage.getItem("telegram_chat_id");
};

export const getAutoBackupSettings = () => {
  if (typeof window === "undefined") return { enabled: false, time: "23:00" };
  return {
    enabled: localStorage.getItem("telegram_auto_backup_enabled") === "true",
    time: localStorage.getItem("telegram_auto_backup_time") || "23:00",
  };
};

export const setAutoBackupSettings = (enabled: boolean, time: string) => {
  localStorage.setItem("telegram_auto_backup_enabled", String(enabled));
  localStorage.setItem("telegram_auto_backup_time", time);
};

export const getLastBackupTime = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("telegram_last_backup_time");
};

export const setLastBackupTime = (time: string) => {
  localStorage.setItem("telegram_last_backup_time", time);
};

/**
 * Uploads a file (photo or JSON) to Telegram and returns the file_id
 */
async function uploadToTelegram(token: string, chatId: string, blob: Blob, filename: string): Promise<string | null> {
  const formData = new FormData();
  formData.append("chat_id", chatId);
  
  // If the file is a photo, use sendPhoto so it appears as an image, not a sticker
  const isPhoto = filename.endsWith(".jpg") || filename.endsWith(".webp") || filename.endsWith(".png");
  const endpoint = isPhoto ? "sendPhoto" : "sendDocument";
  const fieldName = isPhoto ? "photo" : "document";
  
  // Telegram strictly enforces .webp as stickers in sendDocument. 
  // By sending it via sendPhoto (and renaming the extension to .jpg just to be safe), 
  // Telegram processes it as a beautiful standard image gallery item!
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
async function downloadFromTelegram(token: string, fileId: string): Promise<string | null> {
  try {
    // 1. Get file path
    const pathRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const pathData = await pathRes.json();
    if (!pathData.ok) return null;
    
    // 2. Download actual file (Telegram's /file/ endpoint lacks CORS headers, so we use our local proxy)
    const originalUrl = `https://api.telegram.org/file/bot${token}/${pathData.result.file_path}`;
    const fileUrl = `/api/telegram-proxy?url=${encodeURIComponent(originalUrl)}`;
    const fileRes = await fetch(fileUrl);
    const blob = await fileRes.blob();
    
    // 3. Convert to base64
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error downloading from telegram:", error);
    return null;
  }
}

/**
 * Gathers all local data and uploads it to Telegram
 */
export async function uploadBackupToTelegram(): Promise<{ success: boolean; error?: string }> {
  const token = getTelegramToken();
  const chatId = getTelegramChatId();
  if (!token || !chatId) return { success: false, error: "Missing token or Chat ID" };

  try {
    const db = await getDB();
    const allTransactions = await db.getAll("transactions");
    const allAccounts = await db.getAll("accounts");
    const allCategories = await db.getAll("categories");
    const allJournalEntries = await db.getAll("journalEntries");
    const allVaultEntries = await db.getAll("vaultEntries");

    const uploadedCache = JSON.parse(localStorage.getItem("et_uploaded_photos") || "[]");
    const newUploaded = [...uploadedCache];
    const backupJournalEntries = JSON.parse(JSON.stringify(allJournalEntries.filter((j: any) => !j.isDeleted)));

    // Upload new photos to Telegram
    for (const entry of backupJournalEntries) {
      for (let i = 0; i < entry.photoUrls.length; i++) {
        const url = entry.photoUrls[i];
        if (url.startsWith("data:image")) {
          const photoId = `${entry.id}_${i}`;
          
          if (!uploadedCache.includes(photoId)) {
            const blob = await fetch(url).then(res => res.blob());
            const file_id = await uploadToTelegram(token, chatId, blob, `${photoId}.webp`);
            
            if (file_id) {
              entry.photoUrls[i] = `telegram:${file_id}`;
              if (!newUploaded.includes(photoId)) newUploaded.push(photoId);
            } else {
              throw new Error(`Failed to upload photo for entry ${entry.id}`);
            }
          }
        }
      }
    }

    localStorage.setItem("et_uploaded_photos", JSON.stringify(newUploaded));

    // Construct backup JSON
    const backupData = {
      version: 5,
      timestamp: new Date().toISOString(),
      data: {
        transactions: allTransactions.filter((t: any) => !t.isDeleted),
        accounts: allAccounts.filter((a: any) => !a.isDeleted),
        categories: allCategories.filter((c: any) => !c.isDeleted),
        journalEntries: backupJournalEntries,
        vaultEntries: allVaultEntries.filter((v: any) => !v.isDeleted),
      },
    };

    const fileContent = JSON.stringify(backupData, null, 2);
    const backupBlob = new Blob([fileContent], { type: "application/json" });
    const messageId = getTelegramMessageId();

    if (messageId) {
      // Edit existing message
      const formData = new FormData();
      formData.append("chat_id", chatId);
      formData.append("message_id", messageId);
      formData.append("media", JSON.stringify({ type: "document", media: "attach://backup" }));
      formData.append("backup", backupBlob, "backup.json");

      const res = await fetch(`https://api.telegram.org/bot${token}/editMessageMedia`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.ok) {
        if (data.description?.includes("message to edit not found")) {
          // If message was deleted, fallback to creating a new one instead of failing
          localStorage.removeItem("telegram_message_id");
          return await uploadBackupToTelegram(); 
        }
        throw new Error(data.description || "Failed to edit backup message");
      }
    } else {
      // Create new message and save message_id
      const formData = new FormData();
      formData.append("chat_id", chatId);
      formData.append("document", backupBlob, "backup.json");

      const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.description || "Failed to send backup message");
      
      localStorage.setItem("telegram_message_id", data.result.message_id.toString());
    }

    setLastBackupTime(new Date().toISOString());
    return { success: true };
  } catch (error: any) {
    console.error("Error uploading backup:", error);
    return { success: false, error: error.message || "Unknown error occurred" };
  }
}

/**
 * Downloads backup.json from Telegram and repopulates the local DB
 * Uses the getUpdates trick: User forwards the backup message to the bot.
 */
export async function restoreBackupFromTelegram(): Promise<boolean> {
  const token = getTelegramToken();
  if (!token) return false;

  try {
    // 1. Fetch recent messages sent to the bot (the user should have forwarded the backup message)
    const updatesRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=10`);
    const updatesData = await updatesRes.json();
    if (!updatesData.ok || !updatesData.result.length) {
      alert("No recent messages found. Please forward the backup file to the bot in Telegram first!");
      return false;
    }

    // 2. Find the most recent document
    const updates = updatesData.result.reverse();
    let fileId = null;
    for (const update of updates) {
      const msg = update.message || update.edited_message || update.channel_post;
      if (msg?.document?.file_id) {
        fileId = msg.document.file_id;
        break;
      }
    }

    if (!fileId) {
      alert("Could not find a backup.json in the bot's recent messages. Please forward it again.");
      return false;
    }

    // 3. Download the JSON file
    const pathRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const pathData = await pathRes.json();
    if (!pathData.ok) throw new Error("Failed to get file path");

    const originalUrl = `https://api.telegram.org/file/bot${token}/${pathData.result.file_path}`;
    const fileUrl = `/api/telegram-proxy?url=${encodeURIComponent(originalUrl)}`;
    const fileRes = await fetch(fileUrl);
    const backupData = await fileRes.json();

    if (!backupData || !backupData.data) {
      throw new Error("Invalid backup format");
    }

    // 4. Download Photos
    const backupJournalEntries = backupData.data.journalEntries || [];
    const uploadedCache = JSON.parse(localStorage.getItem("et_uploaded_photos") || "[]");
    const newUploaded = [...uploadedCache];

    for (const entry of backupJournalEntries) {
      for (let i = 0; i < entry.photoUrls.length; i++) {
        const url = entry.photoUrls[i];
        if (url.startsWith("telegram:")) {
          const photoFileId = url.replace("telegram:", "");
          const base64 = await downloadFromTelegram(token, photoFileId);
          if (base64) {
            entry.photoUrls[i] = base64;
            const photoId = `${entry.id}_${i}`;
            if (!newUploaded.includes(photoId)) newUploaded.push(photoId);
          }
        }
      }
    }
    
    localStorage.setItem("et_uploaded_photos", JSON.stringify(newUploaded));

    // 5. Restore Database
    const db = await getDB();
    const tx = db.transaction(["transactions", "accounts", "categories", "journalEntries", "vaultEntries"], "readwrite");
    
    await tx.objectStore("transactions").clear();
    await tx.objectStore("accounts").clear();
    await tx.objectStore("categories").clear();
    await tx.objectStore("journalEntries").clear();
    await tx.objectStore("vaultEntries").clear();

    const tStore = tx.objectStore("transactions");
    for (const item of backupData.data.transactions || []) await tStore.put(item);

    const aStore = tx.objectStore("accounts");
    for (const item of backupData.data.accounts || []) await aStore.put(item);

    const cStore = tx.objectStore("categories");
    for (const item of backupData.data.categories || []) await cStore.put(item);

    const jStore = tx.objectStore("journalEntries");
    for (const item of backupJournalEntries) await jStore.put(item);

    const vStore = tx.objectStore("vaultEntries");
    for (const item of backupData.data.vaultEntries || []) await vStore.put(item);

    await tx.done;

    // Trigger UI refresh
    window.dispatchEvent(new Event("db:transactions:changed"));
    window.dispatchEvent(new Event("db:accounts:changed"));
    window.dispatchEvent(new Event("db:categories:changed"));
    window.dispatchEvent(new Event("db:journal:changed"));
    window.dispatchEvent(new Event("db:vault:changed"));
    
    return true;
  } catch (error) {
    console.error("Error restoring backup:", error);
    return false;
  }
}
