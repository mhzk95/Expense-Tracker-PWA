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
          backgroundColor: baseColor
        }}
        className="relative w-full aspect-[1.58/1] rounded-[24px] p-6 sm:p-8 overflow-hidden cursor-pointer border-[4px] border-[var(--color-border)] transition-all duration-300 shadow-[8px_8px_0px_0px_var(--color-border)] hover:shadow-[12px_12px_0px_0px_var(--color-border)] hover:-translate-y-1 active:translate-y-1 active:translate-x-1 active:shadow-none group-hover:-translate-y-1"
      >
        <div className="relative h-full flex flex-col justify-between z-20" style={{ transform: "translateZ(30px)" }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white text-[11px] sm:text-xs font-black tracking-widest uppercase drop-shadow-[2px_2px_0px_var(--color-border)]">{typeLabel}</p>
              <h3 className="text-white text-xl sm:text-2xl font-black tracking-tight mt-1 drop-shadow-[2px_2px_0px_var(--color-border)] uppercase">{account.name}</h3>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-[var(--color-surface)] flex items-center justify-center border-2 border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)]">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--color-text)] stroke-[3px]" />
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-white text-xs font-bold tracking-[0.3em] font-mono drop-shadow-[1px_1px_0px_var(--color-border)]">
                {account.lastFour ? `•••• •••• •••• ${account.lastFour}` : "•••• •••• •••• ••••"}
              </p>
            </div>
            <div className="flex justify-between items-end gap-2">
              <p className="text-white font-black text-3xl sm:text-4xl tracking-tighter truncate drop-shadow-[2px_2px_0px_var(--color-border)]">
                {formatCurrency(account.balance, account.currency)}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); vibrate([50]); onEdit?.(); }} 
                  className="p-2.5 text-[var(--color-text)] hover:bg-gray-100 bg-[var(--color-surface)] rounded-xl border-2 border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 md:hidden transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                </button>
                {isDeletable && (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      vibrate([50, 50, 50]);
                      if (confirm("Are you sure you want to delete this account?")) onDelete();
                    }} 
                    className="p-2.5 text-white hover:bg-red-400 bg-red-500 rounded-xl border-2 border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 md:hidden transition-all"
                  >
                    <Trash2 className="w-4 h-4 stroke-[3px]" />
                  </button>
                )}
                {account.isDefault && (
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] text-[var(--color-text)] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_var(--color-border)]">
                    Default
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Actions (Desktop overlay) */}
      <div className="absolute -top-3 -right-3 z-10 hidden md:flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { 
            e.stopPropagation();
            vibrate([50]);
            onEdit?.();
          }}
          className="p-3 text-[var(--color-text)] bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[14px] shadow-[4px_4px_0px_0px_var(--color-border)] hover:bg-gray-100 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
          title="Edit account"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
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
            className="p-3 text-white bg-red-500 border-[3px] border-[var(--color-border)] rounded-[14px] shadow-[4px_4px_0px_0px_var(--color-border)] hover:bg-red-400 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            title="Delete account"
          >
            <Trash2 className="w-5 h-5 stroke-[3px]" />
          </button>
        )}
      </div>
    </div>
  );
}
