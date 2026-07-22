"use client";

/**
 * Accounts page — Bank accounts, cards, and wallets overview.
 * Phase 7: Live IndexedDB data.
 */

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils/helpers";
import { cn } from "@/lib/utils/helpers";
import { Building2, CreditCard, PiggyBank, TrendingUp, TrendingDown, Trash2, Wallet } from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { AddAccountAction } from "@/components/accounts/AddAccountAction";
import { SwipeToDelete } from "@/components/ui/SwipeToDelete";
import { AccountCard } from "@/components/accounts/AccountCard";
import { AdaptiveOverlay } from "@/components/ui/AdaptiveOverlay";
import { AccountForm } from "@/components/accounts/AccountForm";
import { Card } from "@/components/ui/Card";

const ACCOUNT_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Building2,
  CreditCard,
  PiggyBank,
  Wallet,
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: "Checking Account",
  savings: "Savings Account",
  credit_card: "Credit Card",
  investment: "Investment",
  cash: "Cash",
  loan: "Loan",
  wallet: "Digital Wallet",
  other: "Other",
};

export default function AccountsPage() {
  const { accounts, loading, deleteAccount } = useAccounts();
  const { transactions } = useTransactions();
  const [editingAccount, setEditingAccount] = useState<any>(null);

  const totalAssets = accounts.filter((a) => a.balance > 0 && a.includeInNetWorth && !a.excludeFromNetWorth)
    .reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = Math.abs(
    accounts.filter((a) => a.balance < 0 && a.includeInNetWorth && !a.excludeFromNetWorth)
      .reduce((s, a) => s + a.balance, 0)
  );
  const netWorth = totalAssets - totalLiabilities;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        subtitle={loading ? "Loading..." : `${accounts.length} connected accounts`}
        action={<AddAccountAction />}
      />

      {loading ? (
        <div className="p-10 text-center text-slate-400">Loading accounts...</div>
      ) : accounts.length === 0 ? (
        <EmptyState
            title="No accounts yet"
            description="Add your first bank account or wallet to track your net worth."
            action={<AddAccountAction />}
          />
      ) : (
        <>
          {/* Net worth summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card variant="surface" className="flex flex-col justify-center p-4 min-h-[100px] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-success,#10b981)]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-surface)] ">
                  <TrendingUp className="h-4 w-4 stroke-[3px] text-emerald-500" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 leading-none">Total Assets</span>
              </div>
              <p className="text-2xl sm:text-3xl font-display font-black text-[var(--color-text)] tabular-nums tracking-tighter leading-none">{formatCurrency(totalAssets)}</p>
            </Card>

            <Card variant="surface" className="flex flex-col justify-center p-4 min-h-[100px] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-danger,#ef4444)]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-surface)] ">
                  <TrendingDown className="h-4 w-4 stroke-[3px] text-red-500" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 leading-none">Total Liabilities</span>
              </div>
              <p className="text-2xl sm:text-3xl font-display font-black text-[var(--color-text)] tabular-nums tracking-tighter leading-none">{formatCurrency(totalLiabilities)}</p>
            </Card>
          </div>

          <Card variant="surface" className="p-4 flex items-center justify-between border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-primary,#facc15)]">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Net Worth</span>
            <span className={`text-xl font-display font-black tabular-nums tracking-tighter px-3 py-1 border-2 border-[var(--color-border)] rounded-xl  ${netWorth >= 0 ? 'bg-emerald-400 text-black' : 'bg-red-400 text-black'}`}>
              {netWorth > 0 ? "+" : ""}{formatCurrency(netWorth)}
            </span>
          </Card>

          {/* Account cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {accounts.map((account) => {
              const Icon = ACCOUNT_ICONS[account.icon ?? "Building2"] ?? Building2;
              
              // Only allow deletion if no transactions are linked to this account
              const isDeletable = !transactions.some(t => t.accountId === account.id || t.toAccountId === account.id);

              return (
                <div key={account.id} className="w-full">
                   <AccountCard 
                     account={account} 
                     icon={Icon} 
                     typeLabel={ACCOUNT_TYPE_LABELS[account.type] || "Account"}
                     onDelete={() => deleteAccount(account.id)}
                     onEdit={() => setEditingAccount(account)}
                     isDeletable={isDeletable}
                   />
                </div>
              );
            })}
          </div>
        </>
      )}

      <AdaptiveOverlay isOpen={!!editingAccount} onClose={() => setEditingAccount(null)} title="Edit Account">
        {editingAccount && (
          <AccountForm 
            initialData={editingAccount} 
            onSuccess={() => setEditingAccount(null)} 
          />
        )}
      </AdaptiveOverlay>
    </div>
  );
}
