"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const AmbientBackground = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="fixed inset-0 z-[-1] bg-slate-950" />;
  }

  // Pre-calculated values to avoid hydration mismatches with Math.random()
  const particles = [
    { bg: 'rgba(245, 158, 11, 0.4)', w: 40, h: 40, t: '80%', l: '20%', y: [0, -80, 40, -40, 0], x: [0, 50, -30, 60, 0], d: 25 },
    { bg: 'rgba(249, 115, 22, 0.3)', w: 60, h: 60, t: '60%', l: '70%', y: [0, -120, 30, -60, 0], x: [0, -60, 40, -20, 0], d: 28 },
    { bg: 'rgba(244, 63, 94, 0.25)', w: 30, h: 30, t: '40%', l: '40%', y: [0, -60, 20, -30, 0], x: [0, 40, -20, 50, 0], d: 22 },
    { bg: 'rgba(234, 179, 8, 0.35)', w: 50, h: 50, t: '90%', l: '80%', y: [0, -100, 50, -80, 0], x: [0, -40, 60, -30, 0], d: 30 },
    { bg: 'rgba(245, 158, 11, 0.3)', w: 80, h: 80, t: '20%', l: '10%', y: [0, 80, -40, 50, 0], x: [0, 70, -50, 40, 0], d: 35 },
    { bg: 'rgba(249, 115, 22, 0.4)', w: 35, h: 35, t: '30%', l: '80%', y: [0, 60, -30, 40, 0], x: [0, -50, 30, -60, 0], d: 20 },
    { bg: 'rgba(244, 63, 94, 0.2)', w: 70, h: 70, t: '70%', l: '30%', y: [0, -90, 60, -50, 0], x: [0, 80, -40, 70, 0], d: 32 },
    { bg: 'rgba(234, 179, 8, 0.3)', w: 45, h: 45, t: '50%', l: '60%', y: [0, -70, 40, -20, 0], x: [0, -70, 50, -40, 0], d: 24 },
    { bg: 'rgba(245, 158, 11, 0.25)', w: 55, h: 55, t: '10%', l: '50%', y: [0, 50, -60, 30, 0], x: [0, 40, -80, 50, 0], d: 27 },
    { bg: 'rgba(249, 115, 22, 0.35)', w: 25, h: 25, t: '85%', l: '50%', y: [0, -50, 20, -40, 0], x: [0, -30, 20, -50, 0], d: 18 },
  ];

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base subtle radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/30 via-slate-950/90 to-slate-950" />
      
      {/* Drifting warm balls */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full mix-blend-screen filter blur-xl"
          style={{
            background: p.bg,
            width: p.w,
            height: p.h,
            top: p.t,
            left: p.l,
          }}
          animate={{
            y: p.y,
            x: p.x,
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.2, 0.9, 1.1, 1],
          }}
          transition={{
            duration: p.d,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
