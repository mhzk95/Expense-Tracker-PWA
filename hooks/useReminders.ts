"use client";

import { useState, useEffect, useCallback } from "react";
import { getDB, ReminderEntity, pushSyncAction } from "@/lib/db/indexeddb";

export function useReminders() {
  const [reminders, setReminders] = useState<ReminderEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    try {
      const db = await getDB();
      const all = await db.getAll("reminders");
      // Filter out deleted items and sort by date
      setReminders(all.filter((r: ReminderEntity) => !r.isDeleted).sort((a: ReminderEntity, b: ReminderEntity) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Failed to fetch reminders", error);
    } finally {
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

  const addReminder = async (item: Omit<ReminderEntity, "createdAt" | "updatedAt" | "isDeleted">) => {
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
  };

  const updateReminder = async (id: string, updates: Partial<ReminderEntity>) => {
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
  };

  const deleteReminder = async (id: string) => {
    await updateReminder(id, { isDeleted: true });
  };

  return {
    reminders,
    loading,
    addReminder,
    updateReminder,
    deleteReminder,
  };
}
