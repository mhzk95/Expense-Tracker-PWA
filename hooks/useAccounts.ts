"use client";

import { useState, useEffect, useCallback } from "react";
import { AccountEntity } from "@/lib/db/indexeddb";
import { accountsRepository } from "@/lib/db/accountsRepository";
import { MOCK_ACCOUNTS } from "@/lib/mock-data";

export function useAccounts() {
  const [accounts, setAccounts] = useState<AccountEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await accountsRepository.getAll();
      
      // Auto-seed if empty for demo purposes
      if (data.length === 0) {
        for (const ma of MOCK_ACCOUNTS) {
          await accountsRepository.add({
            id: ma.id,
            name: ma.name,
            type: ma.type,
            balance: ma.balance,
            currency: ma.currency,
            status: ma.status,
            institution: ma.institution,
            lastFour: ma.lastFour,
            color: ma.color,
            icon: ma.icon,
            includeInNetWorth: ma.includeInNetWorth,
            isDefault: ma.isDefault,
          });
        }
        const seeded = await accountsRepository.getAll();
        setAccounts(seeded);
      } else {
        setAccounts(data);
      }
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

  const deleteAccount = async (id: string) => {
    await accountsRepository.softDelete(id);
  };

  return {
    accounts,
    loading,
    addAccount,
    deleteAccount,
  };
}
