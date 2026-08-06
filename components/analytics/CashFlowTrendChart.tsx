"use client";

import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TimeSeriesPoint } from "@/lib/analytics/engine";
import { formatCurrency, vibrate } from "@/lib/utils/helpers";
import { TrendingUp, Activity, Layers } from "lucide-react";

interface CashFlowTrendChartProps {
  data: TimeSeriesPoint[];
  onSelectPoint?: (point: TimeSeriesPoint) => void;
}

type ChartMode = "net" | "split" | "cumulative";

export function CashFlowTrendChart({ data, onSelectPoint }: CashFlowTrendChartProps) {
  const [chartMode, setChartMode] = useState<ChartMode>("net");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 35, left: 20 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales and bounds based on mode
  const { points, minVal, maxVal, zeroY } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], minVal: 0, maxVal: 1, zeroY: height / 2 };
    }

    let min = 0;
    let max = 1;

    if (chartMode === "net") {
      const netValues = data.map((d) => d.net);
      min = Math.min(...netValues, 0);
      max = Math.max(...netValues, 100);
    } else if (chartMode === "split") {
      const allVals = data.flatMap((d) => [d.income, d.expense]);
      min = 0;
      max = Math.max(...allVals, 100);
    } else {
      // cumulative
      const cumVals = data.map((d) => d.cumulativeNet);
      min = Math.min(...cumVals, 0);
      max = Math.max(...cumVals, 100);
    }

    // Add buffer
    const range = max - min || 1;
    const bufferedMin = min < 0 ? min - range * 0.05 : 0;
    const bufferedMax = max + range * 0.05;
    const totalRange = bufferedMax - bufferedMin || 1;

    const scaleY = (val: number) => {
      return padding.top + chartHeight - ((val - bufferedMin) / totalRange) * chartHeight;
    };

    const scaleX = (index: number) => {
      if (data.length <= 1) return padding.left + chartWidth / 2;
      return padding.left + (index / (data.length - 1)) * chartWidth;
    };

    const zero = scaleY(0);

    const mapped = data.map((d, i) => ({
      ...d,
      x: scaleX(i),
      yNet: scaleY(d.net),
      yIncome: scaleY(d.income),
      yExpense: scaleY(d.expense),
      yCumulative: scaleY(d.cumulativeNet),
    }));

    return { points: mapped, minVal: bufferedMin, maxVal: bufferedMax, zeroY: zero };
  }, [data, chartMode, chartWidth, chartHeight, padding.top, padding.left, height]);

  // Smooth SVG Path builder using Catmull-Rom or Cubic Beziers
  const generateSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const current = pts[i];
      const next = pts[i + 1];
      const controlX = (current.x + next.x) / 2;
      path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }
    return path;
  };

  // Build specific paths
  const netLinePath = useMemo(() => {
    return generateSmoothPath(points.map((p) => ({ x: p.x, y: p.yNet })));
  }, [points]);

  const netAreaPath = useMemo(() => {
    if (points.length === 0) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${netLinePath} L ${last.x} ${zeroY} L ${first.x} ${zeroY} Z`;
  }, [points, netLinePath, zeroY]);

  const incomeLinePath = useMemo(() => {
    return generateSmoothPath(points.map((p) => ({ x: p.x, y: p.yIncome })));
  }, [points]);

  const expenseLinePath = useMemo(() => {
    return generateSmoothPath(points.map((p) => ({ x: p.x, y: p.yExpense })));
  }, [points]);

  const cumulativeLinePath = useMemo(() => {
    return generateSmoothPath(points.map((p) => ({ x: p.x, y: p.yCumulative })));
  }, [points]);

  const cumulativeAreaPath = useMemo(() => {
    if (points.length === 0) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${cumulativeLinePath} L ${last.x} ${zeroY} L ${first.x} ${zeroY} Z`;
  }, [points, cumulativeLinePath, zeroY]);

  // Handle touch/mouse scrubber
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const normalizedX = (clientX / rect.width) * width;

    // Find nearest point
    let closestIdx = 0;
    let minDistance = Infinity;

    points.forEach((p, idx) => {
      const dist = Math.abs(p.x - normalizedX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    if (closestIdx !== hoverIndex) {
      setHoverIndex(closestIdx);
    }
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  const handlePointClick = (idx: number) => {
    vibrate([15]);
    if (onSelectPoint && points[idx]) {
      onSelectPoint(points[idx]);
    }
  };

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-border)] relative overflow-hidden space-y-4">
      {/* Header & Mode Switches */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-dashed border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-[var(--color-primary)] text-black border border-black/20">
              <Activity className="w-3.5 h-3.5 stroke-[2.5px]" />
            </span>
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
              Cash Flow Trendline & Wave
            </h3>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            Interactive liquidity & velocity over time
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-0.5 bg-[var(--color-bg)] border-2 border-[var(--color-border)] rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              vibrate([10]);
              setChartMode("net");
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              chartMode === "net"
                ? "bg-[var(--color-primary)] text-black shadow-sm"
                : "text-gray-400 hover:text-[var(--color-text)]"
            }`}
          >
            Net Wave
          </button>
          <button
            type="button"
            onClick={() => {
              vibrate([10]);
              setChartMode("split");
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              chartMode === "split"
                ? "bg-[var(--color-primary)] text-black shadow-sm"
                : "text-gray-400 hover:text-[var(--color-text)]"
            }`}
          >
            In vs Out
          </button>
          <button
            type="button"
            onClick={() => {
              vibrate([10]);
              setChartMode("cumulative");
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              chartMode === "cumulative"
                ? "bg-[var(--color-primary)] text-black shadow-sm"
                : "text-gray-400 hover:text-[var(--color-text)]"
            }`}
          >
            Cumulative
          </button>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={() => hoverIndex !== null && handlePointClick(hoverIndex)}
        className="relative w-full h-56 sm:h-64 select-none touch-none cursor-crosshair"
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Net Positive Gradient */}
            <linearGradient id="netPositiveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Inflow Gradient */}
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Outflow Gradient */}
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>

            {/* Cumulative Gradient */}
            <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={width - padding.right}
            y2={padding.top}
            stroke="currentColor"
            strokeDasharray="4 4"
            className="text-[var(--color-border)] opacity-30"
          />
          <line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            className="text-[var(--color-border)] opacity-70"
          />
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="currentColor"
            strokeDasharray="4 4"
            className="text-[var(--color-border)] opacity-30"
          />

          {/* Mode 1: Net Cash Flow Wave */}
          {chartMode === "net" && (
            <>
              <motion.path
                d={netAreaPath}
                fill="url(#netPositiveGrad)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
              <motion.path
                d={netLinePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </>
          )}

          {/* Mode 2: Inflow vs Outflow Dual Curves */}
          {chartMode === "split" && (
            <>
              {/* Income Area & Line */}
              <motion.path
                d={`${incomeLinePath} L ${points[points.length - 1]?.x || 0} ${height - padding.bottom} L ${points[0]?.x || 0} ${height - padding.bottom} Z`}
                fill="url(#incomeGrad)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
              <motion.path
                d={incomeLinePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8 }}
              />

              {/* Expense Area & Line */}
              <motion.path
                d={`${expenseLinePath} L ${points[points.length - 1]?.x || 0} ${height - padding.bottom} L ${points[0]?.x || 0} ${height - padding.bottom} Z`}
                fill="url(#expenseGrad)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
              <motion.path
                d={expenseLinePath}
                fill="none"
                stroke="#ef4444"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8 }}
              />
            </>
          )}

          {/* Mode 3: Cumulative Net Curve */}
          {chartMode === "cumulative" && (
            <>
              <motion.path
                d={cumulativeAreaPath}
                fill="url(#cumGrad)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
              <motion.path
                d={cumulativeLinePath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8 }}
              />
            </>
          )}

          {/* Data Points on Line */}
          {points.map((p, idx) => {
            const targetY =
              chartMode === "net"
                ? p.yNet
                : chartMode === "split"
                ? p.yExpense
                : p.yCumulative;
            const isHovered = hoverIndex === idx;

            return (
              <g key={p.key}>
                <circle
                  cx={p.x}
                  cy={targetY}
                  r={isHovered ? 6 : 3.5}
                  className={`transition-all ${
                    isHovered
                      ? "fill-[var(--color-primary)] stroke-black stroke-2"
                      : "fill-[var(--color-surface)] stroke-[var(--color-border)] stroke-2"
                  }`}
                />
              </g>
            );
          })}

          {/* Active Magnetic Scrubber Line */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={padding.top}
              x2={activePoint.x}
              y2={height - padding.bottom}
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          )}

          {/* X Axis Date Labels */}
          {points
            .filter((_, i) => i === 0 || i === Math.floor(points.length / 2) || i === points.length - 1)
            .map((p) => (
              <text
                key={p.key}
                x={p.x}
                y={height - 10}
                textAnchor="middle"
                className="text-[10px] font-black uppercase tracking-wider fill-gray-400 font-sans"
              >
                {p.label}
              </text>
            ))}
        </svg>

        {/* Floating Scrubber Tooltip */}
        <AnimatePresence>
          {activePoint && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-20 pointer-events-none bg-[var(--color-bg)] border-2 border-[var(--color-border)] rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[160px]"
              style={{
                left: `${Math.min(Math.max(10, (activePoint.x / width) * 100), 80)}%`,
                top: "10px",
              }}
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-1">
                <span className="font-black uppercase tracking-wider text-[var(--color-text)]">
                  {activePoint.label}
                </span>
                <span className="text-[10px] font-bold text-gray-500">
                  {activePoint.transactionCount} txns
                </span>
              </div>

              <div className="space-y-1 font-bold text-[11px]">
                <div className="flex items-center justify-between text-emerald-500">
                  <span>Income</span>
                  <span className="font-numbers tabular-nums font-black">
                    +{formatCurrency(activePoint.income)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-rose-500">
                  <span>Expense</span>
                  <span className="font-numbers tabular-nums font-black">
                    -{formatCurrency(activePoint.expense)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border)] text-[var(--color-text)] font-black">
                  <span>Net Flow</span>
                  <span
                    className={`font-numbers tabular-nums ${
                      activePoint.net >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {activePoint.net >= 0 ? "+" : ""}
                    {formatCurrency(activePoint.net)}
                  </span>
                </div>
              </div>

              <p className="text-[9px] font-bold text-amber-400 text-center uppercase tracking-widest pt-0.5">
                Click to inspect details
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-[11px] font-black uppercase tracking-wider text-gray-400">
        {chartMode === "net" && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-emerald-500" />
            <span>Net Positive Inflow</span>
          </div>
        )}
        {chartMode === "split" && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-emerald-500" />
              <span>Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-rose-500" />
              <span>Expense</span>
            </div>
          </>
        )}
        {chartMode === "cumulative" && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-amber-400" />
            <span>Cumulative Liquid Growth</span>
          </div>
        )}
      </div>
    </div>
  );
}
