"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCategories } from "@/hooks/useCategories";
import { Target, Plus, Trash2, Edit2, ChevronLeft } from "lucide-react";
import { AdaptiveOverlay } from "@/components/ui/AdaptiveOverlay";
import { Card } from "@/components/ui/Card";
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest text-white bg-[var(--color-primary)] hover:brightness-110 border-2 border-[var(--color-border)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              <Plus className="h-4 w-4 stroke-[3px]" />
              Add New
            </button>
          )
        }
      />

      <AdaptiveOverlay
        isOpen={isAdding}
        onClose={resetForm}
        title={editingId ? "Edit Category" : "New Category"}
      >
        <div className="p-4 sm:p-5 bg-[var(--color-surface)] mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl px-3 py-2.5 text-sm font-bold text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition-colors"
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
                <div className="px-3 py-2 text-center text-xs font-black uppercase tracking-widest rounded-xl border-2 border-[var(--color-border)] text-gray-500 peer-checked:bg-red-400 peer-checked:text-white peer-checked: active:translate-x-0.5 active:translate-y-0.5 transition-all">
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
                <div className="px-3 py-2 text-center text-xs font-black uppercase tracking-widest rounded-xl border-2 border-[var(--color-border)] text-gray-500 peer-checked:bg-emerald-400 peer-checked:text-white peer-checked: active:translate-x-0.5 active:translate-y-0.5 transition-all">
                  Income
                </div>
              </label>
            </div>

            {/* Icon Picker Grid */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest">Icon</label>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-3 bg-[var(--color-bg)] border-2 border-[var(--color-border)] rounded-xl max-h-[140px] overflow-y-auto scrollbar-none">
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
                      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:translate-x-0.5 active:translate-y-0.5 border-2 ${
                        isSelected 
                          ? "bg-[var(--color-primary)] border-[var(--color-border)] text-white  active:shadow-none" 
                          : "bg-[var(--color-surface)] border-transparent text-[var(--color-text)] hover:border-[var(--color-border)] hover:"
                      }`}
                      title={ico.label}
                    >
                      <IconComp className="w-5 h-5 stroke-[2.5px]" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Robust Color Picker */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest">Color</label>
              <div className="flex flex-wrap items-center gap-2 bg-[var(--color-bg)] border-2 border-[var(--color-border)] rounded-xl p-3">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setColor(c);
                      vibrate([10]);
                    }}
                    className={`w-8 h-8 rounded-full border-2 transition-all active:scale-90 ${
                      color.toLowerCase() === c.toLowerCase() ? "border-[var(--color-border)] scale-110 " : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                
                {/* Custom Color Wheel Native Input */}
                <div 
                  className="relative w-8 h-8 rounded-full border-2 border-dashed border-gray-400 hover:border-[var(--color-border)] transition-colors flex items-center justify-center overflow-hidden cursor-pointer"
                  style={{ backgroundColor: colors.includes(color.toLowerCase()) ? "transparent" : color }}
                >
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {colors.includes(color.toLowerCase()) ? (
                    <span className="text-[10px] text-gray-400 font-bold pointer-events-none">+</span>
                  ) : (
                    <span className="w-2 h-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] pointer-events-none" />
                  )}
                </div>

                {/* Text Hex input */}
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#ffffff"
                  className="w-20 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-lg px-2 py-1 text-xs text-[var(--color-text)] font-bold uppercase outline-none focus: text-center font-mono ml-auto"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-[var(--color-text)] bg-[var(--color-surfaceHover)] hover:bg-[var(--color-surfaceHover)] rounded-[12px] border-2 border-[var(--color-border)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-white bg-[var(--color-primary)] hover:brightness-110 rounded-[12px] border-2 border-[var(--color-border)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
              >
                {editingId ? "Save Changes" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </AdaptiveOverlay>

      <div className="space-y-6">
        {["expense", "income"].map((groupType) => {
          const grouped = categories.filter((c) => c.type === groupType);
          if (grouped.length === 0) return null;

          return (
            <div key={groupType} className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-text)] px-1 mt-2">
                {groupType} Categories
              </h3>
              
              {/* Single column on mobile so names don't truncate, 2 on tablet, 3 on desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {grouped.map((cat) => {
                  const IconComp = getCategoryIcon(cat.icon);
                  return (
                    <Card 
                      key={cat.id}
                      variant="surface"
                      className="group relative flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 pl-5 sm:pl-6 hover:bg-[var(--color-surfaceHover)] transition-all duration-300 overflow-hidden border-2 border-[var(--color-border)]"
                    >
                      {/* Accent Strip */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-2.5 border-r-2 border-[var(--color-border)]"
                        style={{ backgroundColor: cat.color || "#94a3b8" }}
                      />

                      <div className="flex items-center gap-3 min-w-0 flex-1 ml-1">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--color-bg)] border-2 border-[var(--color-border)]">
                          <IconComp className="w-4 h-4 stroke-[3px]" style={{ color: cat.color }} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text)] truncate">{cat.name}</span>
                      </div>

                      {/* Edit / Delete actions */}
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(cat);
                          }}
                          className="p-2 rounded-xl border-2 border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-surfaceHover)] text-gray-500 hover:text-[var(--color-text)] transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 stroke-[3px]" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete "${cat.name}" category?`)) {
                              deleteCategory(cat.id);
                            }
                          }}
                          className="p-2 rounded-xl border-2 border-transparent hover:border-red-500 hover:bg-red-100 text-gray-500 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 stroke-[3px]" />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {!loading && categories.length === 0 && !isAdding && (
          <div className="text-center p-10 bg-[var(--color-surface)] border-4 border-[var(--color-border)] border-dashed rounded-[24px]">
            <Target className="w-12 h-12 text-[var(--color-text)] mx-auto mb-4 stroke-[2.5px]" />
            <h3 className="text-lg font-black uppercase tracking-widest text-[var(--color-text)] mb-2">No Categories</h3>
            <p className="text-sm font-bold text-gray-500 mb-6">Add your first category to start tracking.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 text-sm font-black uppercase tracking-widest text-white bg-[var(--color-primary)] hover:brightness-110 rounded-xl border-4 border-[var(--color-border)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            >
              Add Category
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
