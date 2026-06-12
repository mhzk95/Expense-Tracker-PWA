"use client";

import { useEffect } from "react";
import { useReminders } from "@/hooks/useReminders";

export function useLocalPushScheduler() {
  const { reminders, updateReminder } = useReminders();

  // 1. Scheduler Logic
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;

    const checkDueReminders = () => {
      const now = new Date();
      reminders.forEach((reminder) => {
        if (reminder.status !== "pending" || !reminder.dueDate) return;

        const dueDate = new Date(reminder.dueDate);
        const diffMs = dueDate.getTime() - now.getTime();

        // If it's exactly due (between -30s and +30s of now)
        if (diffMs > -30000 && diffMs <= 30000) {
          const notifiedKey = `notified_${reminder.id}`;
          if (sessionStorage.getItem(notifiedKey)) return;
          sessionStorage.setItem(notifiedKey, "true");

          if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
              const options: any = {
                body: reminder.notes ? "You have notes for this task." : "It's time to get this done.",
                icon: "/icon-192x192.png",
                badge: "/icon-192x192.png",
                vibrate: [200, 100, 200],
                data: { url: "/reminders", id: reminder.id },
                actions: [
                  { action: "done", title: "Mark Done" },
                  { action: "snooze", title: "Snooze 1h" },
                ],
              };
              reg.showNotification(`Due: ${reminder.title}`, options);
            });
          }
        }
      });
    };

    checkDueReminders();
    const interval = setInterval(checkDueReminders, 60000);
    return () => clearInterval(interval);
  }, [reminders]);

  // 2. Listen for Actions from Service Worker
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "NOTIFICATION_ACTION") {
        const { action, data } = event.data;
        if (data && data.id) {
          if (action === "done") {
            updateReminder(data.id, { status: "completed" });
          } else if (action === "snooze") {
            const newDate = new Date();
            newDate.setHours(newDate.getHours() + 1);
            updateReminder(data.id, { dueDate: newDate.toISOString() });
          }
        }
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [updateReminder]);
}
