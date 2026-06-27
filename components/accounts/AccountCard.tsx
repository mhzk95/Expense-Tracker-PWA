"use client";

import { useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { formatCurrency, cn } from "@/lib/utils/helpers";
import { Trash2 } from "lucide-react";
import { vibrate } from "@/lib/utils/helpers";

interface AccountCardProps {
  account: any;
  icon: any;
  typeLabel: string;
  onDelete: () => void;
  onEdit?: () => void;
  isDeletable?: boolean;
}

export function AccountCard({ account, icon: Icon, typeLabel, onDelete, onEdit, isDeletable = true }: AccountCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["100%", "0%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["100%", "0%"]);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = (mouseX / width) - 0.5;
    const yPct = (mouseY / height) - 0.5;
    x.set(xPct);
    y.set(yPct);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta && e.gamma) {
         let tiltX = Math.max(-1, Math.min(1, e.gamma / 45)); 
         let tiltY = Math.max(-1, Math.min(1, (e.beta - 45) / 45)); 
         x.set(tiltX * 0.5);
         y.set(tiltY * 0.5);
      }
    };
    if (typeof window !== "undefined" && window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation);
      return () => window.removeEventListener("deviceorientation", handleOrientation);
    }
  }, [x, y]);

  const baseColor = account.color || "#6366f1";
  
  return (
    <div className="relative group w-full perspective-[1000px]">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full aspect-[1.58/1] rounded-[1.25rem] p-6 overflow-hidden cursor-pointer backdrop-blur-xl bg-slate-900/40 transition-all duration-300 shadow-[0_0_30px_-5px_var(--color-primary-glow,rgba(139,92,246,0.15)),inset_0_1px_2px_rgba(255,255,255,0.15),inset_0_-1px_2px_rgba(0,0,0,0.4)] hover:shadow-[0_0_40px_-5px_var(--color-primary-glow-hover,rgba(139,92,246,0.25)),inset_0_1px_2px_rgba(255,255,255,0.2),inset_0_-1px_2px_rgba(0,0,0,0.5)]"
      >
        {/* Card Background gradient with glass tint */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(135deg, ${baseColor} 0%, transparent 100%)`,
          }}
        />
        
        {/* Noise overlay */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('/noise.png')] bg-repeat" />
        
        {/* Dynamic glare effect */}
        <motion.div 
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30 transition-opacity"
          style={{
            background: `radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`,
            left: glareX,
            top: glareY,
            transform: "translate(-50%, -50%)",
            width: "200%",
            height: "200%"
          }}
        />

        {/* Luminescent Border Glow using CSS mask */}
        <div 
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-10"
          style={{
            padding: '1px',
            background: `linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, ${baseColor} 100%)`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />

        <div className="relative h-full flex flex-col justify-between z-20" style={{ transform: "translateZ(30px)" }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-sm font-medium tracking-wide uppercase">{typeLabel}</p>
              <h3 className="text-white text-xl font-bold tracking-tight mt-1">{account.name}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-white/70 text-xs tracking-[0.2em] font-mono">
                {account.lastFour ? `•••• •••• •••• ${account.lastFour}` : "•••• •••• •••• ••••"}
              </p>
            </div>
            <div className="flex justify-between items-end gap-2">
              <p className="text-white font-mono text-3xl font-bold tracking-tighter truncate">
                {formatCurrency(account.balance, account.currency)}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); vibrate([50]); onEdit?.(); }} 
                  className="p-2 text-white/70 hover:text-white bg-white/10 rounded-full backdrop-blur-sm md:hidden transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                </button>
                {isDeletable && (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      vibrate([50, 50, 50]);
                      if (confirm("Are you sure you want to delete this account?")) onDelete();
                    }} 
                    className="p-2 text-red-300 hover:text-red-200 bg-red-500/20 rounded-full backdrop-blur-sm md:hidden transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {account.isDefault && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm font-medium tracking-wide">
                    Default
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Actions (Desktop overlay) */}
      <div className="absolute -top-2 -right-2 z-10 hidden md:flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { 
            e.stopPropagation();
            vibrate([50]);
            onEdit?.();
          }}
          className="p-2.5 text-white bg-slate-700 rounded-full shadow-lg hover:bg-slate-600 transition-colors"
          title="Edit account"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
        </button>

        {isDeletable && (
          <button 
            onClick={(e) => { 
              e.stopPropagation();
              vibrate([50, 50, 50]);
              if (confirm("Are you sure you want to delete this account?")) {
                 onDelete();
                 vibrate([50]);
              }
            }}
            className="p-2.5 text-white bg-red-500 rounded-full shadow-lg hover:bg-red-600 transition-colors"
            title="Delete account"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
