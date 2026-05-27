"use client";

import { useState, useEffect, useCallback } from "react";
import { TransactionEntity } from "@/lib/db/indexeddb";
import { transactionsRepository } from "@/lib/db/transactionsRepository";

const PAGE_SIZE = 50;

export function useTransactions() {
  const [transactions, setTransactions] = useState<TransactionEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchPage = async (pageIndex: number) => {
    try {
      const data = await transactionsRepository.getPaginated(PAGE_SIZE, pageIndex * PAGE_SIZE);
      setHasMore(data.length === PAGE_SIZE);
      setTransactions(prev => pageIndex === 0 ? data : [...prev, ...data]);
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(0);
    setPage(0);
    
    const handleDbChange = () => { fetchPage(0); setPage(0); };
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
      fetchPage(nextPage);
    }
  };

  const addTransaction = async (tx: Omit<TransactionEntity, "syncStatus" | "localVersion" | "isDeleted">) => {
    await transactionsRepository.add(tx);
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
    deleteTransaction,
  };
}
