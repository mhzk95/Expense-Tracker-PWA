"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCategories } from "@/hooks/useCategories";
import { Target, Plus, Trash2, Edit2, ChevronLeft } from "lucide-react";
import { hexToRgb, getCategoryIcon, ICON_MAP, vibrate } from "@/lib/utils/helpers";

const AVAILABLE_ICONS = [
  { name: "Tag", label: "Tag / Default" },
  { name: "ShoppingCart", label: "Shopping" },
  { name: "Coffee", label: "Coffee / Drinks" },
  { name: "UtensilsCrossed", label: "Food / Restaurant" },
  { name: "Car", label: "Transportation" },
  { name: "Fuel", label: "Gas / Fuel" },
  { name: "Home", label: "Rent / Housing" },
  { name: "Zap", label: "Utilities / Electricity" },
  { name: "Tv", label: "Entertainment / Subscriptions" },
  { name: "Gamepad2", label: "Gaming / Leisure" },
  { name: "ShoppingBag", label: "Clothing / Shopping" },
  { name: "Briefcase", label: "Work / Job" },
  { name: "Building2", label: "Business" },
  { name: "TrendingUp", label: "Investments" },
  { name: "PiggyBank", label: "Savings" },
  { name: "LineChart", label: "Finance / Stocks" },
  { name: "CreditCard", label: "Card / Debt" },
  { name: "Receipt", label: "Bills / Taxes" },
  { name: "HeartPulse", label: "Medical / Health" },
  { name: "Shield", label: "Insurance" },
  { name: "GraduationCap", label: "Education" },
  { name: "Baby", label: "Childcare" },
  { name: "PawPrint", label: "Pets" },
  { name: "Users", label: "Family / Friends" },
  { name: "Gift", label: "Gifts / Donations" },
  { name: "HeartHandshake", label: "Charity" },
  { name: "Plane", label: "Travel / Flights" },
  { name: "Repeat", label: "Recurring" },
  { name: "Wrench", label: "Maintenance" },
  { name: "Hammer", label: "Construction" },
  { name: "Sofa", label: "Furniture" },
  { name: "Package", label: "Delivery / Post" },
  { name: "Wallet", label: "Cash / Wallet" },
  { name: "Sparkles", label: "Personal Care" }
];

