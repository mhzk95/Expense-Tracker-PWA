"use client";

import { useState, useEffect, useCallback } from "react";
import { TransactionEntity } from "@/lib/db/indexeddb";
import { transactionsRepository } from "@/lib/db/transactionsRepository";

export function useTransactions() {
  const [transactions, setTransactions] = useState<TransactionEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    try {
      const data = await transactionsRepository.getAll();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    
    const handleDbChange = () => fetchTransactions();
    window.addEventListener("db:transactions:changed", handleDbChange);
    // Also listen to sync changes because remote updates will change the DB status
    window.addEventListener("sync:updated", handleDbChange);

    return () => {
      window.removeEventListener("db:transactions:changed", handleDbChange);
      window.removeEventListener("sync:updated", handleDbChange);
    };
  }, [fetchTransactions]);

  const addTransaction = async (tx: Omit<TransactionEntity, "syncStatus" | "localVersion" | "isDeleted">) => {
    await transactionsRepository.add(tx);
    // Local event listener triggers refetch immediately
  };

  const deleteTransaction = async (id: string) => {
    await transactionsRepository.softDelete(id);
  };

  return {
    transactions,
    loading,
    addTransaction,
    deleteTransaction,
  };
}
