"use client";

import { useTransactions } from "@/hooks/useTransactions";
import { useMemo } from "react";
import { formatCurrency } from "@/lib/utils/helpers";
import { GlassCard } from "@/components/ui/GlassCard";

export function SpendingHeatmap() {
  const { transactions } = useTransactions();
  
  const data = useMemo(() => {
     const map = new Map<string, number>();
     
     const today = new Date();
     const start = new Date();
     start.setDate(today.getDate() - 364);
     
     for (let i = 0; i < 365; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        map.set(d.toISOString().split('T')[0], 0);
     }
     
     transactions.forEach(t => {
        if (t.type !== "expense") return;
        const dateStr = t.date.split('T')[0];
        if (map.has(dateStr)) {
           map.set(dateStr, map.get(dateStr)! + t.amount);
        }
     });
     
     return Array.from(map.entries()).map(([date, amount]) => ({ date, amount }));
  }, [transactions]);
  
  const maxAmount = Math.max(...data.map(d => d.amount), 1);
  
  const getColor = (amount: number) => {
    if (amount === 0) return "bg-slate-800/40";
    const intensity = amount / maxAmount;
    if (intensity < 0.2) return "bg-violet-900/60";
    if (intensity < 0.5) return "bg-violet-700";
    if (intensity < 0.8) return "bg-violet-500";
    return "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.5)]";
  };
  
  const weeks = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Spending Heatmap (Last 365 Days)</h3>
      </div>
      
      <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="flex gap-[3px] min-w-max pr-4">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-[3px]">
              {week.map((day, dIdx) => (
                <div 
                  key={day.date}
                  className={`w-3 h-3 rounded-[2px] ${getColor(day.amount)} transition-all hover:scale-150 hover:z-10`}
                  title={`${new Date(day.date).toLocaleDateString()}: ${formatCurrency(day.amount)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end items-center gap-2 mt-2 text-xs text-slate-500 font-medium tracking-wide">
        <span>Less</span>
        <div className="flex gap-[3px]">
          <div className="w-3 h-3 rounded-[2px] bg-slate-800/40" />
          <div className="w-3 h-3 rounded-[2px] bg-violet-900/60" />
          <div className="w-3 h-3 rounded-[2px] bg-violet-700" />
          <div className="w-3 h-3 rounded-[2px] bg-violet-500" />
          <div className="w-3 h-3 rounded-[2px] bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.5)]" />
        </div>
        <span>More</span>
      </div>
    </GlassCard>
  );
}
