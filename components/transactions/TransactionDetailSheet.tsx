"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, formatDate, getCategoryIcon, cn } from "@/lib/utils/helpers";
import { TransactionEntity } from "@/lib/db/indexeddb";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { MapPin, CreditCard, Receipt, Split, Tag, Flag, Repeat, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  txn: TransactionEntity | null;
  onClose: () => void;
}

export function TransactionDetailSheet({ txn, onClose }: Props) {
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (txn) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [txn]);

  if (!mounted) return null;

  const category = categories.find((c) => c.id === txn?.categoryId);
  const account = accounts.find((a) => a.id === txn?.accountId);
  const baseColor = category?.color || "#8b5cf6";
  const IconComp = getCategoryIcon(category?.icon);
  
  const isIncome = txn?.type === "income";
  const isTransfer = txn?.type === "transfer";
  const title = txn?.payee || txn?.description || "Transaction Details";

  let locDisplay = txn?.location;
  try {
    if (txn?.location) {
       const loc = JSON.parse(txn.location);
       locDisplay = loc.display || loc.place_name || "Location saved";
    }
  } catch {}

  const sheetContent = txn && (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 || info.velocity.y > 400) {
            onClose();
          }
        }}
        className="w-full sm:max-w-md bg-[#0c101c]/95 backdrop-blur-2xl border-t border-white/10 rounded-t-[2rem] sm:rounded-[2rem] sm:border pointer-events-auto flex flex-col max-h-[92dvh] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
      >
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-4 pb-2 shrink-0 touch-none">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-6 scrollbar-none">
          {/* Visual Header */}
          <div className="flex flex-col items-center mt-2">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-xl"
              style={{ backgroundColor: `${baseColor}20`, color: baseColor }}
            >
              <IconComp className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white text-balance text-center mb-1.5">{title}</h2>
            
            <div className="flex items-center gap-2 mb-5">
              <span 
                className="px-2.5 py-1 rounded-md text-xs font-medium border"
                style={{ backgroundColor: `${baseColor}15`, borderColor: `${baseColor}30`, color: baseColor }}
              >
                {category?.name || "Uncategorized"}
              </span>
              <span className="text-slate-500 text-sm">{formatDate(txn.date, "medium")}</span>
            </div>

            <p 
              className="text-4xl font-extrabold tabular-nums tracking-tight"
              style={{ color: isIncome ? "#34d399" : isTransfer ? "#cbd5e1" : "white" }}
            >
              {isIncome ? "+" : isTransfer ? "" : "−"}{formatCurrency(txn.amount, txn.currency)}
            </p>
          </div>

          {/* Payment Method Block */}
          <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 active:scale-[0.98] transition-transform cursor-pointer">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-3 block">Payment Method</span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Paid via {account?.name || "Account"}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{(account as any)?.lastFour ? `•••• ${(account as any).lastFour}` : "•••• 1234"}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </div>
          </div>

          {/* Metadata Block */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Transaction ID</span>
                <span className="text-sm text-slate-300 font-mono">TXN_{txn.id.substring(0,8).toUpperCase()}</span>
             </div>
             <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Status</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={cn("w-2 h-2 rounded-full", txn.needsReview ? "bg-amber-500" : "bg-emerald-500")} />
                  <span className="text-sm text-slate-300 font-medium capitalize">{txn.needsReview ? "Needs Review" : "Completed"}</span>
                </div>
             </div>
          </div>

          {/* Geolocation Block */}
          {locDisplay && (
            <div className="bg-slate-900/50 rounded-2xl overflow-hidden border border-white/5">
              <div className="p-4 border-b border-white/5 flex items-start gap-3">
                 <div className="mt-0.5 text-violet-400"><MapPin className="w-4 h-4" /></div>
                 <div>
                   <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Location</span>
                   <p className="text-sm text-slate-300">{locDisplay}</p>
                 </div>
              </div>
              <div className="h-24 bg-slate-800/50 w-full relative overflow-hidden group cursor-pointer flex items-center justify-center">
                 <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
                 <div className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Tap to view map</div>
              </div>
            </div>
          )}

          {/* Notes Input */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-2 pl-1">Notes</span>
            <div className="relative">
              <textarea 
                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 resize-none transition-all"
                placeholder="Add notes about this transaction..."
                rows={3}
                defaultValue={txn.note || ""}
              />
            </div>
          </div>

          {/* Bottom Action Row */}
          <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-2 pt-2">
            <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-slate-900/50 hover:bg-slate-800 active:scale-[0.98] transition-all shrink-0 text-sm font-medium text-slate-300">
              <Receipt className="w-4 h-4 text-slate-400" />
              Attach Receipt
            </button>
            <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-slate-900/50 hover:bg-slate-800 active:scale-[0.98] transition-all shrink-0 text-sm font-medium text-slate-300">
              <Split className="w-4 h-4 text-slate-400" />
              Split
            </button>
            <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-slate-900/50 hover:bg-slate-800 active:scale-[0.98] transition-all shrink-0 text-sm font-medium text-slate-300">
              <Tag className="w-4 h-4 text-slate-400" />
              Re-Categorize
            </button>
            <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-slate-900/50 hover:bg-slate-800 active:scale-[0.98] transition-all shrink-0 text-sm font-medium text-slate-300">
              <Flag className="w-4 h-4 text-slate-400" />
              Flag
            </button>
            <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-slate-900/50 hover:bg-slate-800 active:scale-[0.98] transition-all shrink-0 text-sm font-medium text-slate-300">
              <Repeat className="w-4 h-4 text-slate-400" />
              Repeat
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
  
  return createPortal(
    <AnimatePresence>
      {sheetContent}
    </AnimatePresence>,
    document.body
  );
}
