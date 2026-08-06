"use client";

import React from "react";
import { motion } from "framer-motion";
import { FinancialInsight } from "@/lib/analytics/engine";
import { 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  Zap, 
  Info, 
  CheckCircle2 
} from "lucide-react";

interface AnalyticsInsightsProps {
  insights: FinancialInsight[];
}

export function AnalyticsInsights({ insights }: AnalyticsInsightsProps) {
  if (!insights || insights.length === 0) {
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-border)] flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-400/20 text-emerald-400 border border-emerald-500/40">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
            Balanced Financial Health
          </h4>
          <p className="text-[11px] text-gray-400 font-bold">
            No unusual spending spikes or critical cash flow anomalies detected for this period.
          </p>
        </div>
      </div>
    );
  }

  const getInsightStyle = (type: FinancialInsight["type"]) => {
    switch (type) {
      case "positive":
        return {
          icon: TrendingUp,
          border: "border-emerald-500/60",
          bg: "bg-emerald-500/10",
          iconBg: "bg-emerald-400 text-black",
          badge: "bg-emerald-400/20 text-emerald-400 border-emerald-500",
        };
      case "spike":
        return {
          icon: Zap,
          border: "border-amber-500/60",
          bg: "bg-amber-500/10",
          iconBg: "bg-amber-400 text-black",
          badge: "bg-amber-400/20 text-amber-400 border-amber-500",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          border: "border-rose-500/60",
          bg: "bg-rose-500/10",
          iconBg: "bg-rose-400 text-black",
          badge: "bg-rose-500/20 text-rose-400 border-rose-500",
        };
      case "info":
      default:
        return {
          icon: Info,
          border: "border-[var(--color-border)]",
          bg: "bg-[var(--color-surfaceHover)]",
          iconBg: "bg-blue-400 text-black",
          badge: "bg-blue-400/20 text-blue-400 border-blue-500",
        };
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="p-1 rounded-lg bg-[var(--color-primary)] text-black border border-black/20">
          <Sparkles className="w-3.5 h-3.5 stroke-[2.5px]" />
        </span>
        <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
          Smart Financial Insights & Anomalies
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map((insight, idx) => {
          const style = getInsightStyle(insight.type);
          const Icon = style.icon;

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              className={`p-3.5 rounded-2xl border-2 ${style.border} ${style.bg} shadow-sm space-y-2 flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 ${style.iconBg}`}>
                    <Icon className="w-3.5 h-3.5 stroke-[2.5px]" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[var(--color-text)] truncate">
                    {insight.title}
                  </h4>
                </div>

                {insight.metric && (
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border font-numbers shrink-0 ${style.badge}`}
                  >
                    {insight.metric}
                  </span>
                )}
              </div>

              <p className="text-[11px] font-bold text-gray-400 leading-relaxed">
                {insight.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
