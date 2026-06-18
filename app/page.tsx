"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { CategorySpending } from "@/components/dashboard/CategorySpending";
import { SpendingHeatmap } from "@/components/dashboard/SpendingHeatmap";
import { AddTransactionAction } from "@/components/dashboard/AddTransactionAction";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* PageHeader Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-slate-900 rounded-xl mb-2" />
          <div className="h-4 w-64 bg-slate-900 rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-slate-900 rounded-xl" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-5 h-28 flex flex-col justify-between border border-slate-900">
            <div className="h-3 w-16 bg-slate-900 rounded-full" />
            <div className="h-6 w-24 bg-slate-900 rounded-full mt-2" />
            <div className="h-3 w-20 bg-slate-900 rounded-full mt-2" />
          </div>
        ))}
      </div>

      {/* Bottom Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions Skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-36 bg-slate-900 rounded-lg" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-card p-4 flex items-center gap-4 border border-slate-900">
                <div className="h-9 w-9 rounded-full bg-slate-900" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-24 bg-slate-900 rounded-full" />
                  <div className="h-2.5 w-16 bg-slate-900 rounded-full" />
                </div>
                <div className="h-4 w-12 bg-slate-900 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Category Spending Skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-36 bg-slate-900 rounded-lg" />
          <div className="glass-card p-5 h-[368px] flex flex-col justify-between border border-slate-900">
            <div className="h-4 w-28 bg-slate-900 rounded-full animate-pulse" />
            <div className="h-48 w-48 rounded-full border-[12px] border-slate-900 mx-auto flex items-center justify-center" />
            <div className="flex justify-center gap-4">
              <div className="h-3.5 w-16 bg-slate-900 rounded-full" />
              <div className="h-3.5 w-16 bg-slate-900 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { loading: txLoading } = useTransactions();
  const { loading: accLoading } = useAccounts();
  const { loading: catLoading } = useCategories();

  const loading = txLoading || accLoading || catLoading;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle={`Your financial snapshot for ${new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date())}`}
        action={
          <div className="flex items-center gap-2">
            <AddTransactionAction />
          </div>
        }
      />

      {/* ── Summary stats ───────────────────────────────────────────────── */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">Summary statistics</h2>
        <DashboardStats />
      </section>

      {/* ── Bottom grid: transactions + categories ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="sr-only">Recent Transactions</h2>
          <RecentTransactions />
        </section>

        <section aria-labelledby="spending-heading">
          <h2 id="spending-heading" className="sr-only">Category Spending</h2>
          <CategorySpending />
        </section>
      </div>
      
      {/* ── Heatmap ──────────────────────────────────────────────────────── */}
      <section aria-labelledby="heatmap-heading">
        <h2 id="heatmap-heading" className="sr-only">Spending Heatmap</h2>
        <SpendingHeatmap />
      </section>
    </div>
  );
}