export default function CategoriesPage() {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [color, setColor] = useState("#94a3b8");
  const [icon, setIcon] = useState("Tag");

  const colors = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#94a3b8"];

  const resetForm = () => {
    setName("");
    setType("expense");
    setColor("#94a3b8");
    setIcon("Tag");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      await updateCategory(editingId, { name, type, color, icon });
    } else {
      await addCategory({
        id: crypto.randomUUID(),
        name,
        type,
        color,
        icon,
      });
    }
    resetForm();
  };

  const handleEdit = (cat: any) => {
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color || "#94a3b8");
    setIcon(cat.icon || "Tag");
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
              onClick={() => {
                setIsAdding(true);
                vibrate([10]);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/20"
            >
              <Plus className="h-4 w-4" />
              Add New
            </button>
          )
        }
      />

      {isAdding && (
        <div className="p-5 brutal-card mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">
            {editingId ? "Edit Category" : "New Category"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:ring-2 focus:ring-violet-500 outline-none"
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
                <div className="px-3 py-2 text-center text-xs font-semibold rounded-xl border border-slate-800 text-slate-400 peer-checked:bg-red-500/20 peer-checked:text-red-400 peer-checked:border-red-500/50 transition-all">
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
                <div className="px-3 py-2 text-center text-xs font-semibold rounded-xl border border-slate-800 text-slate-400 peer-checked:bg-emerald-500/20 peer-checked:text-emerald-400 peer-checked:border-emerald-500/50 transition-all">
                  Income
                </div>
              </label>
            </div>

            {/* Icon Picker Grid */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Icon</label>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-3 bg-slate-950/40 border border-slate-800 rounded-xl max-h-[140px] overflow-y-auto scrollbar-none">
                {AVAILABLE_ICONS.map((ico) => {
                  const IconComp = ICON_MAP[ico.name] || Target;
                  const isSelected = icon === ico.name;
                  return (
                    <button
                      key={ico.name}
                      type="button"
                      onClick={() => {
                        setIcon(ico.name);
                        vibrate([10]);
                      }}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 ${
                        isSelected 
                          ? "bg-violet-600/20 border border-violet-500/50 text-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.3)]" 
                          : "bg-slate-900/60 border border-slate-800/40 text-slate-400 hover:bg-slate-900 hover:text-white"
                      }`}
                      title={ico.label}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Robust Color Picker */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Color</label>
              <div className="flex flex-wrap items-center gap-2 bg-slate-950/40 border border-slate-800 rounded-xl p-3">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setColor(c);
                      vibrate([10]);
                    }}
                    className={`w-8 h-8 rounded-full border-2 transition-all active:scale-90 ${
                      color.toLowerCase() === c.toLowerCase() ? "border-white scale-110 shadow-lg" : "border-transparent"
                    }`}
                    style={{ 
                      backgroundColor: c,
                      boxShadow: color.toLowerCase() === c.toLowerCase() ? `0 0 10px ${c}` : undefined
                    }}
                  />
                ))}
                
                {/* Custom Color Wheel Native Input */}
                <div 
                  className="relative w-8 h-8 rounded-full border-2 border-dashed border-slate-700 hover:border-slate-500 transition-colors flex items-center justify-center overflow-hidden cursor-pointer"
                  style={{ backgroundColor: colors.includes(color.toLowerCase()) ? "transparent" : color }}
                >
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {colors.includes(color.toLowerCase()) ? (
                    <span className="text-[10px] text-slate-400 font-bold pointer-events-none">+</span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-white pointer-events-none" />
                  )}
                </div>

                {/* Text Hex input */}
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#ffffff"
                  className="w-20 bg-slate-900 border border-slate-800/80 rounded-lg px-2 py-1 text-xs text-white uppercase outline-none focus:border-violet-500/50 text-center font-mono ml-auto"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors"
              >
                {editingId ? "Save Changes" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {["expense", "income"].map((groupType) => {
          const grouped = categories.filter((c) => c.type === groupType);
          if (grouped.length === 0) return null;

          return (
            <div key={groupType} className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 mt-2">
                {groupType} Categories
              </h3>
              
              {/* Brick Wall Layout - Masonry-like dense grid of category chips */}
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2.5">
                {grouped.map((cat) => {
                  const IconComp = getCategoryIcon(cat.icon);
                  return (
                    <div 
                      key={cat.id}
                      className="group relative brutal-card interactive flex items-center justify-between gap-2 px-3 py-2 border rounded-xl overflow-visible transition-all duration-300"
                      style={{ 
                        borderColor: `${cat.color || "#94a3b8"}30`,
                        boxShadow: `0 4px 20px -2px ${(cat.color || "#94a3b8")}15, inset 0 1px 0px rgba(255,255,255,0.05)`,
                        "--color-primary": cat.color || "#94a3b8",
                        "--color-primary-rgb": hexToRgb(cat.color || "#94a3b8"),
                        "--color-primary-glow": "rgba(var(--color-primary-rgb), var(--card-glow-intensity))",
                        "--color-primary-glow-hover": "rgba(var(--color-primary-rgb), var(--card-glow-hover-intensity))",
                        "--glass-border-gradient": "linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.35) 0%, rgba(var(--color-primary-rgb), 0.05) 40%, rgba(var(--color-primary-rgb), 0.02) 60%, var(--color-primary) 100%)"
                      } as React.CSSProperties}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${cat.color || "#94a3b8"}20` }}
                        >
                          <IconComp className="w-3.5 h-3.5" style={{ color: cat.color }} />
                        </div>
                        <span className="text-[11px] font-semibold text-white truncate">{cat.name}</span>
                      </div>

                      {/* Edit / Delete actions */}
                      <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(cat);
                          }}
                          className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete "${cat.name}" category?`)) {
                              deleteCategory(cat.id);
                            }
                          }}
                          className="p-1 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {!loading && categories.length === 0 && !isAdding && (
          <div className="text-center p-10 brutal-card">
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
