"use client";

import { useMemo } from "react";
import { formatCurrency, vibrate } from "@/lib/utils/helpers";
import { Trash2, Edit3, Star, ArrowLeftRight, ShieldAlert, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { AccountEntity } from "@/lib/db/indexeddb";

interface AccountCardProps {
  account: AccountEntity;
  icon: any;
  typeLabel: string;
  onDelete: () => void;
  onEdit?: () => void;
  onSetDefault?: () => void;
  onTransfer?: () => void;
  onClick?: () => void;
  isDeletable?: boolean;
  monthlyIncome?: number;
  monthlyExpense?: number;
  transactionCount?: number;
}

export function AccountCard({ 
  account, 
  icon: Icon, 
  typeLabel, 
  onDelete, 
  onEdit, 
  onSetDefault,
  onTransfer,
  onClick,
  isDeletable = true,
  monthlyIncome = 0,
  monthlyExpense = 0,
  transactionCount = 0
}: AccountCardProps) {
  const baseColor = account.color || "#6366f1";
  const isCredit = account.type === "credit_card" || account.type === "loan";

  return (
    <Card
      variant="surface"
      isInteractive
      onClick={() => {
        vibrate([10]);
        onClick?.();
      }}
      className="group relative overflow-hidden text-left p-0 transition-all duration-200"
    >
      {/* Left Color Accent Bar */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-2.5 z-10"
        style={{ backgroundColor: baseColor }}
      />

      <div className="p-4 sm:p-5 pl-5 sm:pl-6 space-y-4">
        {/* Top Row: Icon + Names + Default Badge / Action */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-11 h-11 rounded-[12px] flex items-center justify-center border-2 border-[var(--color-border)] flex-shrink-0"
              style={{ backgroundColor: baseColor, color: "#fff" }}
            >
              <Icon className="w-5 h-5 stroke-[2.5px]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-[var(--color-text)] truncate">
                  {account.name}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 truncate">
                {account.institution && (
                  <span className="truncate">{account.institution}</span>
                )}
                {account.institution && <span>•</span>}
                <span>{typeLabel}</span>
                {account.lastFour && (
                  <span className="font-mono text-[10px] bg-[var(--color-bg)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">
                    •••• {account.lastFour}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Header Status: Default Badge or Make Default Button */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {account.isDefault ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-amber-400 text-black border-2 border-[var(--color-border)]">
                <Star className="w-3 h-3 fill-black" />
                Default
              </span>
            ) : onSetDefault ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  vibrate([15]);
                  onSetDefault();
                }}
                className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-[var(--color-surfaceHover)] rounded-lg border border-transparent hover:border-[var(--color-border)] transition-all"
                title="Set as Default Account"
              >
                <Star className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Balance Row */}
        <div className="flex items-end justify-between gap-3 pt-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              {isCredit ? "Outstanding Balance" : "Current Balance"}
            </p>
            <p className={`text-2xl sm:text-3xl font-black font-numbers tabular-nums tracking-tight mt-0.5 ${
              account.balance < 0 ? "text-rose-500" : isCredit ? "text-amber-500" : "text-[var(--color-text)]"
            }`}>
              {formatCurrency(account.balance, account.currency)}
            </p>
          </div>

          {account.excludeFromNetWorth && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              <ShieldAlert className="w-3 h-3" />
              Excluded
            </span>
          )}
        </div>

        {/* Footer Row: Monthly Flow Badges & Action Buttons */}
        <div className="pt-3 border-t-2 border-[var(--color-border)] flex items-center justify-between gap-2 flex-wrap">
          {/* Cashflow preview */}
          <div className="flex items-center gap-2 text-[10px] font-bold font-numbers tabular-nums">
            {monthlyIncome > 0 && (
              <span className="inline-flex items-center gap-0.5 text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <ArrowDownLeft className="w-3 h-3 stroke-[3px]" />
                +{formatCurrency(monthlyIncome, account.currency)}
              </span>
            )}
            {monthlyExpense > 0 && (
              <span className="inline-flex items-center gap-0.5 text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                <ArrowUpRight className="w-3 h-3 stroke-[3px]" />
                -{formatCurrency(monthlyExpense, account.currency)}
              </span>
            )}
            {transactionCount > 0 && monthlyIncome === 0 && monthlyExpense === 0 && (
              <span className="text-gray-500">
                {transactionCount} {transactionCount === 1 ? "txn" : "txns"}
              </span>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1 ml-auto">
            {onTransfer && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  vibrate([10]);
                  onTransfer();
                }}
                className="p-1.5 sm:px-2 sm:py-1 rounded-lg border-2 border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-surfaceHover)] text-blue-500 transition-all inline-flex items-center gap-1 text-[11px] font-bold"
                title="Quick Transfer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5px]" />
                <span className="hidden sm:inline">Transfer</span>
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  vibrate([10]);
                  onEdit();
                }}
                className="p-1.5 rounded-lg border-2 border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-surfaceHover)] text-gray-500 hover:text-[var(--color-text)] transition-all"
                title="Edit Account"
              >
                <Edit3 className="w-3.5 h-3.5 stroke-[2.5px]" />
              </button>
            )}

            {isDeletable && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  vibrate([30, 30]);
                  if (confirm(`Are you sure you want to delete "${account.name}"?`)) {
                    onDelete();
                  }
                }}
                className="p-1.5 rounded-lg border-2 border-transparent hover:border-red-500 hover:bg-red-100 dark:hover:bg-red-950/40 text-gray-400 hover:text-red-500 transition-all"
                title="Delete Account"
              >
                <Trash2 className="w-3.5 h-3.5 stroke-[2.5px]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
