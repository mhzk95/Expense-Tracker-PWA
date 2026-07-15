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
        className="absolute inset-0 bg-[var(--color-surface)]/60 backdrop-blur-md pointer-events-auto"
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
        className="w-full sm:max-w-md bg-[var(--color-bg)] border-t-[4px] border-l-[4px] border-r-[4px] border-[var(--color-border)] rounded-t-[32px] sm:rounded-[32px] sm:border-[4px] pointer-events-auto flex flex-col max-h-[92dvh] sm:shadow-[8px_8px_0px_0px_var(--color-border)] shadow-[0_-8px_0px_rgba(0,0,0,0.1)] relative z-10"
      >
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-4 pb-2 shrink-0 touch-none">
          <div className="w-16 h-2 bg-black rounded-full" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-6 scrollbar-none">
          {/* Visual Header */}
          <div className="flex flex-col items-center mt-2">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border-[3px] border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)]"
              style={{ backgroundColor: baseColor, color: "black" }}
            >
              <IconComp className="w-8 h-8 stroke-[3px]" />
            </div>
            <h2 className="text-2xl font-black text-[var(--color-text)] text-balance text-center mb-1.5 uppercase tracking-tight">{title}</h2>
            
            <div className="flex items-center gap-2 mb-5">
              <span 
                className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border-[2.5px] border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-[2px_2px_0px_0px_var(--color-border)]"
                style={{ backgroundColor: baseColor }}
              >
                {category?.name || "Uncategorized"}
              </span>
              <span className="text-gray-600 text-xs font-bold uppercase tracking-wider">{formatDate(txn.date, "medium")}</span>
            </div>

            <p 
              className={cn(
                "text-4xl font-black tabular-nums tracking-tight",
                isIncome ? "text-emerald-600" : isTransfer ? "text-gray-500" : "text-[var(--color-text)]"
              )}
            >
              {isIncome ? "+" : isTransfer ? "" : "−"}{formatCurrency(txn.amount, txn.currency)}
            </p>
          </div>

          {/* Payment Method Block */}
          <div className="bg-[var(--color-surface)] rounded-[20px] p-4 border-[3px] border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer">
            <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-text)] mb-3 block">Payment Method</span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white border-2 border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)]">
                  <CreditCard className="w-6 h-6 stroke-[2.5px]" />
                </div>
                <div>
                  <p className="text-sm font-black text-[var(--color-text)] uppercase tracking-wide">Paid via {account?.name || "Account"}</p>
                  <p className="text-xs text-gray-600 font-bold mt-0.5 tracking-wider">{(account as any)?.lastFour ? `•••• ${(account as any).lastFour}` : "•••• 1234"}</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 stroke-[3px] text-[var(--color-text)]" />
            </div>
          </div>

          {/* Metadata Block */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-[var(--color-surface)] rounded-[20px] p-4 border-[3px] border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)]">
                <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-text)] block mb-1">Transaction ID</span>
                <span className="text-sm text-[var(--color-text)] font-bold uppercase">TXN_{txn.id.substring(0,8).toUpperCase()}</span>
             </div>
             <div className="bg-[var(--color-surface)] rounded-[20px] p-4 border-[3px] border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)]">
                <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-text)] block mb-1">Status</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className={cn("w-3 h-3 rounded-full border-2 border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)]", txn.needsReview ? "bg-amber-400" : "bg-emerald-400")} />
                  <span className="text-sm text-[var(--color-text)] font-black uppercase tracking-wide">{txn.needsReview ? "Needs Review" : "Completed"}</span>
                </div>
             </div>
          </div>

          {/* Geolocation Block */}
          {locDisplay && (
            <div className="bg-[var(--color-surface)] rounded-[20px] overflow-hidden border-[3px] border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)]">
              <div className="p-4 border-b-[3px] border-[var(--color-border)] flex items-start gap-3 bg-[var(--color-surface)]">
                 <div className="mt-0.5 text-[var(--color-text)]"><MapPin className="w-5 h-5 stroke-[2.5px]" /></div>
                 <div>
                   <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-text)] block mb-1">Location</span>
                   <p className="text-sm font-bold text-[var(--color-text)] uppercase">{locDisplay}</p>
                 </div>
              </div>
              <div className="h-24 bg-gray-100 w-full relative overflow-hidden group cursor-pointer flex items-center justify-center">
                 <div className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">Tap to view map</div>
              </div>
            </div>
          )}

          {/* Notes Input */}
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-text)] block mb-2 pl-1">Notes</span>
            <div className="relative">
              <textarea 
                className="w-full bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[20px] p-4 text-sm font-bold text-[var(--color-text)] placeholder-gray-500 outline-none focus:shadow-[6px_6px_0px_0px_var(--color-border)] focus:-translate-x-1 focus:-translate-y-1 shadow-[4px_4px_0px_0px_var(--color-border)] resize-none transition-all"
                placeholder="Add notes about this transaction..."
                rows={3}
                defaultValue={txn.note || ""}
              />
            </div>
          </div>

          {/* Bottom Action Row */}
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-4 pt-2">
            <button className="flex items-center gap-2 px-4 py-3 rounded-xl border-[3px] border-[var(--color-border)] bg-[var(--color-surface)] shadow-[4px_4px_0px_0px_var(--color-border)] hover:bg-[var(--color-bg)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all shrink-0 text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
              <Receipt className="w-4 h-4 stroke-[3px] text-[var(--color-text)]" />
              Attach Receipt
            </button>
            <button className="flex items-center gap-2 px-4 py-3 rounded-xl border-[3px] border-[var(--color-border)] bg-[var(--color-surface)] shadow-[4px_4px_0px_0px_var(--color-border)] hover:bg-[var(--color-bg)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all shrink-0 text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
              <Split className="w-4 h-4 stroke-[3px] text-[var(--color-text)]" />
              Split
            </button>
            <button className="flex items-center gap-2 px-4 py-3 rounded-xl border-[3px] border-[var(--color-border)] bg-[var(--color-surface)] shadow-[4px_4px_0px_0px_var(--color-border)] hover:bg-[var(--color-bg)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all shrink-0 text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
              <Tag className="w-4 h-4 stroke-[3px] text-[var(--color-text)]" />
              Re-Categorize
            </button>
            <button className="flex items-center gap-2 px-4 py-3 rounded-xl border-[3px] border-[var(--color-border)] bg-[var(--color-surface)] shadow-[4px_4px_0px_0px_var(--color-border)] hover:bg-[var(--color-bg)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all shrink-0 text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
              <Flag className="w-4 h-4 stroke-[3px] text-[var(--color-text)]" />
              Flag
            </button>
            <button className="flex items-center gap-2 px-4 py-3 rounded-xl border-[3px] border-[var(--color-border)] bg-[var(--color-surface)] shadow-[4px_4px_0px_0px_var(--color-border)] hover:bg-[var(--color-bg)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all shrink-0 text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
              <Repeat className="w-4 h-4 stroke-[3px] text-[var(--color-text)]" />
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
