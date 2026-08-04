"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, formatDate, getCategoryIcon, cn, vibrate } from "@/lib/utils/helpers";
import { TransactionEntity } from "@/lib/db/indexeddb";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { 
  MapPin, CreditCard, Flag, Repeat, ChevronRight, Edit3, Trash2, CheckCircle2, 
  Zap, Copy, Check, ExternalLink, ArrowRight, ArrowDownLeft, ArrowUpRight, 
  ArrowLeftRight, Calendar, Clock, FileText, Share2, Tag, ShieldCheck, Users, MessageSquare
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { SplitDetailsHero } from "@/components/transactions/SplitDetailsHero";

interface Props {
  txn: TransactionEntity | null;
  onClose: () => void;
  onEdit?: (txn: TransactionEntity) => void;
  onDelete?: (id: string) => void;
}

function getRelativeTimeString(dateStr: string): string {
  try {
    const txDate = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - txDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      if (txDate.getDate() === now.getDate()) return "Today";
      return "Yesterday";
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  } catch {
    return "";
  }
}

export function TransactionDetailSheet({ txn, onClose, onEdit, onDelete }: Props) {
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { updateTransaction, addTransaction, deleteTransaction } = useTransactions();
  const [mounted, setMounted] = useState(false);
  const [currentNote, setCurrentNote] = useState(txn?.note || "");
  const [isFlagged, setIsFlagged] = useState(Boolean(txn?.needsReview));
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (txn) {
      setCurrentNote(txn.note || "");
      setIsFlagged(Boolean(txn.needsReview));
      setActionNotice(null);
      setCopiedId(false);
      setCopiedSummary(false);
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
  const sourceAccount = accounts.find((a) => a.id === txn.accountId);
  const targetAccount = accounts.find((a) => a.id === txn.toAccountId);
  
  const baseColor = category?.color || "#8b5cf6";
  const IconComp = getCategoryIcon(category?.icon);
  
  const isIncome = txn.type === "income";
  const isTransfer = txn.type === "transfer";
  const isExpense = txn.type === "expense" || (!isIncome && !isTransfer);

  // Separation of Payee & Description
  const hasDistinctPayeeAndDesc = Boolean(txn.payee && txn.description && txn.payee.toLowerCase().trim() !== txn.description.toLowerCase().trim());
  const primaryTitle = txn.payee || txn.description || (isTransfer ? "Account Transfer" : "Transaction");
  const secondaryDescription = hasDistinctPayeeAndDesc ? txn.description : (txn.payee && !txn.description ? null : null);

  // Location extraction
  let parsedLocation: {
    display?: string;
    place_name?: string;
    city?: string;
    country?: string;
    lat?: number | string;
    lon?: number | string;
  } | null = null;

  if (txn.location) {
    try {
      parsedLocation = JSON.parse(txn.location);
    } catch {
      parsedLocation = { display: txn.location };
    }
  }

  const locationDisplay = parsedLocation?.display || parsedLocation?.place_name || (parsedLocation?.city ? `${parsedLocation.city}, ${parsedLocation.country || ''}` : null);
  const hasCoordinates = Boolean(parsedLocation?.lat && parsedLocation?.lon);
  const mapsUrl = hasCoordinates ? `https://www.google.com/maps/search/?api=1&query=${parsedLocation?.lat},${parsedLocation?.lon}` : null;

  // Date and Time breakdown
  const txDateObj = new Date(txn.date);
  const fullDateFormatted = txDateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeFormatted = txDateObj.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const relativeTime = getRelativeTimeString(txn.date);

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

  const handleCopyId = async () => {
    vibrate([15]);
    try {
      await navigator.clipboard.writeText(txn.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {}
  };

  const handleShareSummary = async () => {
    vibrate([20]);
    const summaryText = [
      `💰 Transaction: ${primaryTitle}`,
      secondaryDescription ? `📝 Description: ${secondaryDescription}` : null,
      `💵 Amount: ${isIncome ? "+" : isTransfer ? "" : "-"}${formatCurrency(txn.amount, txn.currency)}`,
      `🏷️ Category: ${category?.name || "Uncategorized"}`,
      `📅 Date: ${fullDateFormatted} at ${timeFormatted}`,
      isTransfer && sourceAccount && targetAccount ? `🔄 Transfer: ${sourceAccount.name} ➔ ${targetAccount.name}` : `💳 Account: ${sourceAccount?.name || "N/A"}`,
      locationDisplay ? `📍 Location: ${locationDisplay}` : null,
      currentNote ? `🗒️ Note: ${currentNote}` : null,
    ].filter(Boolean).join("\n");

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Transaction: ${primaryTitle}`,
          text: summaryText,
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedSummary(true);
      setActionNotice("Summary copied to clipboard!");
      setTimeout(() => {
        setCopiedSummary(false);
        setActionNotice(null);
      }, 2500);
    } catch {}
  };

  const handleNoteBlur = async () => {
    if (currentNote !== (txn.note || "")) {
      await updateTransaction(txn.id, {
        note: currentNote.trim()
      });
      setActionNotice("Note saved");
      setTimeout(() => setActionNotice(null), 2000);
    }
  };

  const handleToggleParticipantSettled = async (participantId: string) => {
    if (!txn || !txn.splits) return;
    vibrate([20]);
    const updatedSplits = txn.splits.map((s) => {
      if (s.id === participantId) {
        const nextSettled = !s.isSettled;
        return {
          ...s,
          isSettled: nextSettled,
          settledAt: nextSettled ? new Date().toISOString() : undefined,
        };
      }
      return s;
    });

    const targetParticipant = txn.splits.find((s) => s.id === participantId);
    const isNowSettled = !targetParticipant?.isSettled;

    await updateTransaction(txn.id, {
      splits: updatedSplits,
    });

    setActionNotice(
      isNowSettled 
        ? `${targetParticipant?.name || 'Share'} marked as Paid!` 
        : `${targetParticipant?.name || 'Share'} marked as Pending`
    );
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleCopyPaymentRequest = (participantName?: string, shareAmount?: number) => {
    vibrate([15]);
    const title = txn.payee || txn.description || "our group expense";
    const amountStr = shareAmount ? `₹${shareAmount}` : formatCurrency(txn.amount, txn.currency);
    const msg = `Hey ${participantName || "there"}! Your share for ${title} is ${amountStr}. Total bill was ${formatCurrency(txn.amount, txn.currency)}.`;

    navigator.clipboard.writeText(msg);
    setActionNotice("Payment request copied to clipboard!");
    setTimeout(() => setActionNotice(null), 2500);
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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 240 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 || info.velocity.y > 400) {
            onClose();
          }
        }}
        className="w-full sm:max-w-md bg-[var(--color-bg)] border-t-2 border-l-2 border-r-2 sm:border-2 border-[var(--color-border)] rounded-t-[32px] sm:rounded-[32px] pointer-events-auto flex flex-col max-h-[92dvh] relative z-10 shadow-2xl overflow-hidden"
      >
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 shrink-0 touch-none">
          <div className="w-12 h-1.5 bg-gray-500/50 rounded-full" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-4.5 scrollbar-none">
          {/* Hero Financial Header Card */}
          <div className="relative rounded-[24px] border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center overflow-hidden">
            {/* Top Accent Strip */}
            <div 
              className="absolute top-0 left-0 right-0 h-2" 
              style={{ backgroundColor: baseColor }} 
            />

            {/* Type Pill + Status */}
            <div className="flex items-center justify-between mb-3 mt-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-[var(--color-border)] bg-[var(--color-bg)]">
                {isIncome ? (
                  <>
                    <ArrowUpRight className="w-3 h-3 text-emerald-400 stroke-[3px]" />
                    <span className="text-emerald-400">Income</span>
                  </>
                ) : isTransfer ? (
                  <>
                    <ArrowLeftRight className="w-3 h-3 text-blue-400 stroke-[3px]" />
                    <span className="text-blue-400">Transfer</span>
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="w-3 h-3 text-rose-400 stroke-[3px]" />
                    <span className="text-rose-400">Expense</span>
                  </>
                )}
              </div>

              {relativeTime && (
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-[var(--color-bg)] px-2 py-0.5 rounded-md border border-[var(--color-border)]/50">
                  {relativeTime}
                </span>
              )}
            </div>

            {/* Category Icon Badge */}
            <div className="flex justify-center mb-2.5">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-black/20 shadow-sm"
                style={{ backgroundColor: baseColor, color: "black" }}
              >
                {isTransfer ? (
                  <ArrowLeftRight className="w-7 h-7 stroke-[2.5px]" />
                ) : (
                  <IconComp className="w-7 h-7 stroke-[2.5px]" />
                )}
              </div>
            </div>

            {/* Primary Payee & Title */}
            <h2 className="text-xl font-black text-[var(--color-text)] uppercase tracking-tight text-balance">
              {primaryTitle}
            </h2>

            {/* Secondary Description / Purpose if different */}
            {secondaryDescription && (
              <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">
                {secondaryDescription}
              </p>
            )}

            {/* Formatted Amount */}
            <div className="mt-3 mb-2">
              <p 
                className={cn(
                  "text-3xl sm:text-4xl font-black font-numbers tabular-nums tracking-tight",
                  isIncome ? "text-emerald-400" : isTransfer ? "text-blue-400" : "text-[var(--color-text)]"
                )}
              >
                {isIncome ? "+" : isTransfer ? "" : "−"}{formatCurrency(txn.amount, txn.currency)}
              </p>
            </div>

            {/* Category & Date Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 pt-3 border-t border-[var(--color-border)]/60">
              <span 
                className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-black border border-black/20 flex items-center gap-1"
                style={{ backgroundColor: baseColor }}
              >
                <Tag className="w-3 h-3 stroke-[2.5px]" />
                {category?.name || "Uncategorized"}
              </span>

              <span className="text-[11px] font-bold text-[var(--color-text)] flex items-center gap-1.5 bg-[var(--color-bg)] px-2.5 py-0.5 rounded-lg border border-[var(--color-border)]">
                <Calendar className="w-3 h-3 text-gray-500" />
                {fullDateFormatted}
              </span>

              <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1 bg-[var(--color-bg)] px-2 py-0.5 rounded-lg border border-[var(--color-border)] font-numbers tabular-nums">
                <Clock className="w-3 h-3 text-gray-500" />
                {timeFormatted}
              </span>
            </div>

            {actionNotice && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {actionNotice}
              </motion.div>
            )}
          </div>

          {/* Quick Actions Bar */}
          <div className="grid grid-cols-4 gap-2">
            {/* Flag / Review */}
            <button
              onClick={handleToggleFlag}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl border-2 transition-all active:scale-95",
                isFlagged 
                  ? "bg-yellow-400/20 border-yellow-400 text-yellow-400" 
                  : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)]"
              )}
            >
              <Zap className={cn("w-4 h-4 stroke-[2.5px]", isFlagged && "fill-yellow-400")} />
              <span className="text-[9px] font-black uppercase tracking-wider">
                {isFlagged ? "Flagged" : "Flag"}
              </span>
            </button>

            {/* Repeat / Duplicate */}
            <button
              onClick={handleDuplicate}
              className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)] transition-all active:scale-95"
            >
              <Repeat className="w-4 h-4 stroke-[2.5px] text-blue-400" />
              <span className="text-[9px] font-black uppercase tracking-wider">Repeat</span>
            </button>

            {/* Share / Copy */}
            <button
              onClick={handleShareSummary}
              className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)] transition-all active:scale-95"
            >
              {copiedSummary ? <Check className="w-4 h-4 text-emerald-400 stroke-[3px]" /> : <Share2 className="w-4 h-4 stroke-[2.5px] text-purple-400" />}
              <span className="text-[9px] font-black uppercase tracking-wider">{copiedSummary ? "Copied" : "Share"}</span>
            </button>

            {/* Edit */}
            <button
              onClick={handleEditClick}
              className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)] transition-all active:scale-95"
            >
              <Edit3 className="w-4 h-4 stroke-[2.5px] text-emerald-400" />
              <span className="text-[9px] font-black uppercase tracking-wider">Edit</span>
            </button>
          </div>

          {/* Account Flow & Transfer Bridge Card */}
          <div className="bg-[var(--color-surface)] rounded-[22px] p-4 border-2 border-[var(--color-border)]">
            <span className="text-[9px] uppercase font-black tracking-widest text-gray-500 mb-2.5 block">
              {isTransfer ? "Transfer Flow" : isIncome ? "Deposit Account" : "Payment Method"}
            </span>

            {isTransfer ? (
              /* Transfer Bridge Flow: Source -> Target */
              <div className="flex items-center gap-2">
                {/* Source Account */}
                <div className="flex-1 bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-border)]">
                  <span className="text-[8px] font-black uppercase tracking-wider text-rose-400 block mb-0.5">From</span>
                  <p className="text-xs font-black text-[var(--color-text)] uppercase truncate">{sourceAccount?.name || "Source"}</p>
                  <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                    {(sourceAccount as any)?.lastFour ? `•••• ${(sourceAccount as any).lastFour}` : "Account"}
                  </p>
                </div>

                {/* Transfer Arrow Indicator */}
                <div className="w-8 h-8 rounded-full bg-[var(--color-surfaceHover)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                  <ArrowRight className="w-4 h-4 text-blue-400 stroke-[3px]" />
                </div>

                {/* Target Account */}
                <div className="flex-1 bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-border)]">
                  <span className="text-[8px] font-black uppercase tracking-wider text-emerald-400 block mb-0.5">To</span>
                  <p className="text-xs font-black text-[var(--color-text)] uppercase truncate">{targetAccount?.name || "Target"}</p>
                  <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                    {(targetAccount as any)?.lastFour ? `•••• ${(targetAccount as any).lastFour}` : "Account"}
                  </p>
                </div>
              </div>
            ) : (
              /* Standard Single Account Display */
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white border border-black/20 shrink-0">
                    <CreditCard className="w-5 h-5 stroke-[2.5px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-[var(--color-text)] uppercase tracking-wide truncate">
                      {sourceAccount?.name || "Active Account"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {sourceAccount?.type || "Account"}
                      </span>
                      {(sourceAccount as any)?.lastFour && (
                        <span className="text-[10px] font-mono text-gray-500 font-bold">
                          •••• {(sourceAccount as any).lastFour}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {sourceAccount?.balance !== undefined && (
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-gray-500 block">Balance</span>
                    <span className="text-xs font-black font-numbers tabular-nums text-[var(--color-text)]">
                      {formatCurrency(sourceAccount.balance, sourceAccount.currency || txn.currency)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Group Split Hero Section */}
          {txn.splits && txn.splits.length > 0 && (
            <SplitDetailsHero
              txn={txn}
              onToggleParticipantSettled={handleToggleParticipantSettled}
              onCopyPaymentRequest={handleCopyPaymentRequest}
            />
          )}

          {/* Location & Geolocation Card */}
          {locationDisplay && (
            <div className="bg-[var(--color-surface)] rounded-[22px] overflow-hidden border-2 border-[var(--color-border)]">
              <div className="p-3.5 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 stroke-[2.5px]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase font-black tracking-widest text-gray-500 block mb-0.5">Location</span>
                    <p className="text-xs font-bold text-[var(--color-text)] uppercase truncate">{locationDisplay}</p>
                    {hasCoordinates && (
                      <span className="text-[10px] font-mono text-gray-500 font-bold mt-0.5 block">
                        {Number(parsedLocation?.lat).toFixed(4)}°, {Number(parsedLocation?.lon).toFixed(4)}°
                      </span>
                    )}
                  </div>
                </div>

                {mapsUrl && (
                  <a 
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-1.5 rounded-xl hover:bg-blue-500/20 transition-all shrink-0 active:scale-95"
                  >
                    <span>Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Notes & Memo Input */}
          <div className="bg-[var(--color-surface)] rounded-[22px] p-3.5 border-2 border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] uppercase font-black tracking-widest text-gray-500 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Notes & Memo
              </span>
              <span className="text-[9px] text-gray-500 font-bold">Auto-saves</span>
            </div>
            <div className="relative">
              <textarea 
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[14px] p-3 text-xs font-bold text-[var(--color-text)] placeholder-gray-500 outline-none focus:border-[var(--color-primary)] resize-none transition-all"
                placeholder="Add notes about this transaction..."
                rows={2}
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                onBlur={handleNoteBlur}
              />
            </div>
          </div>

          {/* Audit & ID Block */}
          <div className="grid grid-cols-2 gap-2.5">
            <div 
              onClick={handleCopyId}
              className="bg-[var(--color-surface)] rounded-[18px] p-3 border-2 border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-surfaceHover)] transition-all active:scale-95 flex items-center justify-between"
            >
              <div>
                <span className="text-[8px] uppercase font-black tracking-widest text-gray-500 block mb-0.5">Transaction ID</span>
                <span className="text-xs text-[var(--color-text)] font-bold font-mono">TXN_{txn.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <div className="text-gray-500">
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3px]" /> : <Copy className="w-3.5 h-3.5" />}
              </div>
            </div>

            <div className="bg-[var(--color-surface)] rounded-[18px] p-3 border-2 border-[var(--color-border)] flex items-center justify-between">
              <div>
                <span className="text-[8px] uppercase font-black tracking-widest text-gray-500 block mb-0.5">Status</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={cn("w-2.5 h-2.5 rounded-full border border-black/30", isFlagged ? "bg-yellow-400" : "bg-emerald-400")} />
                  <span className="text-xs text-[var(--color-text)] font-black uppercase tracking-wide">{isFlagged ? "Needs Review" : "Completed"}</span>
                </div>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          {/* Danger Zone: Delete */}
          <div className="pt-1">
            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-black uppercase tracking-wider transition-all active:scale-98"
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

