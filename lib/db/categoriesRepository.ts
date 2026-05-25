import { getDB, CategoryEntity } from "./indexeddb";
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

  async add(category: Omit<CategoryEntity, "isDeleted">): Promise<void> {
    const db = await getDB();

    const newCategory: CategoryEntity = {
      ...category,
      isDeleted: false,
    };

    await db.put("categories", newCategory);

    // Trigger local events
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:categories:changed"));
    }
  }

  async update(id: string, updates: Partial<CategoryEntity>): Promise<void> {
    const db = await getDB();

    const category = await db.get("categories", id);
    if (!category || category.isDeleted) {
      throw new Error("Category not found");
    }

    const updatedCategory: CategoryEntity = {
      ...category,
      ...updates,
    };

    await db.put("categories", updatedCategory);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:categories:changed"));
    }
  }

  async softDelete(id: string): Promise<void> {
    const db = await getDB();

    const category = await db.get("categories", id);
    if (!category || category.isDeleted) {
      return;
    }

    const updatedCategory: CategoryEntity = {
      ...category,
      isDeleted: true,
    };

    await db.put("categories", updatedCategory);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:categories:changed"));
    }
  }
}

export const categoriesRepository = new CategoriesRepository();
