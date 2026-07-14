"use client";

import { useState, useEffect, useCallback } from "react";
import { CategoryEntity } from "@/lib/db/indexeddb";
import { categoriesRepository } from "@/lib/db/categoriesRepository";

// Memory cache to prevent layout shifts and flickering on component mount
let cachedCategories: CategoryEntity[] | null = null;
let cachedLoading = true;

export function useCategories() {
  const [categories, setCategories] = useState<CategoryEntity[]>(cachedCategories || []);
  const [loading, setLoading] = useState(cachedCategories === null);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoriesRepository.getAll();
      
      // Prevent unnecessary state updates if the fetched data is identical to what's already cached
      const isDifferent = !cachedCategories || 
                          cachedCategories.length !== data.length || 
                          data.some((c, i) => 
                            c.id !== cachedCategories![i]?.id || 
                            c.name !== cachedCategories![i]?.name || 
                            c.color !== cachedCategories![i]?.color ||
                            c.icon !== cachedCategories![i]?.icon ||
                            c.type !== cachedCategories![i]?.type
                          );

      if (isDifferent || cachedLoading) {
        cachedCategories = data;
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories", error);
    } finally {
      cachedLoading = false;
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

  const addCategory = useCallback(async (cat: Omit<CategoryEntity, "syncStatus" | "localVersion" | "isDeleted">) => {
    await categoriesRepository.add(cat);
  }, []);

  const updateCategory = useCallback(async (id: string, updates: Partial<CategoryEntity>) => {
    await categoriesRepository.update(id, updates);
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    await categoriesRepository.softDelete(id);
  }, []);

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
