/**
 * Category types for the expense tracker.
 */

export type CategoryType = "income" | "expense" | "transfer";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  /** Parent category ID for subcategories */
  parentId?: string;
  icon: string;
  /** Hex color string, e.g. "#6366f1" */
  color: string;
  isSystem: boolean;
  isArchived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithSubcategories extends Category {
  subcategories: Category[];
}

/** Predefined system category IDs (always available) */
export const SYSTEM_CATEGORY_IDS = {
  FOOD_DINING: "cat_food_dining",
  TRANSPORTATION: "cat_transportation",
  HOUSING: "cat_housing",
  UTILITIES: "cat_utilities",
  HEALTHCARE: "cat_healthcare",
  ENTERTAINMENT: "cat_entertainment",
  SHOPPING: "cat_shopping",
  EDUCATION: "cat_education",
  TRAVEL: "cat_travel",
  PERSONAL: "cat_personal",
  INCOME_SALARY: "cat_income_salary",
  INCOME_FREELANCE: "cat_income_freelance",
  INCOME_INVESTMENTS: "cat_income_investments",
  INCOME_OTHER: "cat_income_other",
  TRANSFER: "cat_transfer",
  OTHER: "cat_other",
} as const;
