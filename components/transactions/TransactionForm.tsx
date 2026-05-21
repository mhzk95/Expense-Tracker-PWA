"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { MOCK_CATEGORIES } from "@/lib/mock-data";

interface TransactionFormProps {
  onSuccess: () => void;
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const { addTransaction } = useTransactions();
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  
  // Set default category based on type
  const availableCategories = MOCK_CATEGORIES.filter(c => c.type === type);
  const [categoryId, setCategoryId] = useState(availableCategories[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update category when type changes
  const handleTypeChange = (newType: "expense" | "income") => {
    setType(newType);
    const newCategories = MOCK_CATEGORIES.filter(c => c.type === newType);
    setCategoryId(newCategories[0]?.id || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    setIsSubmitting(true);
    try {
      await addTransaction({
        id: crypto.randomUUID(),
        amount: Number(amount),
        type,
        currency: "USD",
        description: note || "New Transaction",
        date: new Date().toISOString(),
        note,
        categoryId: categoryId || (type === "expense" ? "cat_food_dining" : "cat_income_salary"),
        accountId: "acc_checking", // Still hardcoded for now, could be dynamic
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Toggle */}
      <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => handleTypeChange("expense")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${type === "expense" ? "bg-red-500/20 text-red-400" : "text-slate-400"}`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("income")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${type === "income" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400"}`}
        >
          Income
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none appearance-none"
          required
        >
          {MOCK_CATEGORIES.filter((c) => c.type === type).map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Note (optional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
          placeholder="What was this for?"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !amount}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl py-3 mt-2 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : `Save ${type === "expense" ? "Expense" : "Income"}`}
      </button>
    </form>
  );
}
