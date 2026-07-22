"use client";

import { useTransactions } from "@/hooks/useTransactions";
import { useMemo } from "react";
import { formatCurrency } from "@/lib/utils/helpers";
import { Card } from "@/components/ui/Card";

export function SpendingHeatmap() {
  const { transactions, loading } = useTransactions();
  
  const { weeks, maxAmount } = useMemo(() => {
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
     
     const formattedData = Array.from(map.entries()).map(([date, amount]) => ({ date, amount }));
     const calculatedMax = Math.max(...formattedData.map(d => d.amount), 1);
     
     const computedWeeks = [];
     for (let i = 0; i < formattedData.length; i += 7) {
       computedWeeks.push(formattedData.slice(i, i + 7));
     }
     
     return { weeks: computedWeeks, maxAmount: calculatedMax };
  }, [transactions]);
  
  if (loading) {
    return (
      <Card variant="surface" className="p-4 sm:p-5 border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-success,#10b981)] animate-pulse">
        <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-dashed border-[var(--color-border)]">
          <div className="h-3 w-48 bg-[var(--color-border)] rounded-full" />
        </div>
        <div className="w-full overflow-hidden h-28 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl flex items-center justify-center">
          <div className="flex gap-[4px]">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="flex flex-col gap-[4px]">
                {[...Array(7)].map((_, j) => (
                  <div key={j} className="w-[14px] h-[14px] rounded-sm bg-[var(--color-border)]" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }
  
  const getColor = (amount: number) => {
    if (amount === 0) return "bg-gray-100 border-gray-300";
    const intensity = amount / maxAmount;
    if (intensity < 0.2) return "bg-emerald-300 border-[var(--color-border)]";
    if (intensity < 0.5) return "bg-emerald-400 border-[var(--color-border)]";
    if (intensity < 0.8) return "bg-emerald-500 border-[var(--color-border)]";
    return "bg-emerald-600 border-[var(--color-border)]";
  };
  
  return (
    <Card variant="surface" className="p-4 sm:p-5 border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-success,#10b981)] transition-all overflow-hidden relative">
      <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-dashed border-[var(--color-border)]">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 leading-none">Spending Heatmap (Last 365 Days)</h3>
      </div>
      
      <div className="w-full overflow-x-auto pb-4 pt-2 scrollbar-thin scrollbar-thumb-black scrollbar-track-transparent">
        <div className="flex gap-[4px] min-w-max pr-4">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-[4px]">
              {week.map((day) => (
                <div 
                  key={day.date}
                  className={`w-[14px] h-[14px] rounded-sm border-[1.5px] ${getColor(day.amount)} transition-all hover:scale-150 hover:z-10`}
                  title={`${new Date(day.date).toLocaleDateString()}: ${formatCurrency(day.amount)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end items-center gap-3 mt-4 text-sm text-[var(--color-text)] font-bold tracking-wide uppercase">
        <span>Less</span>
        <div className="flex gap-[4px]">
          <div className="w-[14px] h-[14px] rounded-sm border-[1.5px] bg-gray-100 border-gray-300" />
          <div className="w-[14px] h-[14px] rounded-sm border-[1.5px] bg-emerald-300 border-[var(--color-border)]" />
          <div className="w-[14px] h-[14px] rounded-sm border-[1.5px] bg-emerald-400 border-[var(--color-border)]" />
          <div className="w-[14px] h-[14px] rounded-sm border-[1.5px] bg-emerald-500 border-[var(--color-border)]" />
          <div className="w-[14px] h-[14px] rounded-sm border-[1.5px] bg-emerald-600 border-[var(--color-border)]" />
        </div>
        <span>More</span>
      </div>
    </Card>
  );
}
