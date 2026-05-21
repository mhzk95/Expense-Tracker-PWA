import { getDB } from "@/lib/db/indexeddb";

const DROPBOX_UPLOAD_URL = "https://content.dropboxapi.com/2/files/upload";
const DROPBOX_DOWNLOAD_URL = "https://content.dropboxapi.com/2/files/download";

export const getDropboxToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dropbox_sync_token");
};

export const setDropboxToken = (token: string) => {
  localStorage.setItem("dropbox_sync_token", token);
};

export const removeDropboxToken = () => {
  localStorage.removeItem("dropbox_sync_token");
};

/**
 * Gathers all local data and uploads it to Dropbox as backup.json
 */
export async function uploadBackupToDropbox(): Promise<boolean> {
  const token = getDropboxToken();
  if (!token) return false;

  try {
    const db = await getDB();
    const transactions = await db.getAll("transactions");
    const accounts = await db.getAll("accounts");

    const backupData = {
      version: 1,
      timestamp: new Date().toISOString(),
      data: {
        transactions,
        accounts,
      },
    };

    const fileContent = JSON.stringify(backupData, null, 2);

    const response = await fetch(DROPBOX_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Dropbox-API-Arg": JSON.stringify({
          path: "/expense_tracker_backup.json",
          mode: "overwrite",
          autorename: false,
          mute: true,
        }),
        "Content-Type": "application/octet-stream",
      },
      body: fileContent,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Dropbox upload failed:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error uploading backup:", error);
    return false;
  }
}

/**
 * Downloads backup.json from Dropbox and repopulates the local DB
 */
export async function restoreBackupFromDropbox(): Promise<boolean> {
  const token = getDropboxToken();
  if (!token) return false;

  try {
    const response = await fetch(DROPBOX_DOWNLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Dropbox-API-Arg": JSON.stringify({
          path: "/expense_tracker_backup.json",
        }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Dropbox download failed:", error);
      return false;
    }

    const backupData = await response.json();
    
    if (!backupData || !backupData.data) {
      throw new Error("Invalid backup format");
    }

    const db = await getDB();
    const tx = db.transaction(["transactions", "accounts"], "readwrite");
    
    // Clear existing
    await tx.objectStore("transactions").clear();
    await tx.objectStore("accounts").clear();

    // Insert backup
    const tStore = tx.objectStore("transactions");
    for (const item of backupData.data.transactions || []) {
      await tStore.put(item);
    }

    const aStore = tx.objectStore("accounts");
    for (const item of backupData.data.accounts || []) {
      await aStore.put(item);
    }

    await tx.done;

    // Trigger UI refresh
    window.dispatchEvent(new Event("db:transactions:changed"));
    window.dispatchEvent(new Event("db:accounts:changed"));
    
    return true;
  } catch (error) {
    console.error("Error restoring backup:", error);
    return false;
  }
}
