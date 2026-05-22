import { getDB, CategoryEntity, SyncQueueItem } from "./indexeddb";
import { syncQueueRepository } from "../sync/syncQueueRepository";
import { generateId } from "../utils/helpers";

class CategoriesRepository {
  async getAll(): Promise<CategoryEntity[]> {
    const db = await getDB();
    const categories = await db.getAll("categories");
    return categories.filter((c: CategoryEntity) => !c.isDeleted);
  }

  async getById(id: string): Promise<CategoryEntity | undefined> {
    const db = await getDB();
    const c = await db.get("categories", id);
    if (c && !c.isDeleted) return c;
    return undefined;
  }

  async add(category: Omit<CategoryEntity, "syncStatus" | "localVersion" | "isDeleted">): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(["categories", "syncQueue"], "readwrite");

    const newCategory: CategoryEntity = {
      ...category,
      syncStatus: "pending",
      localVersion: 1,
      isDeleted: false,
    };

    await tx.objectStore("categories").put(newCategory);

    const syncItem: SyncQueueItem = {
      id: generateId("sync"),
      entityType: "category",
      entityId: category.id,
      mutationType: "create",
      payload: newCategory,
      status: "pending",
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await tx.objectStore("syncQueue").put(syncItem);

    await tx.done;

    // Trigger local events
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:categories:changed"));
      window.dispatchEvent(new Event("sync:requested"));
    }
  }

  async update(id: string, updates: Partial<CategoryEntity>): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(["categories", "syncQueue"], "readwrite");

    const category = await tx.objectStore("categories").get(id);
    if (!category || category.isDeleted) {
      throw new Error("Category not found");
    }

    const updatedCategory: CategoryEntity = {
      ...category,
      ...updates,
      syncStatus: "pending",
      localVersion: category.localVersion + 1,
    };

    await tx.objectStore("categories").put(updatedCategory);

    const syncItem: SyncQueueItem = {
      id: generateId("sync"),
      entityType: "category",
      entityId: id,
      mutationType: "update",
      payload: updatedCategory,
      status: "pending",
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await tx.objectStore("syncQueue").put(syncItem);

    await tx.done;

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:categories:changed"));
      window.dispatchEvent(new Event("sync:requested"));
    }
  }

  async softDelete(id: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(["categories", "syncQueue"], "readwrite");

    const category = await tx.objectStore("categories").get(id);
    if (!category || category.isDeleted) {
      return;
    }

    const updatedCategory: CategoryEntity = {
      ...category,
      syncStatus: "pending",
      localVersion: category.localVersion + 1,
      isDeleted: true,
    };

    await tx.objectStore("categories").put(updatedCategory);

    const syncItem: SyncQueueItem = {
      id: generateId("sync"),
      entityType: "category",
      entityId: id,
      mutationType: "delete",
      payload: { id },
      status: "pending",
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await tx.objectStore("syncQueue").put(syncItem);

    await tx.done;

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:categories:changed"));
      window.dispatchEvent(new Event("sync:requested"));
    }
  }
}

export const categoriesRepository = new CategoriesRepository();
