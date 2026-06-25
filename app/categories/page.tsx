"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCategories } from "@/hooks/useCategories";
import { Target, Plus, Trash2, Edit2 } from "lucide-react";
import { SwipeToDelete } from "@/components/ui/SwipeToDelete";
import { hexToRgb } from "@/lib/utils/helpers";

export default function CategoriesPage() {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [color, setColor] = useState("#94a3b8");

  const colors = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#94a3b8"];

  const resetForm = () => {
    setName("");
    setType("expense");
    setColor("#94a3b8");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      await updateCategory(editingId, { name, type, color });
    } else {
      await addCategory({
        id: crypto.randomUUID(),
        name,
        type,
        color,
      });
    }
    resetForm();
  };

  const handleEdit = (cat: any) => {
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color || "#94a3b8");
    setEditingId(cat.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader 
        title="Categories" 
        subtitle={loading ? "Loading..." : `${categories.length} custom categories`}
        action={
          !isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add New
            </button>
          )
        }
      />

      {isAdding && (
        <div className="p-5 glass-card mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">
            {editingId ? "Edit Category" : "New Category"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-violet-500 outline-none"
                placeholder="e.g. Groceries"
                required
              />
            </div>

            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={type === "expense"}
                  onChange={() => setType("expense")}
                  className="peer sr-only"
                />
                <div className="px-3 py-2 text-center text-sm font-medium rounded-xl border border-slate-800 text-slate-400 peer-checked:bg-red-500/20 peer-checked:text-red-400 peer-checked:border-red-500/50 transition-all">
                  Expense
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={type === "income"}
                  onChange={() => setType("income")}
                  className="peer sr-only"
                />
                <div className="px-3 py-2 text-center text-sm font-medium rounded-xl border border-slate-800 text-slate-400 peer-checked:bg-emerald-500/20 peer-checked:text-emerald-400 peer-checked:border-emerald-500/50 transition-all">
                  Income
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? "border-white scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors"
              >
                {editingId ? "Save Changes" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {["expense", "income"].map((groupType) => {
          const grouped = categories.filter((c) => c.type === groupType);
          if (grouped.length === 0) return null;

          return (
            <div key={groupType} className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 mt-2">
                {groupType} Categories
              </h3>
              <div className="space-y-3">
                {grouped.map((cat) => (
                  <SwipeToDelete 
                    key={cat.id} 
                    onDelete={() => deleteCategory(cat.id)}
                    onEdit={() => handleEdit(cat)}
                    glowColor={cat.color || "#94a3b8"}
                    deleteMessage={`Delete "${cat.name}" category?`}
                  >
                    <div 
                      className="glass-card interactive flex items-center gap-3 px-5 py-4 w-full"
                      style={{ 
                        "--color-primary": cat.color || "#94a3b8",
                        "--color-primary-rgb": hexToRgb(cat.color || "#94a3b8"),
                        "--color-primary-glow": "rgba(var(--color-primary-rgb), var(--card-glow-intensity))",
                        "--color-primary-glow-hover": "rgba(var(--color-primary-rgb), var(--card-glow-hover-intensity))",
                        "--glass-border-gradient": "linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.35) 0%, rgba(var(--color-primary-rgb), 0.05) 40%, rgba(var(--color-primary-rgb), 0.02) 60%, var(--color-primary) 100%)"
                      } as React.CSSProperties}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        <Target className="w-4 h-4" style={{ color: cat.color }} />
                      </div>
                      <span className="flex-1 text-sm font-medium text-white truncate">{cat.name}</span>
                    </div>
                  </SwipeToDelete>
                ))}
              </div>
            </div>
          );
        })}

        {!loading && categories.length === 0 && !isAdding && (
          <div className="text-center p-10 glass-card">
            <Target className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-white mb-1">No Categories</h3>
            <p className="text-xs text-slate-400 mb-4">Add your first category to start tracking.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors"
            >
              Add Category
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
