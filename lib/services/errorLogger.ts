import { getDB, ErrorLogEntity } from "@/lib/db/indexeddb";

const MAX_LOGS = 100;

export async function logMessage(
  feature: string,
  operation: string,
  level: "info" | "warning" | "error",
  message: string,
  details?: string
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const db = await getDB();
    if (!db) return;

    const logEntry: ErrorLogEntity = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      feature,
      operation,
      level,
      message,
      details,
    };

    // Store in IndexedDB
    await db.put("error_logs", logEntry);

    // Limit to 100 logs
    const allLogs = await db.getAll("error_logs");
    if (allLogs.length > MAX_LOGS) {
      // Sort oldest first
      allLogs.sort((a: ErrorLogEntity, b: ErrorLogEntity) => a.timestamp - b.timestamp);
      const toDeleteCount = allLogs.length - MAX_LOGS;
      const tx = db.transaction("error_logs", "readwrite");
      const store = tx.objectStore("error_logs");
      for (let i = 0; i < toDeleteCount; i++) {
        await store.delete(allLogs[i].id);
      }
      await tx.done;
    }

    // Trigger custom event to notify UI
    window.dispatchEvent(new Event("logs:updated"));
  } catch (err) {
    console.error("Failed to write to error log:", err);
  }
}

export async function getLogs(): Promise<ErrorLogEntity[]> {
  try {
    const db = await getDB();
    if (!db) return [];
    const logs = await db.getAll("error_logs");
    return logs.sort((a: ErrorLogEntity, b: ErrorLogEntity) => b.timestamp - a.timestamp); // newest first
  } catch (err) {
    console.error("Failed to read error logs:", err);
    return [];
  }
}

export async function clearLogs(): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;
    const tx = db.transaction("error_logs", "readwrite");
    await tx.objectStore("error_logs").clear();
    await tx.done;
    window.dispatchEvent(new Event("logs:updated"));
  } catch (err) {
    console.error("Failed to clear error logs:", err);
  }
}
