/**
 * Recurring page — Subscriptions and repeating payments.
 * Phase 1: Static layout with mock recurring items.
 */

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils/helpers";
import { RefreshCw, Plus, Calendar } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recurring",
  description: "Manage subscriptions and recurring payments.",
};

export default function RecurringPage() {
  const recurringTransactions: any[] = [];
  const monthlyTotal = 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring"
        subtitle="Subscriptions & scheduled payments"
        action={
          <button
            id="add-recurring-btn"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 transition-all shadow-lg shadow-violet-500/20"
          >
            <Plus className="h-4 w-4" />
            Add Recurring
          </button>
        }
      />

      {/* Summary card */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5 flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
          <RefreshCw className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider">Monthly Recurring</p>
          <p className="text-2xl font-bold text-white mt-0.5">{formatCurrency(monthlyTotal)}</p>
          <p className="text-xs text-slate-500 mt-0.5">{recurringTransactions.length} active subscriptions</p>
        </div>
      </div>

      {/* Recurring list */}
      {recurringTransactions.length === 0 ? (
        <EmptyState
          icon={<RefreshCw className="h-8 w-8 text-slate-500" />}
          title="No recurring transactions"
          description="Track your subscriptions and scheduled payments."
          action={
            <button className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all">
              Add First Subscription
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {recurringTransactions.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center gap-4 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 hover:border-slate-700/60 transition-all"
            >
              <div className="h-10 w-10 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{txn.description}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3 w-3 text-slate-500" />
                  <span className="text-xs text-slate-500">Monthly · Next: {formatDate(txn.date, "medium")}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white tabular-nums">
                  {formatCurrency(txn.amount)}
                  <span className="text-slate-500 font-normal text-xs">/mo</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
