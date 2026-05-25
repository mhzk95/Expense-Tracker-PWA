"use client";

import { useState, useEffect, useCallback } from "react";
import { JournalEntity } from "@/lib/db/indexeddb";
import { journalRepository } from "@/lib/db/journalRepository";

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      const data = await journalRepository.getAll();
      setEntries(data);
    } catch (error) {
      console.error("Failed to fetch journal entries", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    
    const handleDbChange = () => fetchEntries();
    window.addEventListener("db:journal:changed", handleDbChange);
    window.addEventListener("sync:updated", handleDbChange); // for Dropbox restore

    return () => {
      window.removeEventListener("db:journal:changed", handleDbChange);
      window.removeEventListener("sync:updated", handleDbChange);
    };
  }, [fetchEntries]);

  const addEntry = async (entry: Omit<JournalEntity, "isDeleted" | "createdAt" | "updatedAt">) => {
    await journalRepository.add(entry);
  };

  const deleteEntry = async (id: string) => {
    await journalRepository.softDelete(id);
  };

  return {
    entries,
    loading,
    addEntry,
    deleteEntry,
  };
}
