import { getDB } from "@/lib/db/indexeddb";

const DROPBOX_UPLOAD_URL = "https://content.dropboxapi.com/2/files/upload";
const DROPBOX_DOWNLOAD_URL = "https://content.dropboxapi.com/2/files/download";
const DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";
const DROPBOX_AUTH_URL = "https://www.dropbox.com/oauth2/authorize";

// Generate PKCE Challenge
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
}

async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const base64Url = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return base64Url;
}

export const getDropboxClientId = () => typeof window !== "undefined" ? localStorage.getItem("dropbox_client_id") : null;
export const setDropboxClientId = (id: string) => localStorage.setItem("dropbox_client_id", id);
export const removeDropboxAuth = () => {
  localStorage.removeItem("dropbox_client_id");
  localStorage.removeItem("dropbox_refresh_token");
  localStorage.removeItem("dropbox_access_token");
  localStorage.removeItem("dropbox_token_expires_at");
};

export const hasDropboxConnection = () => {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("dropbox_refresh_token");
};

export async function initiateDropboxLogin(clientId: string, redirectUri: string) {
  setDropboxClientId(clientId);
  const verifier = generateCodeVerifier();
  localStorage.setItem("dropbox_code_verifier", verifier);
  const challenge = await generateCodeChallenge(verifier);
  
  const authUrl = new URL(DROPBOX_AUTH_URL);
  authUrl.searchParams.append("client_id", clientId);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("token_access_type", "offline");
  authUrl.searchParams.append("code_challenge_method", "S256");
  authUrl.searchParams.append("code_challenge", challenge);
  authUrl.searchParams.append("redirect_uri", redirectUri);
  
  window.location.href = authUrl.toString();
}

