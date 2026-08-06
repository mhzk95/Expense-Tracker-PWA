"use client";

import React from "react";
import { motion } from "framer-motion";
import { SplitAnalyticsSummary } from "@/lib/analytics/engine";
import { formatCurrency, vibrate, getInitials } from "@/lib/utils/helpers";
import { Users, CheckCircle2, Clock, ArrowUpRight } from "lucide-react";

interface SplitRecoveryAnalyticsProps {
  splits: SplitAnalyticsSummary;
  onSelectSplitFriend?: (friendName: string) => void;
}

export function SplitRecoveryAnalytics({
  splits,
  onSelectSplitFriend,
}: SplitRecoveryAnalyticsProps) {
  const {
    totalGroupExpensesOutlay,
    totalYourNetShare,
    totalFriendsShare,
    totalRecovered,
    totalPendingReceivables,
    recoveryPercentage,
    unsettledFriendsCount,
    receivablesByFriend,
  } = splits;

  const handleFriendClick = (friendName: string) => {
    vibrate([15]);
    if (onSelectSplitFriend) {
      onSelectSplitFriend(friendName);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-border)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-blue-400 text-black border border-black/20">
              <Users className="w-3.5 h-3.5 stroke-[2.5px]" />
            </span>
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
              Split Expenses & Debt Recovery
            </h3>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            Group outlays, friend receivables, and settlement progress
          </p>
        </div>

        <span
          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
            totalPendingReceivables === 0
              ? "bg-emerald-400/20 border-emerald-500 text-emerald-400"
              : "bg-amber-400/20 border-amber-500 text-amber-400"
          }`}
        >
          {totalPendingReceivables === 0 ? "All Clear" : `${unsettledFriendsCount} Unsettled`}
        </span>
      </div>

      {totalFriendsShare === 0 ? (
        <div className="py-8 text-center text-gray-400 font-black uppercase text-xs">
          No group split expenses recorded in this period.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Recovery Stats Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-[var(--color-bg)] border-2 border-[var(--color-border)]">
              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">
                Total Group Outlay
              </span>
              <span className="text-sm font-display font-black text-[var(--color-text)]">
                {formatCurrency(totalGroupExpensesOutlay)}
              </span>
              <span className="text-[8px] font-bold text-gray-500 block mt-0.5">
                Your share: {formatCurrency(totalYourNetShare)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-bg)] border-2 border-[var(--color-border)]">
              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">
                Recovered / Paid Back
              </span>
              <span className="text-sm font-display font-black text-emerald-400">
                {formatCurrency(totalRecovered)}
              </span>
              <span className="text-[8px] font-bold text-gray-500 block mt-0.5">
                {recoveryPercentage.toFixed(0)}% recovery rate
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-bg)] border-2 border-[var(--color-border)]">
              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">
                Pending Receivables
              </span>
              <span className="text-sm font-display font-black text-amber-400">
                {formatCurrency(totalPendingReceivables)}
              </span>
              <span className="text-[8px] font-bold text-gray-500 block mt-0.5">
                From {unsettledFriendsCount} participant(s)
              </span>
            </div>
          </div>

          {/* Recovery Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-gray-400">
              <span>Settlement Progress</span>
              <span className="font-numbers">{recoveryPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${recoveryPercentage}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full"
              />
            </div>
          </div>

          {/* Friend by Friend Breakdown */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block">
              Participant Debt Status
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {receivablesByFriend.map((friend) => (
                <motion.div
                  key={friend.participantName}
                  onClick={() => handleFriendClick(friend.participantName)}
                  whileHover={{ scale: 1.01 }}
                  className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    friend.isFullySettled
                      ? "bg-[var(--color-bg)] border-[var(--color-border)] opacity-80"
                      : "bg-[var(--color-bg)] border-amber-500/60 shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[10px] font-black text-[var(--color-primary)] shrink-0">
                      {getInitials(friend.participantName)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text)] truncate block">
                        {friend.participantName}
                      </span>
                      <span className="text-[9px] font-bold text-gray-500">
                        {friend.txCount} split txns · Total {formatCurrency(friend.totalOwed)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {friend.isFullySettled ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-400/15 text-emerald-400 border border-emerald-500/40">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Settled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400/15 text-amber-400 border border-amber-500/40 font-numbers">
                        <Clock className="w-2.5 h-2.5" />
                        Owes {formatCurrency(friend.pendingAmount)}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
