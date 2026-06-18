"use client";

/**
 * Transactions page — Full transaction history with filtering.
 * Phase 7: Live IndexedDB data.
 */

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils/helpers";
import { cn } from "@/lib/utils/helpers";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Filter, Trash2 } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { AddTransactionAction } from "@/components/dashboard/AddTransactionAction";
import { SwipeToDelete } from "@/components/ui/SwipeToDelete";
import { GlassCard } from "@/components/ui/GlassCard";

export default function TransactionsPage() {
  const { transactions: rawTransactions, loading: txLoading, deleteTransaction } = useTransactions();
  const { categories, loading: catLoading } = useCategories();
  
  const loading = txLoading || catLoading;
  
  const transactions = [...rawTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        subtitle={loading ? "Loading..." : `${transactions.length} transactions this month`}
        action={
          <div className="flex items-center gap-2">
            <button
              id="filter-transactions-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 transition-all"
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <AddTransactionAction />
          </div>
        }
      />

      {/* Transaction list */}
      <GlassCard>
        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Add your first income or expense to get started."
            action={<AddTransactionAction />}
          />
        ) : (
          <div className="divide-y divide-white/5">
            {transactions.map((txn) => {
              const category = categories.find((c) => c.id === txn.categoryId);
              const isIncome = txn.type === "income";
              const isTransfer = txn.type === "transfer";

              return (
                <SwipeToDelete 
                  key={txn.id} 
                  onDelete={() => deleteTransaction(txn.id)}
                  className={cn(
                    "transition-all duration-300 hover:bg-white/5",
                    txn.needsReview && "border-l-[3px] border-amber-500/80 bg-gradient-to-r from-amber-500/5 to-transparent"
                  )}
                  style={{ 
                    boxShadow: [
                      category ? `inset -20px 0 30px -20px ${category.color}80, inset -2px 0 0 0 ${category.color}` : '',
                      txn.needsReview ? `-4px 0 15px -5px rgba(245,158,11,0.3)` : ''
                    ].filter(Boolean).join(', ') || undefined
                  }}
                >
                  <div className="flex items-center gap-4 px-5 py-4 w-full">
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
                        isIncome
                          ? "bg-emerald-500/15 text-emerald-400"
                          : isTransfer
                          ? "bg-blue-500/15 text-blue-400"
                          : "bg-red-500/15 text-red-400"
                      )}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="h-5 w-5" />
                      ) : isTransfer ? (
                        <ArrowLeftRight className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{txn.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">{category?.name ?? "Other"}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs text-slate-400">{formatDate(txn.date, "medium")}</span>
                      </div>
                    </div>

                    {/* Amount + status */}
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          isIncome ? "text-emerald-400" : isTransfer ? "text-slate-300" : "text-white"
                        )}
                      >
                        {isIncome ? "+" : "−"}{formatCurrency(txn.amount, txn.currency)}
                      </p>
                      <span
                        className={cn(
                          "text-xs",
                          txn.status === "completed" ? "text-slate-500" : "text-amber-400"
                        )}
                      >
                        {txn.status}
                      </span>
                    </div>
                  </div>
                </SwipeToDelete>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
