"use client";

import { useState, useEffect, useCallback } from "react";
import { getDB, ReminderEntity, pushSyncAction } from "@/lib/db/indexeddb";

// Memory cache to prevent layout shifts and flickering on component mount
let cachedReminders: ReminderEntity[] | null = null;
let cachedLoading = true;

export function useReminders() {
  const [reminders, setReminders] = useState<ReminderEntity[]>(cachedReminders || []);
  const [loading, setLoading] = useState(cachedReminders === null);

  const fetchReminders = useCallback(async () => {
    try {
      const db = await getDB();
      const all = await db.getAll("reminders");
      // Filter out deleted items and sort by date
      const filtered = all.filter((r: ReminderEntity) => !r.isDeleted).sort((a: ReminderEntity, b: ReminderEntity) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Prevent unnecessary state updates if the fetched data is identical to what's already cached
      const isDifferent = !cachedReminders || 
                          cachedReminders.length !== filtered.length || 
                          filtered.some((r: ReminderEntity, i: number) => 
                            r.id !== cachedReminders![i]?.id || 
                            r.title !== cachedReminders![i]?.title || 
                            r.status !== cachedReminders![i]?.status ||
                            r.priority !== cachedReminders![i]?.priority ||
                            r.dueDate !== cachedReminders![i]?.dueDate ||
                            r.notes !== cachedReminders![i]?.notes
                          );

      if (isDifferent || cachedLoading) {
        cachedReminders = filtered;
        setReminders(filtered);
      }
    } catch (error) {
      console.error("Failed to fetch reminders", error);
    } finally {
      cachedLoading = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
    window.addEventListener("db:reminders:changed", fetchReminders);
    window.addEventListener("sync:updated", fetchReminders);
    return () => {
      window.removeEventListener("db:reminders:changed", fetchReminders);
      window.removeEventListener("sync:updated", fetchReminders);
    };
  }, [fetchReminders]);

  const addReminder = useCallback(async (item: Omit<ReminderEntity, "createdAt" | "updatedAt" | "isDeleted">) => {
    const db = await getDB();
    const now = new Date().toISOString();
    const newItem: ReminderEntity = {
      ...item,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
    await db.put("reminders", newItem);
    await pushSyncAction("REMINDER", "CREATE", newItem);
    fetchReminders();
    window.dispatchEvent(new CustomEvent("db:reminders:changed"));
  }, [fetchReminders]);

  const updateReminder = useCallback(async (id: string, updates: Partial<ReminderEntity>) => {
    const db = await getDB();
    const existing = await db.get("reminders", id);
    if (!existing) return;
    
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await db.put("reminders", updated);
    await pushSyncAction("REMINDER", "UPDATE", updated);
    fetchReminders();
    window.dispatchEvent(new CustomEvent("db:reminders:changed"));
  }, [fetchReminders]);

  const deleteReminder = useCallback(async (id: string) => {
    await updateReminder(id, { isDeleted: true });
  }, [updateReminder]);

  return {
    reminders,
    loading,
    addReminder,
    updateReminder,
    deleteReminder,
  };
}
