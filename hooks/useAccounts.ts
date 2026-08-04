"use client";

import { useState, useEffect, useCallback } from "react";
import { AccountEntity } from "@/lib/db/indexeddb";
import { accountsRepository } from "@/lib/db/accountsRepository";

// Memory cache to prevent layout shifts and flickering on component mount
let cachedAccounts: AccountEntity[] | null = null;
let cachedLoading = true;

export function useAccounts() {
  const [accounts, setAccounts] = useState<AccountEntity[]>(cachedAccounts || []);
  const [loading, setLoading] = useState(cachedAccounts === null);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await accountsRepository.getAll();
      
      // Prevent unnecessary state updates if the fetched data is identical to what's already cached
      const isDifferent = !cachedAccounts || 
                          cachedAccounts.length !== data.length || 
                          data.some((a, i) => 
                            a.id !== cachedAccounts![i]?.id || 
                            a.balance !== cachedAccounts![i]?.balance || 
                            a.name !== cachedAccounts![i]?.name ||
                            a.isDefault !== cachedAccounts![i]?.isDefault ||
                            a.excludeFromNetWorth !== cachedAccounts![i]?.excludeFromNetWorth
                          );

      if (isDifferent || cachedLoading) {
        cachedAccounts = data;
        setAccounts(data);
      }
    } catch (error) {
      console.error("Failed to fetch accounts", error);
    } finally {
      cachedLoading = false;
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

  const setDefaultAccount = async (id: string) => {
    await accountsRepository.setDefault(id);
  };

  const deleteAccount = async (id: string) => {
    await accountsRepository.softDelete(id);
  };

  return {
    accounts,
    loading,
    addAccount,
    updateAccount,
    setDefaultAccount,
    deleteAccount,
  };
}
