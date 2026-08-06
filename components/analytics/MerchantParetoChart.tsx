"use client";

import React from "react";
import { motion } from "framer-motion";
import { MerchantAnalyticsItem } from "@/lib/analytics/engine";
import { formatCurrency, vibrate, getInitials } from "@/lib/utils/helpers";
import { Store, ArrowUpRight, ReceiptText } from "lucide-react";

interface MerchantParetoChartProps {
  merchants: MerchantAnalyticsItem[];
  totalSpent: number;
  onSelectMerchant?: (merchant: MerchantAnalyticsItem) => void;
}

export function MerchantParetoChart({
  merchants,
  totalSpent,
  onSelectMerchant,
}: MerchantParetoChartProps) {
  const handleMerchantClick = (merchant: MerchantAnalyticsItem) => {
    vibrate([15]);
    if (onSelectMerchant) {
      onSelectMerchant(merchant);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-border)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-400 text-black border border-black/20">
              <Store className="w-3.5 h-3.5 stroke-[2.5px]" />
            </span>
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
              Top Merchants & Payees
            </h3>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            Highest concentration of outlays (Pareto 80/20)
          </p>
        </div>

        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-gray-400">
          Top {merchants.length}
        </span>
      </div>

      {merchants.length === 0 ? (
        <div className="py-8 text-center text-gray-400 font-black uppercase text-xs">
          No merchant data recorded in this period.
        </div>
      ) : (
        <div className="space-y-2">
          {merchants.map((merchant, idx) => (
            <motion.div
              key={merchant.name}
              onClick={() => handleMerchantClick(merchant)}
              whileHover={{ scale: 1.01 }}
              className="p-2.5 rounded-xl bg-[var(--color-bg)] border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[10px] font-black text-[var(--color-primary)] shrink-0">
                    {getInitials(merchant.name)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text)] truncate block">
                      {merchant.name}
                    </span>
                    {merchant.topCategoryName && (
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                        {merchant.topCategoryName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-display font-black text-[var(--color-text)]">
                    {formatCurrency(merchant.amount)}
                  </span>
                  <span className="text-[9px] font-black text-amber-400 font-numbers block">
                    {merchant.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${merchant.percentage}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-emerald-400 to-[var(--color-primary)] rounded-full"
                  />
                </div>
                <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                  <span>{merchant.txCount} orders · Avg {formatCurrency(merchant.avgAmount)}</span>
                  <span className="text-[var(--color-primary)] group-hover:underline flex items-center gap-0.5">
                    Inspect <ArrowUpRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
