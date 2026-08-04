"use client";

/**
 * Accounts page — Bank accounts, cards, and wallets overview.
 * Standardized Neo-Brutalist design, default account switcher, and interactive details.
 */

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, vibrate } from "@/lib/utils/helpers";
import { 
  Building2, CreditCard, PiggyBank, TrendingUp, TrendingDown, 
  Wallet, Landmark, Coins, Banknote, DollarSign, ArrowLeftRight, Star
} from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { AddAccountAction } from "@/components/accounts/AddAccountAction";
import { AccountCard } from "@/components/accounts/AccountCard";
import { AccountDetailSheet } from "@/components/accounts/AccountDetailSheet";
import { AdaptiveOverlay } from "@/components/ui/AdaptiveOverlay";
import { AccountForm } from "@/components/accounts/AccountForm";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { Card } from "@/components/ui/Card";
import { AccountEntity } from "@/lib/db/indexeddb";

const ACCOUNT_ICONS: Record<string, any> = {
  Building2,
  CreditCard,
  PiggyBank,
  Wallet,
  Landmark,
  Coins,
  Banknote,
  DollarSign,
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: "Checking Account",
  savings: "Savings Account",
  credit_card: "Credit Card",
  investment: "Investment",
  cash: "Cash in Hand",
  loan: "Loan / Debt",
  wallet: "Digital Wallet",
  other: "Other",
};

