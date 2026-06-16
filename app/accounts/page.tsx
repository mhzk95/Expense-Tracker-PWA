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
import { Building2, CreditCard, PiggyBank, TrendingUp, Trash2, Wallet } from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { AddAccountAction } from "@/components/accounts/AddAccountAction";
import { SwipeToDelete } from "@/components/ui/SwipeToDelete";
import { AccountCard } from "@/components/accounts/AccountCard";
import { AdaptiveOverlay } from "@/components/ui/AdaptiveOverlay";
import { AccountForm } from "@/components/accounts/AccountForm";

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
          <div className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-violet-950/60 to-slate-900/60 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Net Worth</p>
                <p className="text-3xl font-bold text-white mt-0.5">{formatCurrency(netWorth)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/40">
              <div>
                <p className="text-xs text-slate-500">Total Assets</p>
                <p className="text-lg font-semibold text-emerald-400 mt-0.5">{formatCurrency(totalAssets)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Liabilities</p>
                <p className="text-lg font-semibold text-red-400 mt-0.5">{formatCurrency(totalLiabilities)}</p>
              </div>
            </div>
          </div>

          {/* Account cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
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
