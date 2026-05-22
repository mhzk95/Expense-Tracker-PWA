"use client";

/**
 * RecentTransactions — Shows the latest 5 transactions on the dashboard.
 * Uses local IndexedDB data.
 */

import { useCategories } from "@/hooks/useCategories";
import { formatCurrency, formatDate } from "@/lib/utils/helpers";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils/helpers";
import Link from "next/link";
import { useTransactions } from "@/hooks/useTransactions";

export function RecentTransactions() {
  const { transactions, loading: txLoading } = useTransactions();
  const { categories, loading: catLoading } = useCategories();
  const recent = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  const loading = txLoading || catLoading;

  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
        <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
        <Link
          href="/transactions"
          className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          View all
        </Link>
      </div>

      {/* Transaction rows */}
      <div className="divide-y divide-slate-800/40">
        {loading ? (
          <div className="p-5 text-sm text-slate-400">Loading transactions...</div>
        ) : recent.length === 0 ? (
          <div className="p-5 text-sm text-slate-400">No transactions found.</div>
        ) : recent.map((txn) => {
          const category = categories.find((c) => c.id === txn.categoryId);
          const isIncome = txn.type === "income";
          const isTransfer = txn.type === "transfer";

          return (
            <div
              key={txn.id}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-800/30 transition-colors"
            >
              {/* Type icon */}
              <div
                className={cn(
                  "flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center",
                  isIncome
                    ? "bg-emerald-500/15 text-emerald-400"
                    : isTransfer
                    ? "bg-blue-500/15 text-blue-400"
                    : "bg-red-500/15 text-red-400"
                )}
                style={{ backgroundColor: category ? `${category.color}18` : undefined }}
              >
                {isIncome ? (
                  <ArrowDownLeft className="h-4 w-4" />
                ) : isTransfer ? (
                  <ArrowLeftRight className="h-4 w-4" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
              </div>

              {/* Description + category */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{txn.description}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {category?.name ?? "Uncategorized"} · {formatDate(txn.date, "short")}
                </p>
              </div>

              {/* Amount */}
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  isIncome ? "text-emerald-400" : isTransfer ? "text-slate-300" : "text-white"
                )}
              >
                {isIncome ? "+" : isTransfer ? "" : "−"}
                {formatCurrency(txn.amount, txn.currency)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
