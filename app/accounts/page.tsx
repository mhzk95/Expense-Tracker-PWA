"use client";

/**
 * Accounts page — Bank accounts, cards, and wallets overview.
 * Phase 7: Live IndexedDB data.
 */

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils/helpers";
import { cn } from "@/lib/utils/helpers";
import { Building2, CreditCard, PiggyBank, TrendingUp, Trash2 } from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { AddAccountAction } from "@/components/accounts/AddAccountAction";

const ACCOUNT_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Building2,
  CreditCard,
  PiggyBank,
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

  const totalAssets = accounts.filter((a) => a.balance > 0 && a.includeInNetWorth)
    .reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = Math.abs(
    accounts.filter((a) => a.balance < 0 && a.includeInNetWorth)
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
          <div className="space-y-3">
            {accounts.map((account) => {
              const Icon = ACCOUNT_ICONS[account.icon ?? "Building2"] ?? Building2;
              const isNegative = account.balance < 0;
              // Add a generic type check for credit limit logic later if needed
              const isCreditCard = account.type === "credit_card";

              return (
                <div
                  key={account.id}
                  className="flex items-center gap-4 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 hover:border-slate-700/60 transition-all group"
                >
                  {/* Icon */}
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${account.color || '#6366f1'}18` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: account.color || '#6366f1' }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">{account.name}</p>
                      {account.isDefault && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">
                          Default
                        </span>
                      )}
                      {account.syncStatus === "pending" && (
                        <span className="text-[10px] text-violet-400 uppercase tracking-wider bg-violet-500/10 px-1 rounded">
                          Syncing
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {ACCOUNT_TYPE_LABELS[account.type] || "Account"}{account.institution ? ` · ${account.institution}` : ""}
                      {account.lastFour ? ` ···${account.lastFour}` : ""}
                    </p>
                  </div>

                  {/* Balance */}
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-base font-bold tabular-nums",
                        isNegative ? "text-red-400" : "text-white"
                      )}
                    >
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                    {isCreditCard && (
                      <p className="text-xs text-slate-500 mt-0.5">Credit Card</p>
                    )}
                  </div>
                  
                  {/* Delete Action */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button 
                      onClick={() => deleteAccount(account.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
