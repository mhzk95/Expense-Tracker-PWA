"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export type AmbientVariant = 'journal' | 'transactions' | 'research';

// Journal: Warm tones
const journalParticles = [
  { color: 'rgb(245, 158, 11)', opacity: 0.4, w: 40, h: 40, t: '80%', l: '20%', y: [0, -80, 40, -40, 0], x: [0, 50, -30, 60, 0], d: 25 },
  { color: 'rgb(249, 115, 22)', opacity: 0.3, w: 60, h: 60, t: '60%', l: '70%', y: [0, -120, 30, -60, 0], x: [0, -60, 40, -20, 0], d: 28 },
  { color: 'rgb(244, 63, 94)', opacity: 0.25, w: 30, h: 30, t: '40%', l: '40%', y: [0, -60, 20, -30, 0], x: [0, 40, -20, 50, 0], d: 22 },
  { color: 'rgb(234, 179, 8)', opacity: 0.35, w: 50, h: 50, t: '90%', l: '80%', y: [0, -100, 50, -80, 0], x: [0, -40, 60, -30, 0], d: 30 },
  { color: 'rgb(245, 158, 11)', opacity: 0.3, w: 80, h: 80, t: '20%', l: '10%', y: [0, 80, -40, 50, 0], x: [0, 70, -50, 40, 0], d: 35 },
  { color: 'rgb(249, 115, 22)', opacity: 0.4, w: 35, h: 35, t: '30%', l: '80%', y: [0, 60, -30, 40, 0], x: [0, -50, 30, -60, 0], d: 20 },
  { color: 'rgb(244, 63, 94)', opacity: 0.2, w: 70, h: 70, t: '70%', l: '30%', y: [0, -90, 60, -50, 0], x: [0, 80, -40, 70, 0], d: 32 },
  { color: 'rgb(234, 179, 8)', opacity: 0.3, w: 45, h: 45, t: '50%', l: '60%', y: [0, -70, 40, -20, 0], x: [0, -70, 50, -40, 0], d: 24 },
  { color: 'rgb(245, 158, 11)', opacity: 0.25, w: 55, h: 55, t: '10%', l: '50%', y: [0, 50, -60, 30, 0], x: [0, 40, -80, 50, 0], d: 27 },
  { color: 'rgb(249, 115, 22)', opacity: 0.35, w: 25, h: 25, t: '85%', l: '50%', y: [0, -50, 20, -40, 0], x: [0, -30, 20, -50, 0], d: 18 },
];

// Transactions: Cool financial growth tones
const txParticles = [
  { color: 'rgb(16, 185, 129)', opacity: 0.25, w: 120, h: 120, t: '10%', l: '10%', y: [0, 50, -20, 30, 0], x: [0, 40, -30, 20, 0], d: 35 },
  { color: 'rgb(59, 130, 246)', opacity: 0.2, w: 200, h: 200, t: '60%', l: '70%', y: [0, -60, 40, -30, 0], x: [0, -50, 30, -40, 0], d: 45 },
  { color: 'rgb(20, 184, 166)', opacity: 0.2, w: 150, h: 150, t: '40%', l: '40%', y: [0, -40, 20, -50, 0], x: [0, 60, -20, 40, 0], d: 38 },
  { color: 'rgb(16, 185, 129)', opacity: 0.15, w: 90, h: 90, t: '80%', l: '20%', y: [0, -50, 30, -20, 0], x: [0, 40, -50, 30, 0], d: 30 },
  { color: 'rgb(59, 130, 246)', opacity: 0.15, w: 110, h: 110, t: '20%', l: '80%', y: [0, 60, -40, 50, 0], x: [0, -60, 40, -50, 0], d: 40 },
];

// Research: Deep insight and creativity tones
const researchParticles = [
  { color: 'rgb(139, 92, 246)', opacity: 0.25, w: 150, h: 150, t: '20%', l: '30%', y: [0, 60, -30, 40, 0], x: [0, -40, 50, -30, 0], d: 38 },
  { color: 'rgb(99, 102, 241)', opacity: 0.2, w: 180, h: 180, t: '70%', l: '60%', y: [0, -70, 50, -40, 0], x: [0, 60, -40, 50, 0], d: 42 },
  { color: 'rgb(217, 70, 239)', opacity: 0.15, w: 130, h: 130, t: '40%', l: '80%', y: [0, -50, 30, -60, 0], x: [0, -50, 40, -30, 0], d: 34 },
  { color: 'rgb(139, 92, 246)', opacity: 0.2, w: 100, h: 100, t: '80%', l: '20%', y: [0, -60, 40, -30, 0], x: [0, 50, -30, 40, 0], d: 30 },
];

export const AmbientBackground = ({ variant = 'journal' }: { variant?: AmbientVariant }) => {
  const getGradient = () => {
    switch (variant) {
      case 'transactions': return "from-emerald-500/10 via-slate-950/80 to-slate-950";
      case 'research': return "from-violet-500/15 via-slate-950/80 to-slate-950";
      default: return "from-orange-500/10 via-slate-950/80 to-slate-950";
    }
  };

  const renderParticles = (particles: any[], isCurrent: boolean, keyPrefix: string) => (
    particles.map((p, i) => (
      <motion.div
        key={`${keyPrefix}-${i}`}
        className="absolute rounded-full filter blur-xl transition-all duration-1000"
        style={{
          background: p.color,
          width: p.w,
          height: p.h,
          top: p.t,
          left: p.l,
          opacity: isCurrent ? `calc(var(--ambient-opacity-factor, 1.0) * ${p.opacity})` as any : 0,
          mixBlendMode: 'var(--ambient-blend, screen)' as any,
        }}
        animate={{
          y: p.y,
          x: p.x,
          scale: [1, 1.2, 0.9, 1.1, 1],
        }}
        transition={{
          y: { duration: p.d, repeat: Infinity, ease: "easeInOut" },
          x: { duration: p.d, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: p.d, repeat: Infinity, ease: "easeInOut" },
        }}
      />
    ))
  );

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] transition-colors duration-1000 ${getGradient()}`} />
      
      {variant === 'journal' && renderParticles(journalParticles, true, 'journal')}
      {variant === 'transactions' && renderParticles(txParticles, true, 'transactions')}
      {variant === 'research' && renderParticles(researchParticles, true, 'research')}
    </div>
  );
};
