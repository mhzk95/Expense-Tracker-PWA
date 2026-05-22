"use client";

import { useState, useEffect, useCallback } from "react";
import { CategoryEntity } from "@/lib/db/indexeddb";
import { categoriesRepository } from "@/lib/db/categoriesRepository";

export function useCategories() {
  const [categories, setCategories] = useState<CategoryEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoriesRepository.getAll();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    
    const handleDbChange = () => fetchCategories();
    window.addEventListener("db:categories:changed", handleDbChange);
    window.addEventListener("sync:updated", handleDbChange);

    return () => {
      window.removeEventListener("db:categories:changed", handleDbChange);
      window.removeEventListener("sync:updated", handleDbChange);
    };
  }, [fetchCategories]);

  const addCategory = async (cat: Omit<CategoryEntity, "syncStatus" | "localVersion" | "isDeleted">) => {
    await categoriesRepository.add(cat);
  };

  const updateCategory = async (id: string, updates: Partial<CategoryEntity>) => {
    await categoriesRepository.update(id, updates);
  };

  const deleteCategory = async (id: string) => {
    await categoriesRepository.softDelete(id);
  };

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
