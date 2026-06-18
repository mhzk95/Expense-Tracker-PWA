"use client";

import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency } from "@/lib/utils/helpers";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/helpers";
import { GlassCard } from "@/components/ui/GlassCard";

export function CategorySpending() {
  const { transactions, loading: txLoading } = useTransactions();
  const { categories, loading: catLoading } = useCategories();

  if (txLoading || catLoading) {
    return (
      <GlassCard className="flex flex-col h-full animate-pulse">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="h-4 w-36 bg-slate-800/60 rounded-full" />
          <div className="h-3 w-24 bg-slate-800/60 rounded-full" />
        </div>
        <div className="p-5 flex-1 space-y-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800/60" />
                  <div className="h-3 w-20 bg-slate-800/60 rounded-full" />
                </div>
                <div className="h-3.5 w-12 bg-slate-800/60 rounded-full" />
              </div>
              <div className="h-1.5 w-full bg-slate-800/60 rounded-full" />
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  // Filter only expenses for current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const expenses = transactions.filter((t) => {
    if (t.type !== "expense") return false;
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const totalSpent = expenses.reduce((s, t) => s + t.amount, 0);

  // Group by category
  const grouped = expenses.reduce((acc, t) => {
    const catId = t.categoryId || "other";
    if (!acc[catId]) acc[catId] = 0;
    acc[catId] += t.amount;
    return acc;
  }, {} as Record<string, number>);

  // Sort by highest spending
  const sortedCategories = Object.entries(grouped)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5) // Top 5
    .map(([catId, amount]) => {
      const categoryInfo = categories.find((c) => c.id === catId);
      return {
        id: catId,
        name: categoryInfo?.name || "Other",
        color: categoryInfo?.color || "#94a3b8",
        amount,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
      };
    });

  return (
    <GlassCard className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <h2 className="text-sm font-semibold text-white">Where your money goes</h2>
        <Link
          href="/analytics"
          className="text-xs flex items-center gap-1 text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          Detailed Analytics
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-center">
        {totalSpent === 0 ? (
          <div className="text-center text-slate-500 text-sm py-4">
            No expenses recorded yet.
          </div>
        ) : (
          <div className="space-y-5">
            {sortedCategories.map((cat) => (
              <div key={cat.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium text-slate-300">{cat.name}</span>
                  </div>
                  <span className="font-semibold text-white tabular-nums">
                    {formatCurrency(cat.amount)}
                  </span>
                </div>

                <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
