"use client";

import { useState, useEffect, useCallback } from "react";
import { AccountEntity } from "@/lib/db/indexeddb";
import { accountsRepository } from "@/lib/db/accountsRepository";

export function useAccounts() {
  const [accounts, setAccounts] = useState<AccountEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await accountsRepository.getAll();
      setAccounts(data);
    } catch (error) {
      console.error("Failed to fetch accounts", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    
    const handleDbChange = () => fetchAccounts();
    window.addEventListener("db:accounts:changed", handleDbChange);
    window.addEventListener("sync:updated", handleDbChange);

    return () => {
      window.removeEventListener("db:accounts:changed", handleDbChange);
      window.removeEventListener("sync:updated", handleDbChange);
    };
  }, [fetchAccounts]);

  const addAccount = async (acc: Omit<AccountEntity, "syncStatus" | "localVersion" | "isDeleted">) => {
    await accountsRepository.add(acc);
  };

  const updateAccount = async (id: string, updates: Partial<Omit<AccountEntity, "id" | "syncStatus" | "localVersion" | "isDeleted">>) => {
    await accountsRepository.update(id, updates);
  };

  const deleteAccount = async (id: string) => {
    await accountsRepository.softDelete(id);
  };

  return {
    accounts,
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
  };
}
