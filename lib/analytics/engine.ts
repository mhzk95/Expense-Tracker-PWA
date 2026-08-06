/**
 * Comprehensive Analytics Engine for ExpenseTracker
 * Pure analytical calculation functions for multi-dimensional financial intelligence.
 */

import { TransactionEntity, CategoryEntity, AccountEntity } from "@/lib/db/indexeddb";

export type TimeRangeKey = 
  | "7D" 
  | "30D" 
  | "THIS_MONTH" 
  | "LAST_MONTH" 
  | "3M" 
  | "6M" 
  | "YTD" 
  | "1Y" 
  | "ALL" 
  | "CUSTOM";

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

export interface TimeSeriesPoint {
  key: string;
  label: string;
  date: string;
  income: number;
  expense: number;
  net: number;
  cumulativeExpense: number;
  cumulativeNet: number;
  transactionCount: number;
}

export interface CategoryAnalyticsItem {
  id: string;
  name: string;
  color: string;
  icon?: string;
  amount: number;
  percentage: number;
  txCount: number;
  avgTxAmount: number;
  prevAmount: number;
  changePercent: number;
}

export interface MerchantAnalyticsItem {
  name: string;
  amount: number;
  percentage: number;
  txCount: number;
  avgAmount: number;
  topCategoryName?: string;
  topCategoryColor?: string;
}

export interface DayOfWeekAnalytics {
  dayName: string; // "Mon", "Tue", etc.
  dayIndex: number; // 0 = Sun, 1 = Mon ...
  amount: number;
  percentage: number;
  txCount: number;
}

export interface SplitReceivableItem {
  participantName: string;
  totalOwed: number;
  totalSettled: number;
  pendingAmount: number;
  txCount: number;
  isFullySettled: boolean;
}

export interface SplitAnalyticsSummary {
  totalGroupExpensesOutlay: number;
  totalYourNetShare: number;
  totalFriendsShare: number;
  totalRecovered: number;
  totalPendingReceivables: number;
  recoveryPercentage: number;
  unsettledFriendsCount: number;
  receivablesByFriend: SplitReceivableItem[];
}

export interface FinancialInsight {
  id: string;
  type: "positive" | "warning" | "info" | "spike";
  title: string;
  description: string;
  metric?: string;
  categoryOrMerchant?: string;
}

export interface AnalyticsSummary {
  // Date Ranges
  currentRange: DateRange;
  prevRange: DateRange;
  daysInPeriod: number;

  // Primary Totals
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  savingsRate: number; // percentage (0 - 100 or negative)
  txCount: number;

  // Previous Period Comparison
  prevIncome: number;
  prevExpenses: number;
  prevNetCashFlow: number;
  prevSavingsRate: number;
  incomeGrowthPercent: number;
  expenseGrowthPercent: number;
  netCashFlowDelta: number;

  // Velocity & Averages
  dailyAverageExpense: number;
  dailyAverageIncome: number;
  avgTransactionSize: number;
  projectedMonthEndExpense?: number;

  // Multi-Dimensional Breakdowns
  timeSeries: TimeSeriesPoint[];
  categories: CategoryAnalyticsItem[];
  merchants: MerchantAnalyticsItem[];
  dayOfWeek: DayOfWeekAnalytics[];
  splits: SplitAnalyticsSummary;
  insights: FinancialInsight[];
}

/**
 * Calculates start and end Date objects for a selected TimeRangeKey.
 */
