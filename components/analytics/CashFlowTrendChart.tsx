"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TimeSeriesPoint } from "@/lib/analytics/engine";
import { formatCurrency, vibrate } from "@/lib/utils/helpers";
import { 
  TrendingUp, 
  Activity, 
  Layers, 
  Calendar,
  ArrowUpRight,
  Sparkles
} from "lucide-react";

type ChartMode = "net" | "dual" | "cumulative";

interface CashFlowTrendChartProps {
  data: TimeSeriesPoint[];
  onSelectPoint?: (point: TimeSeriesPoint) => void;
}

export function CashFlowTrendChart({ data, onSelectPoint }: CashFlowTrendChartProps) {
  const [mode, setMode] = useState<ChartMode>("net");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPointerDownRef = useRef(false);

  // Fallback / Normalized Data
  const points = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data;
  }, [data]);

  // Compute SVG dimensions and paths
  const width = 800;
  const height = 240;
  const padding = { top: 25, right: 30, bottom: 35, left: 30 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const {
    netPath,
    netAreaPath,
    incomePath,
    incomeAreaPath,
    expensePath,
    expenseAreaPath,
    cumulativePath,
    cumulativeAreaPath,
    mappedPoints,
    zeroY,
  } = useMemo(() => {
    if (points.length === 0) {
      return {
        netPath: "",
        netAreaPath: "",
        incomePath: "",
        incomeAreaPath: "",
        expensePath: "",
        expenseAreaPath: "",
        cumulativePath: "",
        cumulativeAreaPath: "",
        mappedPoints: [],
        zeroY: height / 2,
        minVal: 0,
        maxVal: 0,
      };
    }

    let min = 0;
    let max = 0;

    if (mode === "net") {
      min = Math.min(...points.map((p) => p.net), 0);
      max = Math.max(...points.map((p) => p.net), 100);
    } else if (mode === "dual") {
      const allVals = points.flatMap((p) => [p.income, p.expense]);
      min = 0;
      max = Math.max(...allVals, 100);
    } else {
      // Cumulative
      min = Math.min(...points.map((p) => p.cumulativeNet), 0);
      max = Math.max(...points.map((p) => p.cumulativeNet), 100);
    }

    const range = max - min || 1;

    const getY = (val: number) => {
      const normalized = (val - min) / range;
      return padding.top + chartHeight - normalized * chartHeight;
    };

    const mapped = points.map((p, idx) => {
      const x =
        points.length === 1
          ? width / 2
          : padding.left + (idx / (points.length - 1)) * chartWidth;
      const netY = getY(p.net);
      const incomeY = getY(p.income);
      const expenseY = getY(p.expense);
      const cumulativeY = getY(p.cumulativeNet);

      return {
        ...p,
        x,
        netY,
        incomeY,
        expenseY,
        cumulativeY,
        primaryY: mode === "net" ? netY : mode === "dual" ? expenseY : cumulativeY,
      };
    });

    const calculatedZeroY = getY(0);

    // Build smooth Catmull-Rom or cubic spline
    const buildSpline = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return "";
      if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
      if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

      let path = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = i > 0 ? pts[i - 1] : pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      return path;
    };

    const nPath = buildSpline(mapped.map((p) => ({ x: p.x, y: p.netY })));
    const iPath = buildSpline(mapped.map((p) => ({ x: p.x, y: p.incomeY })));
    const ePath = buildSpline(mapped.map((p) => ({ x: p.x, y: p.expenseY })));
    const cPath = buildSpline(mapped.map((p) => ({ x: p.x, y: p.cumulativeY })));

    const firstX = mapped[0]?.x || padding.left;
    const lastX = mapped[mapped.length - 1]?.x || width - padding.right;

    const nArea = nPath
      ? `${nPath} L ${lastX} ${calculatedZeroY} L ${firstX} ${calculatedZeroY} Z`
      : "";
    const iArea = iPath
      ? `${iPath} L ${lastX} ${calculatedZeroY} L ${firstX} ${calculatedZeroY} Z`
      : "";
    const eArea = ePath
      ? `${ePath} L ${lastX} ${calculatedZeroY} L ${firstX} ${calculatedZeroY} Z`
      : "";
    const cArea = cPath
      ? `${cPath} L ${lastX} ${calculatedZeroY} L ${firstX} ${calculatedZeroY} Z`
      : "";

    return {
      netPath: nPath,
      netAreaPath: nArea,
      incomePath: iPath,
      incomeAreaPath: iArea,
      expensePath: ePath,
      expenseAreaPath: eArea,
      cumulativePath: cPath,
      cumulativeAreaPath: cArea,
      mappedPoints: mapped,
      zeroY: calculatedZeroY,
      minVal: min,
      maxVal: max,
    };
  }, [points, mode, width, height, chartWidth, chartHeight, padding]);

  // Pointer & Touch Scrubber Logic
  const handlePointerAction = useCallback(
    (clientX: number) => {
      if (!containerRef.current || mappedPoints.length === 0) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, relativeX / rect.width));

      const svgX = padding.left + ratio * chartWidth;

      let closestIdx = 0;
      let closestDist = Infinity;
      mappedPoints.forEach((p, idx) => {
        const dist = Math.abs(p.x - svgX);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = idx;
        }
      });

      if (closestIdx !== activeIndex) {
        vibrate([10]);
        setActiveIndex(closestIdx);
      }
    },
    [mappedPoints, chartWidth, padding.left, activeIndex]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    isPointerDownRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    handlePointerAction(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPointerDownRef.current || e.pointerType === "mouse") {
      handlePointerAction(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isPointerDownRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const activePoint = activeIndex !== null ? mappedPoints[activeIndex] : null;

  return (
    <div className="p-3.5 sm:p-5 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-border)] space-y-3.5">
      {/* 1. Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-dashed border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-[var(--color-primary)] text-black border border-black/20 shrink-0">
              <Activity className="w-3.5 h-3.5 stroke-[2.5px]" />
            </span>
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
              Cash Flow Trendline
            </h3>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            Real-time trajectory & liquidity velocity
          </p>
        </div>

        {/* Mode Switcher Segmented Control */}
        <div className="flex items-center p-1 rounded-xl bg-[var(--color-bg)] border-2 border-[var(--color-border)] self-start sm:self-auto w-full sm:w-auto justify-between">
          {(
            [
              { id: "net", label: "Net Wave", icon: Activity },
              { id: "dual", label: "In vs Out", icon: Layers },
              { id: "cumulative", label: "Cumulative", icon: TrendingUp },
            ] as const
          ).map((t) => {
            const isTabActive = mode === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  vibrate([15]);
                  setMode(t.id);
                }}
                className={`relative px-2.5 sm:px-3 py-1 text-[11px] font-black uppercase tracking-wider transition-colors rounded-lg flex items-center justify-center gap-1.5 cursor-pointer min-h-[30px] flex-1 sm:flex-initial ${
                  isTabActive
                    ? "text-black font-black"
                    : "text-gray-400 hover:text-[var(--color-text)]"
                }`}
              >
                {isTabActive && (
                  <motion.div
                    layoutId="chartModeTab"
                    className="absolute inset-0 bg-[var(--color-primary)] rounded-lg border border-black/20 shadow-xs"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <t.icon className="w-3 h-3 relative z-10 shrink-0 stroke-[2.5px]" />
                <span className="relative z-10 text-[10px] sm:text-[11px] truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Scrubber HUD (Dynamic Real-Time Inspection Bar) */}
      <div className="p-2.5 sm:p-3 rounded-xl bg-[var(--color-bg)] border-2 border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 min-h-[48px]">
        {activePoint ? (
          <div className="flex flex-wrap items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="p-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-gray-400 shrink-0">
                <Calendar className="w-3 h-3" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text)] truncate">
                {activePoint.label}
              </span>
              <span className="text-[10px] font-bold text-gray-500">
                ({activePoint.transactionCount} txns)
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs font-black">
                {mode === "net" && (
                  <span
                    className={`font-display ${
                      activePoint.net >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {activePoint.net > 0 ? "+" : ""}
                    {formatCurrency(activePoint.net)}
                  </span>
                )}
                {mode === "dual" && (
                  <>
                    <span className="text-emerald-400 font-numbers">
                      +{formatCurrency(activePoint.income)}
                    </span>
                    <span className="text-gray-500">/</span>
                    <span className="text-rose-400 font-numbers">
                      -{formatCurrency(activePoint.expense)}
                    </span>
                  </>
                )}
                {mode === "cumulative" && (
                  <span
                    className={`font-display ${
                      activePoint.cumulativeNet >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatCurrency(activePoint.cumulativeNet)}
                  </span>
                )}
              </div>

              {onSelectPoint && (
                <button
                  type="button"
                  onClick={() => onSelectPoint(activePoint)}
                  className="px-2 py-1 rounded-md bg-[var(--color-primary)] text-black text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 hover:opacity-90 cursor-pointer shrink-0"
                >
                  Inspect <ArrowUpRight className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full text-gray-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Touch or drag across the trendline to scrub metrics
            </span>
            <span className="hidden sm:inline font-numbers">
              Range: {mappedPoints[0]?.label || "Start"} → {mappedPoints[mappedPoints.length - 1]?.label || "End"}
            </span>
          </div>
        )}
      </div>

      {/* 3. Main SVG Chart Canvas */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          if (!isPointerDownRef.current) setActiveIndex(null);
        }}
        className="relative w-full h-52 sm:h-64 select-none touch-none cursor-crosshair"
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#facc15" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#facc15" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="cumGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="var(--color-border)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Filled Spline Areas */}
          {mode === "net" && netAreaPath && (
            <motion.path
              d={netAreaPath}
              fill="url(#netGradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
          )}

          {mode === "dual" && (
            <>
              {incomeAreaPath && (
                <motion.path
                  d={incomeAreaPath}
                  fill="url(#incomeGradient)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                />
              )}
              {expenseAreaPath && (
                <motion.path
                  d={expenseAreaPath}
                  fill="url(#expenseGradient)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </>
          )}

          {mode === "cumulative" && cumulativeAreaPath && (
            <motion.path
              d={cumulativeAreaPath}
              fill="url(#cumGradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
          )}

          {/* Spline Stroke Lines */}
          {mode === "net" && netPath && (
            <motion.path
              d={netPath}
              fill="none"
              stroke="#facc15"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          )}

          {mode === "dual" && (
            <>
              {incomePath && (
                <motion.path
                  d={incomePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
              )}
              {expensePath && (
                <motion.path
                  d={expensePath}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
              )}
            </>
          )}

          {mode === "cumulative" && cumulativePath && (
            <motion.path
              d={cumulativePath}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          )}

          {/* Active Magnetic Scrubber Line & Cursor Halo */}
          {activePoint && (
            <g>
              {/* Vertical guideline */}
              <line
                x1={activePoint.x}
                y1={padding.top}
                x2={activePoint.x}
                y2={height - padding.bottom}
                stroke="var(--color-primary)"
                strokeWidth="2"
                strokeDasharray="3 3"
              />

              {/* Pulsing halo */}
              <circle
                cx={activePoint.x}
                cy={activePoint.primaryY}
                r="12"
                fill="var(--color-primary)"
                fillOpacity="0.25"
                className="animate-ping"
              />

              {/* Center point node */}
              <circle
                cx={activePoint.x}
                cy={activePoint.primaryY}
                r="6"
                fill="var(--color-primary)"
                stroke="#000"
                strokeWidth="2.5"
              />
            </g>
          )}

          {/* X Axis Labels */}
          {mappedPoints.map((p, idx) => {
            // Show at most ~6 labels to prevent collision on narrow viewports
            const step = Math.max(1, Math.floor(mappedPoints.length / 5));
            const isVisible = idx % step === 0 || idx === mappedPoints.length - 1;
            if (!isVisible) return null;

            return (
              <text
                key={p.date}
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                className="fill-gray-500 text-[10px] font-black uppercase tracking-wider"
              >
                {p.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
