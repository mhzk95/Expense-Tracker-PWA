"use client";

import { useEffect } from "react";
import { 
  getAutoBackupSettings, 
  getLastBackupTime, 
  uploadBackupToTelegram, 
  hasTelegramConnection 
} from "@/lib/services/telegram";

export function AutoBackupManager() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkAndRunBackup = async () => {
      if (!hasTelegramConnection()) return;

      const { enabled, time } = getAutoBackupSettings();
      if (!enabled) return;

      const lastBackupIso = getLastBackupTime();
      const now = new Date();
      
      // If we backed up today already, skip
      if (lastBackupIso) {
        const lastBackupDate = new Date(lastBackupIso);
        if (lastBackupDate.toDateString() === now.toDateString()) {
          return;
        }
      }

      // Check if current time is past the scheduled time
      const [scheduledHour, scheduledMinute] = time.split(":").map(Number);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      if (
        currentHour > scheduledHour || 
        (currentHour === scheduledHour && currentMinute >= scheduledMinute)
      ) {
        // Run backup
        console.log("Triggering scheduled Telegram auto-backup...");
        await uploadBackupToTelegram();
      }
    };

    // Check on mount
    checkAndRunBackup();

    // Check every minute
    const interval = setInterval(checkAndRunBackup, 60000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
