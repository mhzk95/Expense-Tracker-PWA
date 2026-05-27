"use client";

import { useState, useEffect, useCallback } from "react";
import { JournalEntity } from "@/lib/db/indexeddb";
import { journalRepository } from "@/lib/db/journalRepository";

const PAGE_SIZE = 20;

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchPage = async (pageIndex: number) => {
    try {
      const data = await journalRepository.getPaginated(PAGE_SIZE, pageIndex * PAGE_SIZE);
      setHasMore(data.length === PAGE_SIZE);
      setEntries(prev => pageIndex === 0 ? data : [...prev, ...data]);
    } catch (error) {
      console.error("Failed to fetch journal entries", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(0);
    setPage(0);
    
    const handleDbChange = () => { fetchPage(0); setPage(0); };
    window.addEventListener("db:journal:changed", handleDbChange);
    window.addEventListener("sync:updated", handleDbChange);

    return () => {
      window.removeEventListener("db:journal:changed", handleDbChange);
      window.removeEventListener("sync:updated", handleDbChange);
    };
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPage(nextPage);
    }
  };

  const addEntry = async (entry: Omit<JournalEntity, "isDeleted" | "createdAt" | "updatedAt">) => {
    await journalRepository.add(entry);
  };

  const deleteEntry = async (id: string) => {
    await journalRepository.softDelete(id);
  };

  return {
    entries,
    loading,
    hasMore,
    loadMore,
    addEntry,
    deleteEntry,
  };
}
