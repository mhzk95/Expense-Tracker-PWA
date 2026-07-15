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
          <div className="bg-[var(--color-primary)] border-[3px] sm:border-[4px] border-black rounded-[24px] p-6 sm:p-8 shadow-[6px_6px_0px_0px_#000]">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 rounded-2xl bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-black stroke-[3px]" />
              </div>
              <div>
                <p className="text-xs font-black text-black/80 uppercase tracking-widest">Net Worth</p>
                <p className="text-4xl sm:text-5xl font-black text-white mt-1 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] tracking-tight">{formatCurrency(netWorth)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-5 border-t-[4px] border-black/20">
              <div>
                <p className="text-[11px] font-black text-black/80 uppercase tracking-widest">Total Assets</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-300 mt-1 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] tracking-tight">{formatCurrency(totalAssets)}</p>
              </div>
              <div>
                <p className="text-[11px] font-black text-black/80 uppercase tracking-widest">Total Liabilities</p>
                <p className="text-xl sm:text-2xl font-black text-red-300 mt-1 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] tracking-tight">{formatCurrency(totalLiabilities)}</p>
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
