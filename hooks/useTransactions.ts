"use client";

import { useState, useEffect, useCallback } from "react";
import { TransactionEntity } from "@/lib/db/indexeddb";
import { transactionsRepository } from "@/lib/db/transactionsRepository";

const PAGE_SIZE = 50;

// Memory cache to prevent layout shifts and flickering on component mount
let cachedTransactions: TransactionEntity[] | null = null;
let cachedLoading = true;
let cachedHasMore = true;
let cachedPage = 0;

export function useTransactions() {
  const [transactions, setTransactions] = useState<TransactionEntity[]>(cachedTransactions || []);
  const [loading, setLoading] = useState(cachedTransactions === null);
  const [hasMore, setHasMore] = useState(cachedHasMore);
  const [page, setPage] = useState(cachedPage);

  const fetchPage = async (pageIndex: number) => {
    try {
      const data = await transactionsRepository.getPaginated(PAGE_SIZE, pageIndex * PAGE_SIZE);
      const newHasMore = data.length === PAGE_SIZE;
      cachedHasMore = newHasMore;
      setHasMore(newHasMore);

      const newTransactions = pageIndex === 0 ? data : [...transactions, ...data];
      
      // Prevent unnecessary state updates if the fetched data is identical to what's already in the local state
      const isDifferent = !transactions || 
                          transactions.length !== newTransactions.length || 
                          newTransactions.some((t, i) => 
                            t.id !== transactions[i]?.id || 
                            t.amount !== transactions[i]?.amount || 
                            t.description !== transactions[i]?.description || 
                            t.date !== transactions[i]?.date || 
                            t.categoryId !== transactions[i]?.categoryId ||
                            t.type !== transactions[i]?.type ||
                            t.status !== transactions[i]?.status ||
                            t.needsReview !== transactions[i]?.needsReview
                          );

      if (isDifferent || cachedLoading) {
        cachedTransactions = newTransactions;
        setTransactions(newTransactions);
      }
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    } finally {
      cachedLoading = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(0);
    setPage(0);
    cachedPage = 0;
    
    const handleDbChange = () => { fetchPage(0); setPage(0); cachedPage = 0; };
    window.addEventListener("db:transactions:changed", handleDbChange);
    window.addEventListener("sync:updated", handleDbChange);

    return () => {
      window.removeEventListener("db:transactions:changed", handleDbChange);
      window.removeEventListener("sync:updated", handleDbChange);
    };
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      cachedPage = nextPage;
      fetchPage(nextPage);
    }
  };

  const addTransaction = async (tx: Omit<TransactionEntity, "syncStatus" | "localVersion" | "isDeleted">) => {
    await transactionsRepository.add(tx);
  };

  const updateTransaction = async (id: string, updates: Partial<Omit<TransactionEntity, "id" | "isDeleted">>) => {
    await transactionsRepository.update(id, updates);
  };

  const deleteTransaction = async (id: string) => {
    await transactionsRepository.softDelete(id);
  };

  return {
    transactions,
    loading,
    hasMore,
    loadMore,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