export default function AccountsPage() {
  const { accounts, loading, deleteAccount, setDefaultAccount } = useAccounts();
  const { transactions } = useTransactions();
  
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [selectedDetailAccount, setSelectedDetailAccount] = useState<AccountEntity | null>(null);
  const [editingAccount, setEditingAccount] = useState<AccountEntity | null>(null);
  const [transferSourceAccount, setTransferSourceAccount] = useState<AccountEntity | null>(null);

  // Net Worth calculations
  const totalAssets = useMemo(() => {
    return accounts
      .filter((a) => a.balance > 0 && a.includeInNetWorth && !a.excludeFromNetWorth)
      .reduce((s, a) => s + a.balance, 0);
  }, [accounts]);

  const totalLiabilities = useMemo(() => {
    return Math.abs(
      accounts
        .filter((a) => a.balance < 0 && a.includeInNetWorth && !a.excludeFromNetWorth)
        .reduce((s, a) => s + a.balance, 0)
    );
  }, [accounts]);

  const netWorth = totalAssets - totalLiabilities;
  const assetRatio = totalAssets + totalLiabilities > 0 
    ? Math.round((totalAssets / (totalAssets + totalLiabilities)) * 100) 
    : 100;

  // Pre-calculate monthly stats per account
  const accountMonthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const stats: Record<string, { income: number; expense: number; count: number }> = {};

    accounts.forEach((acc) => {
      stats[acc.id] = { income: 0, expense: 0, count: 0 };
    });

    transactions.forEach((t) => {
      if (t.isDeleted) return;
      const txDate = new Date(t.date);
      const isCurrentMonth = txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;

      if (t.accountId && stats[t.accountId]) {
        if (isCurrentMonth) {
          stats[t.accountId].count++;
          if (t.type === "income") stats[t.accountId].income += t.amount;
          else if (t.type === "expense") stats[t.accountId].expense += t.amount;
          else if (t.type === "transfer") stats[t.accountId].expense += t.amount;
        }
      }

      if (t.type === "transfer" && t.toAccountId && stats[t.toAccountId]) {
        if (isCurrentMonth) {
          stats[t.toAccountId].count++;
          stats[t.toAccountId].income += t.amount;
        }
      }
    });

    return stats;
  }, [accounts, transactions]);

  // Filter accounts by type tabs
  const filteredAccounts = useMemo(() => {
    if (selectedTab === "all") return accounts;
    if (selectedTab === "banking") return accounts.filter((a) => a.type === "checking" || a.type === "savings");
    if (selectedTab === "credit") return accounts.filter((a) => a.type === "credit_card" || a.type === "loan");
    if (selectedTab === "wallets") return accounts.filter((a) => a.type === "wallet" || a.type === "cash");
    if (selectedTab === "investments") return accounts.filter((a) => a.type === "investment");
    return accounts;
  }, [accounts, selectedTab]);

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Accounts"
        subtitle={loading ? "Loading..." : `${accounts.length} connected accounts`}
        action={<AddAccountAction />}
      />

      {loading ? (
        <div className="p-10 text-center font-bold text-gray-500">Loading accounts...</div>
      ) : accounts.length === 0 ? (
        <EmptyState
          title="No accounts yet"
          description="Add your first bank account, card, or wallet to track your net worth and cash flow."
          action={<AddAccountAction />}
        />
      ) : (
        <>
          {/* Net Worth Hero Card */}
          <Card 
            variant="surface" 
            className="p-5 border-2 border-[var(--color-border)] shadow-brutal-base"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Total Net Worth
                </p>
                <h2 className="text-3xl sm:text-4xl font-black font-numbers tabular-nums tracking-tight mt-1 text-[var(--color-text)]">
                  {netWorth < 0 ? "-" : ""}{formatCurrency(Math.abs(netWorth))}
                </h2>
              </div>

              <span className={`inline-flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-xl border-2 border-[var(--color-border)] uppercase tracking-wider ${
                netWorth >= 0 ? "bg-emerald-400 text-black" : "bg-rose-400 text-black"
              }`}>
                {netWorth >= 0 ? "Solvent" : "Debt Heavy"}
              </span>
            </div>

            {/* Asset vs Liability Ratio Bar */}
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-gray-500">
                <span className="text-emerald-500">Assets ({assetRatio}%)</span>
                <span className="text-rose-500">Liabilities ({100 - assetRatio}%)</span>
              </div>
              <div className="h-3 w-full bg-[var(--color-bg)] rounded-full overflow-hidden border-2 border-[var(--color-border)] flex">
                <div 
                  className="h-full bg-emerald-400 transition-all duration-500" 
                  style={{ width: `${assetRatio}%` }} 
                />
                <div 
                  className="h-full bg-rose-400 transition-all duration-500" 
                  style={{ width: `${100 - assetRatio}%` }} 
                />
              </div>
            </div>
          </Card>

          {/* 2-Column Assets & Liabilities Summary */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Card 
              variant="surface" 
              className="p-4 border-2 border-[var(--color-border)] shadow-brutal-sm"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg border-2 border-[var(--color-border)] bg-emerald-500/10 text-emerald-500">
                  <TrendingUp className="h-4 w-4 stroke-[3px]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Assets</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-numbers tabular-nums text-emerald-500 tracking-tight">
                {formatCurrency(totalAssets)}
              </p>
            </Card>

            <Card 
              variant="surface" 
              className="p-4 border-2 border-[var(--color-border)] shadow-brutal-sm"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg border-2 border-[var(--color-border)] bg-rose-500/10 text-rose-500">
                  <TrendingDown className="h-4 w-4 stroke-[3px]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Liabilities</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-numbers tabular-nums text-rose-500 tracking-tight">
                {formatCurrency(totalLiabilities)}
              </p>
            </Card>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: `All (${accounts.length})` },
              { id: "banking", label: "Bank & Savings" },
              { id: "credit", label: "Cards & Loans" },
              { id: "wallets", label: "Cash & Wallets" },
              { id: "investments", label: "Investments" },
            ].map((tab) => {
              const isActive = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    vibrate([10]);
                    setSelectedTab(tab.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2 flex-shrink-0 ${
                    isActive
                      ? "bg-[var(--color-primary)] text-black border-[var(--color-border)] shadow-brutal-sm"
                      : "bg-[var(--color-surface)] text-gray-500 border-transparent hover:border-[var(--color-border)]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredAccounts.map((account) => {
              const Icon = (account.icon && ACCOUNT_ICONS[account.icon]) || Building2;
              const isDeletable = !transactions.some(
                (t) => !t.isDeleted && (t.accountId === account.id || t.toAccountId === account.id)
              );
              const stats = accountMonthlyStats[account.id] || { income: 0, expense: 0, count: 0 };

              return (
                <div key={account.id} className="w-full">
                  <AccountCard 
                    account={account} 
                    icon={Icon} 
                    typeLabel={ACCOUNT_TYPE_LABELS[account.type] || "Account"}
                    onDelete={() => deleteAccount(account.id)}
                    onEdit={() => setEditingAccount(account)}
                    onSetDefault={() => setDefaultAccount(account.id)}
                    onTransfer={() => setTransferSourceAccount(account)}
                    onClick={() => setSelectedDetailAccount(account)}
                    isDeletable={isDeletable}
                    monthlyIncome={stats.income}
                    monthlyExpense={stats.expense}
                    transactionCount={stats.count}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Account Detail Sheet */}
      <AccountDetailSheet
        account={selectedDetailAccount}
        isOpen={!!selectedDetailAccount}
        onClose={() => setSelectedDetailAccount(null)}
        onEdit={(acc) => {
          setSelectedDetailAccount(null);
          setEditingAccount(acc);
        }}
        onDelete={(acc) => {
          setSelectedDetailAccount(null);
          deleteAccount(acc.id);
        }}
        onSetDefault={(accId) => setDefaultAccount(accId)}
        onQuickTransfer={(acc) => {
          setSelectedDetailAccount(null);
          setTransferSourceAccount(acc);
        }}
        isDeletable={
          selectedDetailAccount
            ? !transactions.some(
                (t) => !t.isDeleted && (t.accountId === selectedDetailAccount.id || t.toAccountId === selectedDetailAccount.id)
              )
            : false
        }
      />

      {/* Edit Account Modal */}
      <AdaptiveOverlay 
        isOpen={!!editingAccount} 
        onClose={() => setEditingAccount(null)} 
        title="Edit Account"
      >
        {editingAccount && (
          <AccountForm 
            initialData={editingAccount} 
            onSuccess={() => setEditingAccount(null)} 
          />
        )}
      </AdaptiveOverlay>

      {/* Quick Transfer Modal */}
      <AdaptiveOverlay
        isOpen={!!transferSourceAccount}
        onClose={() => setTransferSourceAccount(null)}
        title="Transfer Funds"
      >
        {transferSourceAccount && (
          <TransactionForm
            editingTransaction={{
              id: crypto.randomUUID(),
              type: "transfer",
              amount: 0,
              currency: "INR",
              description: "Transfer",
              accountId: transferSourceAccount.id,
              date: new Date().toISOString(),
              isDeleted: false,
            }}
            onSuccess={() => setTransferSourceAccount(null)}
          />
        )}
      </AdaptiveOverlay>
    </div>
  );
}

