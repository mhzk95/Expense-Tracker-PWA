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

function areTransactionsIdentical(a?: TransactionEntity, b?: TransactionEntity): boolean {
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.amount === b.amount &&
    a.type === b.type &&
    a.currency === b.currency &&
    a.date === b.date &&
    a.description === b.description &&
    (a.note || "") === (b.note || "") &&
    (a.categoryId || "") === (b.categoryId || "") &&
    (a.accountId || "") === (b.accountId || "") &&
    (a.toAccountId || "") === (b.toAccountId || "") &&
    (a.status || "") === (b.status || "") &&
    Boolean(a.needsReview) === Boolean(b.needsReview) &&
    (a.payee || "") === (b.payee || "") &&
    (a.location || "") === (b.location || "") &&
    Boolean(a.isDeleted) === Boolean(b.isDeleted)
  );
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<TransactionEntity[]>(cachedTransactions || []);
  const [loading, setLoading] = useState(cachedTransactions === null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(cachedHasMore);
  const [page, setPage] = useState(cachedPage);

  const fetchPage = useCallback(async (pageIndex: number) => {
    try {
      if (pageIndex > 0) {
        setLoadingMore(true);
      }
      const data = await transactionsRepository.getPaginated(PAGE_SIZE, pageIndex * PAGE_SIZE);
      const newHasMore = data.length === PAGE_SIZE;
      cachedHasMore = newHasMore;
      setHasMore(newHasMore);

      setTransactions((prevTransactions) => {
        let newTransactions: TransactionEntity[];

        if (pageIndex === 0) {
          newTransactions = data;
          // Check if data is truly identical to prevent unnecessary re-renders
          if (
            prevTransactions &&
            prevTransactions.length === newTransactions.length &&
            newTransactions.every((t, i) => areTransactionsIdentical(t, prevTransactions[i])) &&
            !cachedLoading
          ) {
            return prevTransactions;
          }
        } else {
          const map = new Map<string, TransactionEntity>();
          (prevTransactions || []).forEach(t => map.set(t.id, t));
          data.forEach(t => map.set(t.id, t));
          newTransactions = Array.from(map.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        }

        cachedTransactions = newTransactions;
        return newTransactions;
      });
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    } finally {
      cachedLoading = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(0);
    setPage(0);
    cachedPage = 0;
    
    const handleDbChange = () => { 
      fetchPage(0); 
      setPage(0); 
      cachedPage = 0; 
    };
    window.addEventListener("db:transactions:changed", handleDbChange);
    window.addEventListener("sync:updated", handleDbChange);

    return () => {
      window.removeEventListener("db:transactions:changed", handleDbChange);
      window.removeEventListener("sync:updated", handleDbChange);
    };
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      cachedPage = nextPage;
      fetchPage(nextPage);
    }
  }, [loading, loadingMore, hasMore, page, fetchPage]);

  const addTransaction = useCallback(async (tx: Omit<TransactionEntity, "syncStatus" | "localVersion" | "isDeleted">) => {
    await transactionsRepository.add(tx);
  }, []);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Omit<TransactionEntity, "id" | "isDeleted">>) => {
    await transactionsRepository.update(id, updates);
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    await transactionsRepository.softDelete(id);
  }, []);

  return {
    transactions,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
