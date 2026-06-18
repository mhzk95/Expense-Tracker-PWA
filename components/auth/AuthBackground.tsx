"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AuthBackground() {
  const shouldReduceMotion = useReducedMotion();

  // If user prefers reduced motion, render static background
  if (shouldReduceMotion) {
    return (
      <div className="fixed inset-0 z-0 bg-slate-950 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-indigo-950/20 to-slate-950" />
        <div className="absolute top-[20%] left-[10%] w-[60vw] h-[60vw] rounded-full bg-violet-600/5 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 bg-slate-950 overflow-hidden pointer-events-none">
      {/* Deep gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/40 to-slate-950" />

      {/* Aurora / Flowing organic meshes */}
      <motion.div
        className="absolute -top-[10%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent mix-blend-screen filter blur-[140px]"
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute top-[30%] -right-[20%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-bl from-rose-500/5 via-violet-500/5 to-transparent mix-blend-screen filter blur-[160px]"
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute -bottom-[20%] left-[15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-amber-500/5 via-orange-500/5 to-transparent mix-blend-screen filter blur-[130px]"
        animate={{
          x: [0, 30, -30, 0],
          y: [0, 50, -20, 0],
          scale: [1, 1.2, 0.95, 1],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Subtly moving light bloom focus */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(2,6,23,0.6))] z-[1]" />
    </div>
  );
}
