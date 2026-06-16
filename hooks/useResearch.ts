"use client";

import { useState, useEffect, useCallback } from "react";
import { getDB, ResearchTopicEntity, SavedItemEntity, pushSyncAction } from "@/lib/db/indexeddb";

export function useResearch() {
  const [topics, setTopics] = useState<ResearchTopicEntity[]>([]);
  const [items, setItems] = useState<SavedItemEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const db = await getDB();
      const allTopics = await db.getAll("researchTopics");
      const allItems = await db.getAll("savedItems");
      
      setTopics(allTopics.filter((t: ResearchTopicEntity) => !t.isDeleted).sort((a: ResearchTopicEntity, b: ResearchTopicEntity) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setItems(allItems.filter((i: SavedItemEntity) => !i.isDeleted).sort((a: SavedItemEntity, b: SavedItemEntity) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Failed to fetch research data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    window.addEventListener("db:research:changed", fetchData);
    window.addEventListener("sync:updated", fetchData);
    return () => {
      window.removeEventListener("db:research:changed", fetchData);
      window.removeEventListener("sync:updated", fetchData);
    };
  }, [fetchData]);

  const addTopic = async (topic: Omit<ResearchTopicEntity, "createdAt" | "updatedAt" | "isDeleted">) => {
    const db = await getDB();
    const now = new Date().toISOString();
    const newTopic = { ...topic, isDeleted: false, createdAt: now, updatedAt: now };
    await db.put("researchTopics", newTopic);
    await pushSyncAction("RESEARCH_TOPIC", "CREATE", newTopic);
    fetchData();
    window.dispatchEvent(new CustomEvent("db:research:changed"));
  };

  const addItem = async (item: Omit<SavedItemEntity, "createdAt" | "updatedAt" | "isDeleted" | "tags" | "isPinned" | "isArchived"> & Partial<Pick<SavedItemEntity, "tags" | "isPinned" | "isArchived">>) => {
    const db = await getDB();
    const now = new Date().toISOString();
    
    const newItem = { 
      ...item, 
      tags: item.tags || [],
      isPinned: item.isPinned || false,
      isArchived: item.isArchived || false,
      isDeleted: false, 
      createdAt: now, 
      updatedAt: now 
    };
    
    await db.put("savedItems", newItem);
    await pushSyncAction("SAVED_ITEM", "CREATE", newItem);
    fetchData();
    window.dispatchEvent(new CustomEvent("db:research:changed"));

    // Background Enrichment for Links
    if (newItem.type === "link" && newItem.url) {
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(newItem.url)}`);
        if (res.ok) {
          const preview = await res.json();
          // Update only if it doesn't already have a title/image explicitly provided
          const updates: Partial<SavedItemEntity> = {};
          if (preview.title && (!newItem.title || newItem.title === "Saved Item" || newItem.title === "Saved Link" || newItem.title === "Shared Link")) {
            updates.title = preview.title;
          }
          if (preview.description && !newItem.content) {
            updates.content = preview.description;
          }
          if (preview.image && !newItem.imageUrl) {
            updates.imageUrl = preview.image;
          }
          
          if (Object.keys(updates).length > 0) {
            await updateItem(newItem.id, updates);
          }
        }
      } catch (err) {
        console.error("Failed to unfurl link in background", err);
      }
    }

    // Background OCR for Images
    if ((newItem.type === "image" || newItem.type === "screenshot") && newItem.imageUrl) {
      try {
        const Tesseract = (await import("tesseract.js")).default;
        const result = await Tesseract.recognize(newItem.imageUrl, 'eng');
        if (result.data && result.data.text) {
          const extractedText = result.data.text.trim();
          if (extractedText) {
            await updateItem(newItem.id, { ocrText: extractedText });
          }
        }
      } catch (err) {
        console.error("Failed to run background OCR", err);
      }
    }
  };

  const updateTopic = async (id: string, updates: Partial<ResearchTopicEntity>) => {
    const db = await getDB();
    const existing = await db.get("researchTopics", id);
    if (!existing) return;
    const updatedTopic = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await db.put("researchTopics", updatedTopic);
    await pushSyncAction("RESEARCH_TOPIC", "UPDATE", updatedTopic);
    fetchData();
    window.dispatchEvent(new CustomEvent("db:research:changed"));
  };

  const updateItem = async (id: string, updates: Partial<SavedItemEntity>) => {
    const db = await getDB();
    const existing = await db.get("savedItems", id);
    if (!existing) return;
    const updatedItem = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await db.put("savedItems", updatedItem);
    await pushSyncAction("SAVED_ITEM", "UPDATE", updatedItem);
    fetchData();
    window.dispatchEvent(new CustomEvent("db:research:changed"));
  };

  const deleteTopic = async (id: string) => updateTopic(id, { isDeleted: true });
  const deleteItem = async (id: string) => updateItem(id, { isDeleted: true });

  return {
    topics,
    items,
    loading,
    addTopic,
    addItem,
    updateTopic,
    updateItem,
    deleteTopic,
    deleteItem,
  };
}