export async function handleDropboxRedirect(code: string, redirectUri: string): Promise<boolean> {
  const clientId = getDropboxClientId();
  const verifier = localStorage.getItem("dropbox_code_verifier");
  if (!clientId || !verifier) return false;

  try {
    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("code_verifier", verifier);
    params.append("redirect_uri", redirectUri);

    const res = await fetch(DROPBOX_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    if (!res.ok) {
      const errTxt = await res.text();
      console.error("Token exchange failed:", errTxt);
      throw new Error("Failed to exchange code");
    }
    const data = await res.json();
    
    if (data.refresh_token) {
      localStorage.setItem("dropbox_refresh_token", data.refresh_token);
    }
    localStorage.setItem("dropbox_access_token", data.access_token);
    localStorage.setItem("dropbox_token_expires_at", (Date.now() + (data.expires_in * 1000)).toString());
    localStorage.removeItem("dropbox_code_verifier");
    
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const accessToken = localStorage.getItem("dropbox_access_token");
  const expiresAt = localStorage.getItem("dropbox_token_expires_at");
  const refreshToken = localStorage.getItem("dropbox_refresh_token");
  const clientId = getDropboxClientId();

  if (!refreshToken || !clientId) return null;

  // If token is valid for at least 5 more minutes
  if (accessToken && expiresAt && Date.now() + 300000 < parseInt(expiresAt, 10)) {
    return accessToken;
  }

  // Need to refresh
  try {
    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);

    const res = await fetch(DROPBOX_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    if (!res.ok) throw new Error("Failed to refresh token");
    const data = await res.json();
    
    localStorage.setItem("dropbox_access_token", data.access_token);
    localStorage.setItem("dropbox_token_expires_at", (Date.now() + (data.expires_in * 1000)).toString());
    
    return data.access_token;
  } catch (error) {
    console.error("Refresh token error:", error);
    return null;
  }
}

const getBackupPath = () => process.env.NODE_ENV === "development" 
  ? "/expense_tracker_backup_dev.json" 
  : "/expense_tracker_backup.json";

const getPhotosDir = () => process.env.NODE_ENV === "development"
  ? "/photos_dev"
  : "/photos";

/**
 * Gathers all local data and uploads it to Dropbox as backup.json
 */
export async function uploadBackupToDropbox(): Promise<boolean> {
  const token = await getValidAccessToken();
  if (!token) return false;

  try {
    const db = await getDB();
    const allTransactions = await db.getAll("transactions");
    const allAccounts = await db.getAll("accounts");
    const allCategories = await db.getAll("categories");
    const allJournalEntries = await db.getAll("journalEntries");
    const allVaultEntries = await db.getAll("vaultEntries");

    const uploadedCache = JSON.parse(localStorage.getItem("et_uploaded_photos") || "[]");
    const newUploaded = [...uploadedCache];
    const photosDir = getPhotosDir();
    const backupJournalEntries = JSON.parse(JSON.stringify(allJournalEntries.filter((j: any) => !j.isDeleted)));

    for (const entry of backupJournalEntries) {
      for (let i = 0; i < entry.photoUrls.length; i++) {
        const url = entry.photoUrls[i];
        if (url.startsWith("data:image")) {
          const photoId = `${entry.id}_${i}`;
          const photoPath = `${photosDir}/${photoId}.webp`;
          
          if (!uploadedCache.includes(photoId)) {
            const blob = await fetch(url).then(res => res.blob());
            const uploadRes = await fetch(DROPBOX_UPLOAD_URL, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Dropbox-API-Arg": JSON.stringify({
                  path: photoPath,
                  mode: "overwrite",
                  autorename: false,
                  mute: true,
                }),
                "Content-Type": "application/octet-stream",
              },
              body: blob,
            });
            
            if (uploadRes.ok) {
              if (!newUploaded.includes(photoId)) newUploaded.push(photoId);
            } else {
              console.error("Failed to upload photo", photoId);
            }
          }
          entry.photoUrls[i] = photoPath;
        }
      }
    }

    localStorage.setItem("et_uploaded_photos", JSON.stringify(newUploaded));

    const backupData = {
      version: 4,
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

    const response = await fetch(DROPBOX_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Dropbox-API-Arg": JSON.stringify({
          path: getBackupPath(),
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
  const token = await getValidAccessToken();
  if (!token) return false;

  try {
    const response = await fetch(DROPBOX_DOWNLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Dropbox-API-Arg": JSON.stringify({
          path: getBackupPath(),
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

    const photosDir = getPhotosDir();
    const uploadedCache = JSON.parse(localStorage.getItem("et_uploaded_photos") || "[]");
    const newUploaded = [...uploadedCache];
    const backupJournalEntries = backupData.data.journalEntries || [];

    for (const entry of backupJournalEntries) {
      for (let i = 0; i < entry.photoUrls.length; i++) {
        const url = entry.photoUrls[i];
        if (url.startsWith(photosDir)) {
          const downloadRes = await fetch(DROPBOX_DOWNLOAD_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Dropbox-API-Arg": JSON.stringify({ path: url }),
            },
          });
          
          if (downloadRes.ok) {
            const blob = await downloadRes.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            entry.photoUrls[i] = base64;
            
            const photoId = url.split('/').pop()?.replace('.webp', '');
            if (photoId && !newUploaded.includes(photoId)) newUploaded.push(photoId);
          }
        }
      }
    }
    localStorage.setItem("et_uploaded_photos", JSON.stringify(newUploaded));

    const db = await getDB();
    const tx = db.transaction(["transactions", "accounts", "categories", "journalEntries", "vaultEntries"], "readwrite");
    
    // Clear existing
    await tx.objectStore("transactions").clear();
    await tx.objectStore("accounts").clear();
    await tx.objectStore("categories").clear();
    await tx.objectStore("journalEntries").clear();
    await tx.objectStore("vaultEntries").clear();

    // Insert backup
    const tStore = tx.objectStore("transactions");
    for (const item of backupData.data.transactions || []) {
      await tStore.put(item);
    }

    const aStore = tx.objectStore("accounts");
    for (const item of backupData.data.accounts || []) {
      await aStore.put(item);
    }

    const cStore = tx.objectStore("categories");
    for (const item of backupData.data.categories || []) {
      await cStore.put(item);
    }

    const jStore = tx.objectStore("journalEntries");
    for (const item of backupJournalEntries) {
      await jStore.put(item);
    }

    const vStore = tx.objectStore("vaultEntries");
    for (const item of backupData.data.vaultEntries || []) {
      await vStore.put(item);
    }

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
