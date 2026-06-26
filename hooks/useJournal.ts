"use client";

import { useState, useEffect, useCallback } from "react";
import { JournalEntity } from "@/lib/db/indexeddb";
import { journalRepository } from "@/lib/db/journalRepository";

const PAGE_SIZE = 20;

// Memory cache to prevent layout shifts and flickering on component mount
let cachedEntries: JournalEntity[] | null = null;
let cachedLoading = true;
let cachedHasMore = true;
let cachedPage = 0;

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntity[]>(cachedEntries || []);
  const [loading, setLoading] = useState(cachedEntries === null);
  const [hasMore, setHasMore] = useState(cachedHasMore);
  const [page, setPage] = useState(cachedPage);

  const fetchPage = useCallback(async (pageIndex: number) => {
    try {
      const data = await journalRepository.getPaginated(PAGE_SIZE, pageIndex * PAGE_SIZE);
      const newHasMore = data.length === PAGE_SIZE;
      cachedHasMore = newHasMore;
      setHasMore(newHasMore);

      setEntries((prevEntries) => {
        const newEntries = pageIndex === 0 ? data : [...prevEntries, ...data];
        
        // Prevent unnecessary state updates if the fetched data is identical to what's already in the local state
        const isDifferent = !prevEntries || 
                            prevEntries.length !== newEntries.length || 
                            newEntries.some((e, i) => 
                              e.id !== prevEntries[i]?.id || 
                              e.content !== prevEntries[i]?.content || 
                              e.date !== prevEntries[i]?.date ||
                              e.mood !== prevEntries[i]?.mood ||
                              e.title !== prevEntries[i]?.title ||
                              (e.photoUrls && e.photoUrls.join(",")) !== (prevEntries[i]?.photoUrls && prevEntries[i]?.photoUrls.join(","))
                            );

        if (isDifferent || cachedLoading) {
          cachedEntries = newEntries;
          return newEntries;
        }
        return prevEntries;
      });
    } catch (error) {
      console.error("Failed to fetch journal entries", error);
    } finally {
      cachedLoading = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(0);
    setPage(0);
    cachedPage = 0;
    
    const handleDbChange = () => { fetchPage(0); setPage(0); cachedPage = 0; };
    window.addEventListener("db:journal:changed", handleDbChange);
    window.addEventListener("sync:updated", handleDbChange);

    return () => {
      window.removeEventListener("db:journal:changed", handleDbChange);
      window.removeEventListener("sync:updated", handleDbChange);
    };
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      cachedPage = nextPage;
      fetchPage(nextPage);
    }
  }, [loading, hasMore, page, fetchPage]);

  const addEntry = useCallback(async (entry: Omit<JournalEntity, "isDeleted" | "createdAt" | "updatedAt">) => {
    await journalRepository.add(entry);
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    await journalRepository.softDelete(id);
  }, []);

  return {
    entries,
    loading,
    hasMore,
    loadMore,
    addEntry,
    deleteEntry,
  };
}
