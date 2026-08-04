"use client";

import { useMemo } from "react";
import { 
  Building2, CreditCard, PiggyBank, Wallet, Landmark, Coins, Banknote, 
  DollarSign, Star, ArrowLeftRight, Edit3, Trash2, ArrowUpRight, ArrowDownLeft,
  Calendar, MapPin, Tag, ExternalLink, ShieldCheck, ShieldAlert
} from "lucide-react";
import { AdaptiveOverlay } from "@/components/ui/AdaptiveOverlay";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDate, getCategoryIcon, vibrate } from "@/lib/utils/helpers";
import { AccountEntity, TransactionEntity } from "@/lib/db/indexeddb";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import Link from "next/link";

interface AccountDetailSheetProps {
  account: AccountEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (account: AccountEntity) => void;
  onDelete: (account: AccountEntity) => void;
  onSetDefault: (accountId: string) => void;
  onQuickTransfer: (account: AccountEntity) => void;
  isDeletable?: boolean;
}

const ICON_MAP_ACCOUNTS: Record<string, any> = {
  Building2,
  CreditCard,
  PiggyBank,
  Wallet,
  Landmark,
  Coins,
  Banknote,
  DollarSign,
};

export function AccountDetailSheet({
  account,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onSetDefault,
  onQuickTransfer,
  isDeletable = true,
}: AccountDetailSheetProps) {
  const { transactions } = useTransactions();
  const { categories } = useCategories();

  const accountTransactions = useMemo(() => {
    if (!account) return [];
    return transactions.filter(
      (t) => !t.isDeleted && (t.accountId === account.id || t.toAccountId === account.id)
    );
  }, [account, transactions]);

  const monthlyStats = useMemo(() => {
    if (!account) return { income: 0, expense: 0, net: 0, txCount: 0 };
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let income = 0;
    let expense = 0;
    let txCount = 0;

    for (const t of accountTransactions) {
      const txDate = new Date(t.date);
      if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
        txCount++;
        if (t.type === "income" && t.accountId === account.id) {
          income += t.amount;
        } else if (t.type === "expense" && t.accountId === account.id) {
          expense += t.amount;
        } else if (t.type === "transfer") {
          if (t.accountId === account.id) {
            expense += t.amount;
          }
          if (t.toAccountId === account.id) {
            income += t.amount;
          }
        }
      }
    }

    return {
      income,
      expense,
      net: income - expense,
      txCount,
    };
  }, [account, accountTransactions]);

  if (!account) return null;

  const IconComp = (account.icon && ICON_MAP_ACCOUNTS[account.icon]) || Building2;
  const isCredit = account.type === "credit_card" || account.type === "loan";
  const baseColor = account.color || "#6366f1";

  const getAccountTypeDisplay = (type: string) => {
    switch (type) {
      case "checking":
        return "Checking / Bank";
      case "savings":
        return "Savings";
      case "credit_card":
        return "Credit Card";
      case "wallet":
        return "Digital Wallet";
      case "cash":
        return "Cash in Hand";
      case "investment":
        return "Investment";
      case "loan":
        return "Loan";
      default:
        return type;
    }
  };

  return (
    <AdaptiveOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Account Details"
    >
      <div className="space-y-5 pb-6">
        {/* Hero Card */}
        <div 
          className="relative overflow-hidden rounded-[20px] border-2 border-[var(--color-border)] p-5 text-[var(--color-text)] bg-[var(--color-surface)] shadow-brutal-sm"
        >
          {/* Top color bar */}
          <div 
            className="absolute top-0 left-0 right-0 h-2"
            style={{ backgroundColor: baseColor }}
          />

          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-[14px] flex items-center justify-center border-2 border-[var(--color-border)] flex-shrink-0"
                style={{ backgroundColor: baseColor, color: "#fff" }}
              >
                <IconComp className="w-6 h-6 stroke-[2.5px]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black uppercase tracking-tight text-[var(--color-text)]">
                    {account.name}
                  </h2>
                  {account.isDefault && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-400 text-black border border-[var(--color-border)]">
                      <Star className="w-2.5 h-2.5 fill-black" />
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mt-0.5">
                  {account.institution && (
                    <span>{account.institution}</span>
                  )}
                  {account.institution && <span>•</span>}
                  <span className="capitalize">{getAccountTypeDisplay(account.type)}</span>
                  {account.lastFour && (
                    <span className="font-mono bg-[var(--color-bg)] px-1.5 py-0.5 rounded border border-[var(--color-border)] text-[10px]">
                      •••• {account.lastFour}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Balance Display */}
          <div className="mt-5 pt-4 border-t-2 border-[var(--color-border)] flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                {isCredit ? "Outstanding Balance" : "Available Balance"}
              </p>
              <p className={`text-3xl font-black font-numbers tabular-nums tracking-tight mt-0.5 ${
                account.balance < 0 ? "text-rose-500" : isCredit ? "text-amber-500" : "text-[var(--color-text)]"
              }`}>
                {formatCurrency(account.balance, account.currency)}
              </p>
            </div>

            {account.excludeFromNetWorth ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <ShieldAlert className="w-3 h-3" />
                Excluded from Net Worth
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <ShieldCheck className="w-3 h-3" />
                Included in Net Worth
              </span>
            )}
          </div>

          {/* Account Memo if available */}
          {account.notes && (
            <div className="mt-3 p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] text-xs font-medium text-[var(--color-text)]">
              <span className="font-bold text-[10px] uppercase tracking-wider block text-gray-500 mb-0.5">Notes</span>
              {account.notes}
            </div>
          )}
        </div>

        {/* Monthly Activity Breakdown */}
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-text)] px-1">
            This Month&apos;s Activity
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            <Card variant="surface" className="p-3">
              <div className="flex items-center gap-1 text-emerald-500 mb-1">
                <ArrowDownLeft className="w-3.5 h-3.5 stroke-[3px]" />
                <span className="text-[9px] font-black uppercase tracking-wider">Money In</span>
              </div>
              <p className="text-sm sm:text-base font-black font-numbers tabular-nums text-emerald-500">
                +{formatCurrency(monthlyStats.income, account.currency)}
              </p>
            </Card>

            <Card variant="surface" className="p-3">
              <div className="flex items-center gap-1 text-rose-500 mb-1">
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[3px]" />
                <span className="text-[9px] font-black uppercase tracking-wider">Money Out</span>
              </div>
              <p className="text-sm sm:text-base font-black font-numbers tabular-nums text-rose-500">
                -{formatCurrency(monthlyStats.expense, account.currency)}
              </p>
            </Card>

            <Card variant="surface" className="p-3">
              <div className="flex items-center gap-1 text-gray-500 mb-1">
                <Calendar className="w-3.5 h-3.5 stroke-[2.5px]" />
                <span className="text-[9px] font-black uppercase tracking-wider">Net Flow</span>
              </div>
              <p className={`text-sm sm:text-base font-black font-numbers tabular-nums ${
                monthlyStats.net >= 0 ? "text-emerald-500" : "text-rose-500"
              }`}>
                {monthlyStats.net >= 0 ? "+" : ""}{formatCurrency(monthlyStats.net, account.currency)}
              </p>
            </Card>
          </div>
        </div>

        {/* Action Controls Grid */}
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-text)] px-1">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {!account.isDefault && (
              <Button
                onClick={() => {
                  vibrate([15]);
                  onSetDefault(account.id);
                }}
                variant="secondary"
                size="sm"
                className="gap-1.5 justify-center py-2.5"
              >
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Make Default
              </Button>
            )}

            <Button
              onClick={() => {
                vibrate([15]);
                onQuickTransfer(account);
              }}
              variant="secondary"
              size="sm"
              className="gap-1.5 justify-center py-2.5"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />
              Transfer
            </Button>

            <Button
              onClick={() => {
                vibrate([15]);
                onEdit(account);
              }}
              variant="secondary"
              size="sm"
              className="gap-1.5 justify-center py-2.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </Button>

            {isDeletable && (
              <Button
                onClick={() => {
                  vibrate([30, 30]);
                  if (confirm(`Are you sure you want to delete "${account.name}"?`)) {
                    onDelete(account);
                  }
                }}
                variant="danger"
                size="sm"
                className="gap-1.5 justify-center py-2.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-text)]">
              Account Transactions ({accountTransactions.length})
            </h3>
            {accountTransactions.length > 0 && (
              <Link 
                href={`/transactions?accountId=${account.id}`}
                onClick={onClose}
                className="text-[11px] font-black uppercase tracking-wider text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
              >
                View All
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>

          {accountTransactions.length === 0 ? (
            <div className="p-6 text-center bg-[var(--color-surface)] border-2 border-dashed border-[var(--color-border)] rounded-2xl">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                No transactions recorded for this account yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 scrollbar-none">
              {accountTransactions.slice(0, 10).map((t) => {
                const category = categories.find((c) => c.id === t.categoryId);
                const CatIcon = getCategoryIcon(category?.icon);
                const isIncoming = t.type === "income" || (t.type === "transfer" && t.toAccountId === account.id);
                const isOutgoing = t.type === "expense" || (t.type === "transfer" && t.accountId === account.id);

                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl hover:bg-[var(--color-surfaceHover)] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="w-9 h-9 rounded-lg flex items-center justify-center border border-[var(--color-border)] flex-shrink-0 text-white"
                        style={{ backgroundColor: category?.color || "#94a3b8" }}
                      >
                        <CatIcon className="w-4 h-4 stroke-[2.5px]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-wider text-[var(--color-text)] truncate">
                          {t.payee || t.description || category?.name || "Transaction"}
                        </p>
                        <p className="text-[10px] font-bold text-gray-500">
                          {formatDate(t.date)} {t.type === "transfer" ? "• Transfer" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 ml-3">
                      <p className={`text-xs font-black font-numbers tabular-nums ${
                        isIncoming ? "text-emerald-500" : isOutgoing ? "text-rose-500" : "text-[var(--color-text)]"
                      }`}>
                        {isIncoming ? "+" : "-"}{formatCurrency(t.amount, account.currency)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdaptiveOverlay>
  );
}
