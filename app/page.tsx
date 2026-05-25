/**
 * Dashboard page (/) — Home overview of financial health.
 *
 * Server Component: reads mock data at render time.
 * No browser APIs used here.
 */

import { PageHeader } from "@/components/ui/PageHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { CategorySpending } from "@/components/dashboard/CategorySpending";
import type { Metadata } from "next";

import { AddTransactionAction } from "@/components/dashboard/AddTransactionAction";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overview of your financial health — income, expenses, and net worth.",
};

export default function DashboardPage() {
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
    </div>
  );
}