export function getTimeRangeDates(
  key: TimeRangeKey, 
  customStart?: Date, 
  customEnd?: Date
): { current: DateRange; previous: DateRange } {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  let currentStart = new Date(todayEnd);
  let currentEnd = new Date(todayEnd);
  let prevStart = new Date(todayEnd);
  let prevEnd = new Date(todayEnd);
  let label = "Custom Period";

  switch (key) {
    case "7D": {
      label = "Last 7 Days";
      currentStart = new Date(todayEnd);
      currentStart.setDate(todayEnd.getDate() - 6);
      currentStart.setHours(0, 0, 0, 0);

      const durationMs = currentEnd.getTime() - currentStart.getTime();
      prevEnd = new Date(currentStart.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - durationMs);
      break;
    }
    case "30D": {
      label = "Last 30 Days";
      currentStart = new Date(todayEnd);
      currentStart.setDate(todayEnd.getDate() - 29);
      currentStart.setHours(0, 0, 0, 0);

      const durationMs = currentEnd.getTime() - currentStart.getTime();
      prevEnd = new Date(currentStart.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - durationMs);
      break;
    }
    case "THIS_MONTH": {
      label = "This Month";
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      currentEnd = new Date(todayEnd);

      // Previous month up to same day of month
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      prevStart = new Date(prevYear, prevMonth, 1, 0, 0, 0, 0);
      const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
      const matchDay = Math.min(now.getDate(), daysInPrevMonth);
      prevEnd = new Date(prevYear, prevMonth, matchDay, 23, 59, 59, 999);
      break;
    }
    case "LAST_MONTH": {
      label = "Last Month";
      const targetMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const targetYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      currentStart = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
      currentEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

      const priorMonth = targetMonth === 0 ? 11 : targetMonth - 1;
      const priorYear = targetMonth === 0 ? targetYear - 1 : targetYear;
      prevStart = new Date(priorYear, priorMonth, 1, 0, 0, 0, 0);
      prevEnd = new Date(priorYear, priorMonth + 1, 0, 23, 59, 59, 999);
      break;
    }
    case "3M": {
      label = "Last 3 Months";
      currentStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
      currentEnd = new Date(todayEnd);

      const durationMs = currentEnd.getTime() - currentStart.getTime();
      prevEnd = new Date(currentStart.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - durationMs);
      break;
    }
    case "6M": {
      label = "Last 6 Months";
      currentStart = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
      currentEnd = new Date(todayEnd);

      const durationMs = currentEnd.getTime() - currentStart.getTime();
      prevEnd = new Date(currentStart.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - durationMs);
      break;
    }
    case "YTD": {
      label = "Year to Date";
      currentStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      currentEnd = new Date(todayEnd);

      prevStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      const daysPassed = Math.floor((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
      prevEnd = new Date(prevStart);
      prevEnd.setDate(prevStart.getDate() + daysPassed);
      prevEnd.setHours(23, 59, 59, 999);
      break;
    }
    case "1Y": {
      label = "Last 12 Months";
      currentStart = new Date(todayEnd);
      currentStart.setFullYear(todayEnd.getFullYear() - 1);
      currentStart.setHours(0, 0, 0, 0);

      const durationMs = currentEnd.getTime() - currentStart.getTime();
      prevEnd = new Date(currentStart.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - durationMs);
      break;
    }
    case "ALL": {
      label = "All Time";
      currentStart = new Date(2020, 0, 1, 0, 0, 0, 0);
      currentEnd = new Date(todayEnd);
      prevStart = new Date(currentStart);
      prevEnd = new Date(currentStart);
      break;
    }
    case "CUSTOM": {
      label = "Custom Period";
      if (customStart && customEnd) {
        currentStart = new Date(customStart);
        currentStart.setHours(0, 0, 0, 0);
        currentEnd = new Date(customEnd);
        currentEnd.setHours(23, 59, 59, 999);
        const durationMs = currentEnd.getTime() - currentStart.getTime();
        prevEnd = new Date(currentStart.getTime() - 1);
        prevStart = new Date(prevEnd.getTime() - durationMs);
      }
      break;
    }
  }

  return {
    current: { start: currentStart, end: currentEnd, label },
    previous: { start: prevStart, end: prevEnd, label: "Previous Period" },
  };
}

/**
 * Calculates percentage variance: ((current - prev) / prev) * 100
 */
export function calculatePercentageChange(current: number, prev: number): number {
  if (prev === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - prev) / Math.abs(prev)) * 100).toFixed(1));
}

/**
 * Main analytics computation engine that processes raw transactions into full multi-dimensional metrics.
 */
