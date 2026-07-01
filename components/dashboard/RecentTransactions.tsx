"use client";

/**
 * RecentTransactions — Shows the latest 5 transactions on the dashboard.
 * Uses local IndexedDB data.
 */

import { useCategories } from "@/hooks/useCategories";
import { formatCurrency, formatDate, hexToRgb, getCategoryIcon } from "@/lib/utils/helpers";
import { ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils/helpers";
import Link from "next/link";
import { useTransactions } from "@/hooks/useTransactions";
import { GlassCard } from "@/components/ui/GlassCard";
import { useMemo } from "react";

export function RecentTransactions() {
  const { transactions, loading: txLoading } = useTransactions();
  const { categories, loading: catLoading } = useCategories();

  // Transactions are already sorted descending by date in the repository
  const recent = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const loading = txLoading || catLoading;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
        <Link
          href="/transactions"
          className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          View all
        </Link>
      </div>

      {/* Transaction rows */}
      <div className="space-y-3 flex-1 flex flex-col justify-start">
        {loading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-card p-4 flex items-center gap-4 animate-pulse">
                <div className="h-9 w-9 rounded-full bg-slate-800/60" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-24 bg-slate-800/60 rounded-full" />
                  <div className="h-2.5 w-16 bg-slate-800/60 rounded-full" />
                </div>
                <div className="h-4 w-12 bg-slate-800/60 rounded-full" />
              </div>
            ))}
          </>
        ) : recent.length === 0 ? (
          <div className="glass-card p-5 text-sm text-slate-400 text-center">No transactions found.</div>
        ) : (
          recent.map((txn) => {
            const category = categories.find((c) => c.id === txn.categoryId);
            const isIncome = txn.type === "income";
            const isTransfer = txn.type === "transfer";

            const baseColor = category?.color || "#8b5cf6";

            return (
              <div
                key={txn.id}
                className={cn(
                  "glass-card interactive flex items-center gap-3 px-4 py-2.5 transition-all duration-300 border border-transparent",
                  txn.needsReview && "needs-review-card border-l-2 border-l-amber-500/60"
                )}
                style={{
                  "--color-primary": baseColor,
                  "--color-primary-rgb": hexToRgb(baseColor),
                  "--color-primary-glow": "rgba(var(--color-primary-rgb), var(--card-glow-intensity))",
                  "--color-primary-glow-hover": "rgba(var(--color-primary-rgb), var(--card-glow-hover-intensity))",
                  "--glass-border-gradient": "linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.35) 0%, rgba(var(--color-primary-rgb), 0.05) 40%, rgba(var(--color-primary-rgb), 0.02) 60%, var(--color-primary) 100%)",
                  borderColor: `${baseColor}20`,
                  boxShadow: `0 4px 15px -3px ${baseColor}10, inset 0 1px 0px rgba(255,255,255,0.05)`
                } as React.CSSProperties}
              >
                {/* Type icon */}
                <div
                  className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: `${baseColor}20`,
                    color: baseColor 
                  }}
                >
                  {(() => {
                    if (isTransfer) {
                      return <ArrowLeftRight className="h-4 w-4" />;
                    }
                    const IconComp = getCategoryIcon(category?.icon);
                    return <IconComp className="h-4 w-4" />;
                  })()}
                </div>

                {/* Description + category */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {txn.payee ? txn.payee : txn.description}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {txn.payee && txn.description !== "Quick Entry" && `${txn.description} · `}
                    {category?.name ?? "Uncategorized"} · {formatDate(txn.date, "medium")}
                  </p>
                </div>

                {/* Amount + Review Badge */}
                <div className="text-right flex flex-col items-end">
                  <span
                    className={cn(
                      "text-xs font-bold tabular-nums",
                      isIncome ? "text-emerald-400" : isTransfer ? "text-slate-300" : "text-white"
                    )}
                  >
                    {isIncome ? "+" : isTransfer ? "" : "−"}
                    {formatCurrency(txn.amount, txn.currency)}
                  </span>
                  {txn.needsReview && (
                    <span className="text-[7px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 py-0.5 rounded leading-none mt-0.5">
                      Review
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
