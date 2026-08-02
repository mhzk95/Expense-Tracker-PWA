"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, formatDate, getCategoryIcon, cn, vibrate } from "@/lib/utils/helpers";
import { TransactionEntity } from "@/lib/db/indexeddb";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { MapPin, CreditCard, Flag, Repeat, ChevronRight, Edit3, Trash2, CheckCircle2, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  txn: TransactionEntity | null;
  onClose: () => void;
  onEdit?: (txn: TransactionEntity) => void;
  onDelete?: (id: string) => void;
}

export function TransactionDetailSheet({ txn, onClose, onEdit, onDelete }: Props) {
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { updateTransaction, addTransaction, deleteTransaction } = useTransactions();
  const [mounted, setMounted] = useState(false);
  const [currentNote, setCurrentNote] = useState(txn?.note || "");
  const [isFlagged, setIsFlagged] = useState(Boolean(txn?.needsReview));
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (txn) {
      setCurrentNote(txn.note || "");
      setIsFlagged(Boolean(txn.needsReview));
      setActionNotice(null);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [txn]);

  if (!mounted || !txn) return null;

  const category = categories.find((c) => c.id === txn.categoryId);
  const account = accounts.find((a) => a.id === txn.accountId);
  const baseColor = category?.color || "#8b5cf6";
  const IconComp = getCategoryIcon(category?.icon);
  
  const isIncome = txn.type === "income";
  const isTransfer = txn.type === "transfer";
  const title = txn.payee || txn.description || "Transaction Details";

  let locDisplay = txn.location;
  try {
    if (txn.location) {
      const loc = JSON.parse(txn.location);
      locDisplay = loc.display || loc.place_name || "Location saved";
    }
  } catch {}

  const handleToggleFlag = async () => {
    vibrate([20]);
    const nextFlag = !isFlagged;
    setIsFlagged(nextFlag);
    await updateTransaction(txn.id, {
      needsReview: nextFlag
    });
    setActionNotice(nextFlag ? "Marked for review" : "Marked as reviewed");
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleDuplicate = async () => {
    vibrate([30]);
    const newTxn: TransactionEntity = {
      ...txn,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      description: txn.description ? `${txn.description} (Copy)` : "Repeated Transaction"
    };
    await addTransaction(newTxn);
    setActionNotice("Duplicated transaction created!");
    setTimeout(() => {
      setActionNotice(null);
      onClose();
    }, 1200);
  };

  const handleNoteBlur = async () => {
    if (currentNote !== (txn.note || "")) {
      await updateTransaction(txn.id, {
        note: currentNote.trim()
      });
    }
  };

  const handleDelete = async () => {
    vibrate([40]);
    if (onDelete) {
      onDelete(txn.id);
    } else {
      await deleteTransaction(txn.id);
    }
    onClose();
  };

  const handleEditClick = () => {
    vibrate([15]);
    if (onEdit) {
      onEdit(txn);
    }
    onClose();
  };

  const sheetContent = (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
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
        className="w-full sm:max-w-md bg-[var(--color-bg)] border-t-2 border-l-2 border-r-2 sm:border-2 border-[var(--color-border)] rounded-t-[28px] sm:rounded-[28px] pointer-events-auto flex flex-col max-h-[90dvh] relative z-10 shadow-2xl"
      >
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 shrink-0 touch-none">
          <div className="w-12 h-1.5 bg-gray-600 rounded-full opacity-60" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5 scrollbar-none">
          {/* Visual Header */}
          <div className="flex flex-col items-center mt-1">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 border-2 border-black/20"
              style={{ backgroundColor: baseColor, color: "black" }}
            >
              <IconComp className="w-7 h-7 stroke-[2.5px]" />
            </div>
            <h2 className="text-xl font-black text-[var(--color-text)] text-balance text-center mb-1 uppercase tracking-tight">{title}</h2>
            
            <div className="flex items-center gap-2 mb-4">
              <span 
                className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-black border border-black/20"
                style={{ backgroundColor: baseColor }}
              >
                {category?.name || "Uncategorized"}
              </span>
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">{formatDate(txn.date, "medium")}</span>
            </div>

            <p 
              className={cn(
                "text-3xl font-black font-numbers tabular-nums tracking-tight",
                isIncome ? "text-emerald-500" : isTransfer ? "text-blue-400" : "text-[var(--color-text)]"
              )}
            >
              {isIncome ? "+" : isTransfer ? "" : "−"}{formatCurrency(txn.amount, txn.currency)}
            </p>

            {actionNotice && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {actionNotice}
              </motion.div>
            )}
          </div>

          {/* Quick Actions Bar */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleToggleFlag}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 transition-all active:scale-95",
                isFlagged 
                  ? "bg-yellow-400/20 border-yellow-400 text-yellow-400" 
                  : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)]"
              )}
            >
              <Zap className={cn("w-4 h-4 stroke-[2.5px]", isFlagged && "fill-yellow-400")} />
              <span className="text-[10px] font-black uppercase tracking-wider">
                {isFlagged ? "Flagged" : "Flag"}
              </span>
            </button>

            <button
              onClick={handleDuplicate}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)] transition-all active:scale-95"
            >
              <Repeat className="w-4 h-4 stroke-[2.5px] text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-wider">Repeat</span>
            </button>

            <button
              onClick={handleEditClick}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)] transition-all active:scale-95"
            >
              <Edit3 className="w-4 h-4 stroke-[2.5px] text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-wider">Edit</span>
            </button>
          </div>

          {/* Payment Method Block */}
          <div className="bg-[var(--color-surface)] rounded-[18px] p-3.5 border-2 border-[var(--color-border)] transition-all">
            <span className="text-[9px] uppercase font-black tracking-widest text-gray-500 mb-2 block">Payment Method</span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white border border-black/20">
                  <CreditCard className="w-5 h-5 stroke-[2.5px]" />
                </div>
                <div>
                  <p className="text-xs font-black text-[var(--color-text)] uppercase tracking-wide">Paid via {account?.name || "Account"}</p>
                  <p className="text-[11px] text-gray-500 font-bold mt-0.5 tracking-wider">{(account as any)?.lastFour ? `•••• ${(account as any).lastFour}` : "Active Account"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Block */}
          <div className="grid grid-cols-2 gap-2.5">
             <div className="bg-[var(--color-surface)] rounded-[18px] p-3 border-2 border-[var(--color-border)]">
                <span className="text-[9px] uppercase font-black tracking-widest text-gray-500 block mb-1">Transaction ID</span>
                <span className="text-xs text-[var(--color-text)] font-bold uppercase font-mono">TXN_{txn.id.substring(0,8).toUpperCase()}</span>
             </div>
             <div className="bg-[var(--color-surface)] rounded-[18px] p-3 border-2 border-[var(--color-border)]">
                <span className="text-[9px] uppercase font-black tracking-widest text-gray-500 block mb-1">Status</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={cn("w-2.5 h-2.5 rounded-full border border-black/30", isFlagged ? "bg-yellow-400" : "bg-emerald-400")} />
                  <span className="text-xs text-[var(--color-text)] font-black uppercase tracking-wide">{isFlagged ? "Needs Review" : "Completed"}</span>
                </div>
             </div>
          </div>

          {/* Geolocation Block */}
          {locDisplay && (
            <div className="bg-[var(--color-surface)] rounded-[18px] overflow-hidden border-2 border-[var(--color-border)]">
              <div className="p-3 border-b border-[var(--color-border)] flex items-start gap-2.5 bg-[var(--color-surface)]">
                 <div className="mt-0.5 text-gray-400"><MapPin className="w-4 h-4 stroke-[2.5px]" /></div>
                 <div>
                   <span className="text-[9px] uppercase font-black tracking-widest text-gray-500 block mb-0.5">Location</span>
                   <p className="text-xs font-bold text-[var(--color-text)] uppercase">{locDisplay}</p>
                 </div>
              </div>
            </div>
          )}

          {/* Notes Input */}
          <div>
            <span className="text-[9px] uppercase font-black tracking-widest text-gray-500 block mb-1.5 pl-1">Notes</span>
            <div className="relative">
              <textarea 
                className="w-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-[16px] p-3 text-xs font-bold text-[var(--color-text)] placeholder-gray-500 outline-none focus:border-[var(--color-primary)] resize-none transition-all"
                placeholder="Add notes about this transaction..."
                rows={2}
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                onBlur={handleNoteBlur}
              />
            </div>
          </div>

          {/* Danger Zone: Delete */}
          <div className="pt-1">
            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-black uppercase tracking-wider transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete Transaction
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