export function computeAnalytics(
  transactions: TransactionEntity[],
  categories: CategoryEntity[],
  accounts: AccountEntity[],
  timeRangeKey: TimeRangeKey,
  customStart?: Date,
  customEnd?: Date,
  selectedCategoryIds?: string[],
  selectedAccountIds?: string[]
): AnalyticsSummary {
  const { current, previous } = getTimeRangeDates(timeRangeKey, customStart, customEnd);

  const startMs = current.start.getTime();
  const endMs = current.end.getTime();
  const prevStartMs = previous.start.getTime();
  const prevEndMs = previous.end.getTime();

  const daysInPeriod = Math.max(
    1,
    Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1
  );

  // Filter Active (Non-deleted) Transactions
  const activeTxns = transactions.filter((t) => !t.isDeleted);

  // Apply Category / Account Filters if present
  const filterPass = (t: TransactionEntity) => {
    if (selectedCategoryIds && selectedCategoryIds.length > 0) {
      if (!t.categoryId || !selectedCategoryIds.includes(t.categoryId)) return false;
    }
    if (selectedAccountIds && selectedAccountIds.length > 0) {
      const matchAccount = (t.accountId && selectedAccountIds.includes(t.accountId)) ||
        (t.toAccountId && selectedAccountIds.includes(t.toAccountId));
      if (!matchAccount) return false;
    }
    return true;
  };

  // Helper to extract effective expense amount (considering split net share)
  const getExpenseAmount = (t: TransactionEntity) => {
    return t.netAmount !== undefined ? t.netAmount : t.amount;
  };

  // Partition Current Period and Previous Period
  const currentPeriodTxns: TransactionEntity[] = [];
  const prevPeriodTxns: TransactionEntity[] = [];

  for (const t of activeTxns) {
    if (!filterPass(t)) continue;
    const txTime = new Date(t.date).getTime();
    if (txTime >= startMs && txTime <= endMs) {
      currentPeriodTxns.push(t);
    } else if (txTime >= prevStartMs && txTime <= prevEndMs) {
      prevPeriodTxns.push(t);
    }
  }

  // Primary Current Totals
  let totalIncome = 0;
  let totalExpenses = 0;
  let expenseTxCount = 0;

  for (const t of currentPeriodTxns) {
    if (t.type === "income") {
      totalIncome += t.amount;
    } else if (t.type === "expense") {
      totalExpenses += getExpenseAmount(t);
      expenseTxCount++;
    }
  }

  const netCashFlow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 
    ? Number((((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1)) 
    : totalExpenses > 0 ? -100 : 0;

  // Previous Period Totals
  let prevIncome = 0;
  let prevExpenses = 0;

  for (const t of prevPeriodTxns) {
    if (t.type === "income") {
      prevIncome += t.amount;
    } else if (t.type === "expense") {
      prevExpenses += getExpenseAmount(t);
    }
  }

  const prevNetCashFlow = prevIncome - prevExpenses;
  const prevSavingsRate = prevIncome > 0 
    ? Number((((prevIncome - prevExpenses) / prevIncome) * 100).toFixed(1)) 
    : prevExpenses > 0 ? -100 : 0;

  const incomeGrowthPercent = calculatePercentageChange(totalIncome, prevIncome);
  const expenseGrowthPercent = calculatePercentageChange(totalExpenses, prevExpenses);
  const netCashFlowDelta = netCashFlow - prevNetCashFlow;

  // Velocity & Averages
  const dailyAverageExpense = totalExpenses / daysInPeriod;
  const dailyAverageIncome = totalIncome / daysInPeriod;
  const avgTransactionSize = expenseTxCount > 0 ? totalExpenses / expenseTxCount : 0;

  // Month-end projection if looking at current month
  let projectedMonthEndExpense: number | undefined;
  if (timeRangeKey === "THIS_MONTH") {
    const now = new Date();
    const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = Math.max(1, now.getDate());
    projectedMonthEndExpense = (totalExpenses / currentDay) * daysInCurrentMonth;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Time Series Bucketing (Daily, Weekly, or Monthly)
  // ──────────────────────────────────────────────────────────────────────────
  const isDaily = daysInPeriod <= 35;
  const isWeekly = daysInPeriod > 35 && daysInPeriod <= 120;
  const bucketMap = new Map<string, { label: string; date: string; income: number; expense: number; count: number }>();

  // Pre-seed all intervals so chart curves are continuous
  if (isDaily) {
    const cursor = new Date(current.start);
    while (cursor <= current.end) {
      const key = cursor.toISOString().split("T")[0];
      const label = cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      bucketMap.set(key, { label, date: key, income: 0, expense: 0, count: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (isWeekly) {
    const cursor = new Date(current.start);
    let weekIndex = 1;
    while (cursor <= current.end) {
      const key = `W${weekIndex}_${cursor.toISOString().split("T")[0]}`;
      const label = `Wk ${weekIndex} (${cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
      bucketMap.set(key, { label, date: cursor.toISOString().split("T")[0], income: 0, expense: 0, count: 0 });
      cursor.setDate(cursor.getDate() + 7);
      weekIndex++;
    }
  } else {
    // Monthly
    const cursor = new Date(current.start.getFullYear(), current.start.getMonth(), 1);
    while (cursor <= current.end) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      const label = cursor.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      bucketMap.set(key, { label, date: key, income: 0, expense: 0, count: 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  // Populate time series buckets
  for (const t of currentPeriodTxns) {
    const d = new Date(t.date);
    let key = "";
    if (isDaily) {
      key = d.toISOString().split("T")[0];
    } else if (isWeekly) {
      // Find nearest week key
      const keys = Array.from(bucketMap.keys());
      const txTime = d.getTime();
      let bestKey = keys[0];
      for (const k of keys) {
        const bucketDateStr = bucketMap.get(k)!.date;
        if (new Date(bucketDateStr).getTime() <= txTime) {
          bestKey = k;
        }
      }
      key = bestKey;
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }

    if (bucketMap.has(key)) {
      const entry = bucketMap.get(key)!;
      if (t.type === "income") {
        entry.income += t.amount;
      } else if (t.type === "expense") {
        entry.expense += getExpenseAmount(t);
      }
      entry.count++;
    }
  }

  let runningCumulativeExpense = 0;
  let runningCumulativeNet = 0;
  const timeSeries: TimeSeriesPoint[] = Array.from(bucketMap.entries()).map(([key, data]) => {
    const net = data.income - data.expense;
    runningCumulativeExpense += data.expense;
    runningCumulativeNet += net;
    return {
      key,
      label: data.label,
      date: data.date,
      income: data.income,
      expense: data.expense,
      net,
      cumulativeExpense: runningCumulativeExpense,
      cumulativeNet: runningCumulativeNet,
      transactionCount: data.count,
    };
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Category Analytics
  // ──────────────────────────────────────────────────────────────────────────
  const categoryMap = new Map<string, { amount: number; txCount: number }>();
  for (const t of currentPeriodTxns) {
    if (t.type !== "expense") continue;
    const catId = t.categoryId || "unassigned";
    const existing = categoryMap.get(catId) || { amount: 0, txCount: 0 };
    existing.amount += getExpenseAmount(t);
    existing.txCount += 1;
    categoryMap.set(catId, existing);
  }

  // Previous period category map for trend delta
  const prevCategoryMap = new Map<string, number>();
  for (const t of prevPeriodTxns) {
    if (t.type !== "expense") continue;
    const catId = t.categoryId || "unassigned";
    prevCategoryMap.set(catId, (prevCategoryMap.get(catId) || 0) + getExpenseAmount(t));
  }

  const categoriesAnalytics: CategoryAnalyticsItem[] = Array.from(categoryMap.entries())
    .map(([catId, data]) => {
      const catInfo = categories.find((c) => c.id === catId);
      const prevAmount = prevCategoryMap.get(catId) || 0;
      return {
        id: catId,
        name: catInfo?.name || "Uncategorized",
        color: catInfo?.color || "#94a3b8",
        icon: catInfo?.icon,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        txCount: data.txCount,
        avgTxAmount: data.txCount > 0 ? data.amount / data.txCount : 0,
        prevAmount,
        changePercent: calculatePercentageChange(data.amount, prevAmount),
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Merchant / Payee Analytics (Pareto 80/20)
  // ──────────────────────────────────────────────────────────────────────────
  const merchantMap = new Map<string, { amount: number; txCount: number; categoryId?: string }>();
  for (const t of currentPeriodTxns) {
    if (t.type !== "expense") continue;
    const name = (t.payee || t.description || "Various Outlays").trim();
    const existing = merchantMap.get(name) || { amount: 0, txCount: 0, categoryId: t.categoryId };
    existing.amount += getExpenseAmount(t);
    existing.txCount += 1;
    merchantMap.set(name, existing);
  }

  const merchants: MerchantAnalyticsItem[] = Array.from(merchantMap.entries())
    .map(([name, data]) => {
      const catInfo = categories.find((c) => c.id === data.categoryId);
      return {
        name,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        txCount: data.txCount,
        avgAmount: data.txCount > 0 ? data.amount / data.txCount : 0,
        topCategoryName: catInfo?.name,
        topCategoryColor: catInfo?.color,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10); // Top 10 Merchants

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Day of Week Spending Pattern
  // ──────────────────────────────────────────────────────────────────────────
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayMap = [0, 1, 2, 3, 4, 5, 6].map((i) => ({
    dayName: dayNames[i],
    dayIndex: i,
    amount: 0,
    txCount: 0,
  }));

  for (const t of currentPeriodTxns) {
    if (t.type !== "expense") continue;
    const dayIdx = new Date(t.date).getDay();
    dayMap[dayIdx].amount += getExpenseAmount(t);
    dayMap[dayIdx].txCount += 1;
  }

  const dayOfWeek: DayOfWeekAnalytics[] = dayMap.map((d) => ({
    ...d,
    percentage: totalExpenses > 0 ? (d.amount / totalExpenses) * 100 : 0,
  }));

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Group Split & Debt Recovery Analytics
  // ──────────────────────────────────────────────────────────────────────────
  let totalGroupExpensesOutlay = 0;
  let totalYourNetShare = 0;
  let totalFriendsShare = 0;
  let totalRecovered = 0;
  let totalPendingReceivables = 0;
  const friendMap = new Map<string, { totalOwed: number; totalSettled: number; txCount: number }>();

  for (const t of currentPeriodTxns) {
    if (t.splits && t.splits.length > 0) {
      totalGroupExpensesOutlay += t.amount;
      const yourNet = t.netAmount !== undefined ? t.netAmount : t.amount;
      totalYourNetShare += yourNet;

      for (const p of t.splits) {
        const friendName = p.name || "Friend";
        const share = p.amount || 0;
        totalFriendsShare += share;
        if (p.isSettled) {
          totalRecovered += share;
        } else {
          totalPendingReceivables += share;
        }

        const friendStat = friendMap.get(friendName) || { totalOwed: 0, totalSettled: 0, txCount: 0 };
        friendStat.totalOwed += share;
        if (p.isSettled) {
          friendStat.totalSettled += share;
        }
        friendStat.txCount += 1;
        friendMap.set(friendName, friendStat);
      }
    }
  }

  const receivablesByFriend: SplitReceivableItem[] = Array.from(friendMap.entries()).map(
    ([participantName, stat]) => ({
      participantName,
      totalOwed: stat.totalOwed,
      totalSettled: stat.totalSettled,
      pendingAmount: stat.totalOwed - stat.totalSettled,
      txCount: stat.txCount,
      isFullySettled: stat.totalOwed - stat.totalSettled <= 0,
    })
  ).sort((a, b) => b.pendingAmount - a.pendingAmount);

  const recoveryPercentage = totalFriendsShare > 0
    ? (totalRecovered / totalFriendsShare) * 100
    : 100;

  const splitsSummary: SplitAnalyticsSummary = {
    totalGroupExpensesOutlay,
    totalYourNetShare,
    totalFriendsShare,
    totalRecovered,
    totalPendingReceivables,
    recoveryPercentage,
    unsettledFriendsCount: receivablesByFriend.filter((f) => !f.isFullySettled).length,
    receivablesByFriend,
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Automated Anomaly & Financial Insight Detection
  // ──────────────────────────────────────────────────────────────────────────
  const insights: FinancialInsight[] = [];

  // Insight 1: Savings Rate Health
  if (totalIncome > 0) {
    if (savingsRate >= 30) {
      insights.push({
        id: "savings_high",
        type: "positive",
        title: "Exceptional Savings Rate",
        description: `You saved ${savingsRate}% of your income this period. That's well above the standard 20% benchmark.`,
        metric: `${savingsRate}% saved`,
      });
    } else if (savingsRate < 0) {
      insights.push({
        id: "savings_deficit",
        type: "warning",
        title: "Cash Flow Deficit",
        description: `Expenses exceeded your recorded income by ₹${Math.abs(netCashFlow).toLocaleString("en-IN")}.`,
        metric: `₹${Math.abs(netCashFlow).toFixed(0)} deficit`,
      });
    }
  }

  // Insight 2: Weekend Spending Concentration
  const weekendSpend = dayMap[0].amount + dayMap[6].amount;
  const weekendPercentage = totalExpenses > 0 ? (weekendSpend / totalExpenses) * 100 : 0;
  if (weekendPercentage >= 45 && totalExpenses > 1000) {
    insights.push({
      id: "weekend_spike",
      type: "spike",
      title: "Weekend Spending Spike",
      description: `${Math.round(weekendPercentage)}% of your expenses occurred on Saturday & Sunday alone.`,
      metric: `${Math.round(weekendPercentage)}% on weekends`,
    });
  }

  // Insight 3: Category Surge (>25% increase)
  const surgingCategory = categoriesAnalytics.find(
    (c) => c.changePercent >= 25 && c.amount > 500 && c.prevAmount > 0
  );
  if (surgingCategory) {
    insights.push({
      id: `surge_${surgingCategory.id}`,
      type: "warning",
      title: `${surgingCategory.name} Surge`,
      description: `Spending in ${surgingCategory.name} rose by ${surgingCategory.changePercent}% compared to the prior period.`,
      metric: `+${surgingCategory.changePercent}%`,
      categoryOrMerchant: surgingCategory.name,
    });
  }

  // Insight 4: Top Merchant Share
  if (merchants.length > 0 && merchants[0].percentage >= 30 && merchants[0].amount > 500) {
    insights.push({
      id: `merchant_concentration`,
      type: "info",
      title: "High Merchant Outlay",
      description: `${merchants[0].name} accounts for ${Math.round(merchants[0].percentage)}% of your total expenditures.`,
      metric: `${Math.round(merchants[0].percentage)}% share`,
      categoryOrMerchant: merchants[0].name,
    });
  }

  // Insight 5: Pending Split Receivables
  if (totalPendingReceivables > 0) {
    insights.push({
      id: "split_debt",
      type: "info",
      title: "Pending Group Receivables",
      description: `You have ₹${totalPendingReceivables.toLocaleString("en-IN")} in unsettled split expenses across ${splitsSummary.unsettledFriendsCount} friend(s).`,
      metric: `₹${totalPendingReceivables.toFixed(0)} pending`,
    });
  }

  return {
    currentRange: current,
    prevRange: previous,
    daysInPeriod,
    totalIncome,
    totalExpenses,
    netCashFlow,
    savingsRate,
    txCount: currentPeriodTxns.length,
    prevIncome,
    prevExpenses,
    prevNetCashFlow,
    prevSavingsRate,
    incomeGrowthPercent,
    expenseGrowthPercent,
    netCashFlowDelta,
    dailyAverageExpense,
    dailyAverageIncome,
    avgTransactionSize,
    projectedMonthEndExpense,
    timeSeries,
    categories: categoriesAnalytics,
    merchants,
    dayOfWeek,
    splits: splitsSummary,
    insights,
  };
}
