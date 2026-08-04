"use client";

import { motion } from "framer-motion";

export type SplitAnimationVariant = "splitting-coin" | "twin-moons" | "slice-beam" | "equalizer";

interface SplitIndicatorProps {
  variant?: SplitAnimationVariant;
  isSettled?: boolean;
  className?: string;
}

/**
 * Variant 1: The Splitting Coin
 * Two sleek coin halves that separate, rotate, and snap back with an electric spark.
 */
export function SplittingCoinIndicator({ isSettled = false, className = "" }: { isSettled?: boolean; className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center w-6 h-6 select-none ${className}`}>
      <svg viewBox="0 0 24 24" className="w-5 h-5 overflow-visible" fill="none">
        {/* Left Coin Half */}
        <motion.path
          d="M 11 3 A 9 9 0 0 0 11 21 L 11 3 Z"
          fill={isSettled ? "#10b981" : "#f59e0b"}
          animate={
            isSettled
              ? { x: 0, rotate: 0 }
              : {
                  x: [0, -3.5, 0],
                  rotate: [0, -12, 0],
                }
          }
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Right Coin Half */}
        <motion.path
          d="M 13 3 L 13 21 A 9 9 0 0 0 13 3 Z"
          fill={isSettled ? "#10b981" : "#fbbf24"}
          animate={
            isSettled
              ? { x: 0, rotate: 0 }
              : {
                  x: [0, 3.5, 0],
                  rotate: [0, 12, 0],
                }
          }
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Electric Spark / Pulse between halves when apart */}
        {!isSettled && (
          <motion.line
            x1="12"
            y1="6"
            x2="12"
            y2="18"
            stroke="#fef08a"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            animate={{
              opacity: [0, 1, 0],
              scaleY: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Subtle center split line when joined */}
        <line x1="12" y1="3" x2="12" y2="21" stroke="#000" strokeWidth="1" strokeOpacity="0.4" />
      </svg>

      {/* Outer subtle glow */}
      <span
        className={`absolute -inset-1 rounded-full opacity-20 blur-[3px] pointer-events-none ${
          isSettled ? "bg-emerald-400" : "bg-amber-400"
        }`}
      />
    </div>
  );
}

/**
 * Variant 2: Twin Moon Orbit
 * Orbiting amber and emerald particles that circle around the category icon.
 */
export function TwinMoonsOrbit({ isSettled = false, children }: { isSettled?: boolean; children: React.ReactNode }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      {children}

      {/* Orbit Track Container */}
      <div className="absolute -inset-1.5 pointer-events-none">
        {/* Moon 1 (Amber) */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <div
            className={`w-2 h-2 rounded-full border border-black/40 shadow-sm ${
              isSettled ? "bg-emerald-400" : "bg-amber-400 shadow-[0_0_8px_#f59e0b]"
            }`}
            style={{ transform: "translateY(-140%)" }}
          />
        </motion.div>

        {/* Moon 2 (Emerald) - 180 deg offset */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full bg-emerald-400 border border-black/40 shadow-[0_0_6px_#10b981]"
            style={{ transform: "translateY(140%)" }}
          />
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Variant 3: The Slice Beam
 * Diagonal cut-ribbon tag on the top-right corner with a laser sweep.
 */
export function SliceBeamTag({ isSettled = false }: { isSettled?: boolean }) {
  return (
    <div className="absolute top-0 right-0 overflow-hidden w-10 h-10 pointer-events-none select-none z-20">
      {/* Diagonal Tag */}
      <div
        className={`absolute top-[4px] -right-[18px] w-14 py-[2px] rotate-45 text-center text-[7px] font-black uppercase tracking-widest border border-black/40 shadow-sm ${
          isSettled
            ? "bg-emerald-400 text-black border-emerald-500"
            : "bg-amber-400 text-black border-amber-500"
        }`}
      >
        <span className="relative z-10">SPLIT</span>

        {/* Laser Sweep Beam */}
        {!isSettled && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Variant 4: Neon Frequency Equalizer
 * 3 micro frequency bars dancing next to the amount.
 */
export function EqualizerIndicator({ isSettled = false, className = "" }: { isSettled?: boolean; className?: string }) {
  return (
    <div className={`inline-flex items-end gap-[2px] h-4 select-none ${className}`}>
      {[
        { maxH: 14, minH: 4, duration: 1.2, delay: 0 },
        { maxH: 16, minH: 6, duration: 0.9, delay: 0.2 },
        { maxH: 12, minH: 3, duration: 1.4, delay: 0.4 },
      ].map((bar, i) => (
        <motion.div
          key={i}
          className={`w-[2.5px] rounded-full border-[0.5px] border-black/20 ${
            isSettled
              ? "bg-emerald-400"
              : i === 1
              ? "bg-amber-400 shadow-[0_0_4px_#f59e0b]"
              : "bg-orange-400"
          }`}
          animate={
            isSettled
              ? { height: 10 }
              : {
                  height: [bar.minH, bar.maxH, bar.minH],
                }
          }
          transition={
            isSettled
              ? {}
              : {
                  duration: bar.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: bar.delay,
                }
          }
        />
      ))}
    </div>
  );
}

/**
 * Unified Split Indicator Component
 */
export function SplitIndicator({
  variant = "splitting-coin",
  isSettled = false,
  className = "",
}: SplitIndicatorProps) {
  switch (variant) {
    case "splitting-coin":
      return <SplittingCoinIndicator isSettled={isSettled} className={className} />;
    case "slice-beam":
      return <SliceBeamTag isSettled={isSettled} />;
    case "equalizer":
      return <EqualizerIndicator isSettled={isSettled} className={className} />;
    default:
      return <SplittingCoinIndicator isSettled={isSettled} className={className} />;
  }
}
