"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MapPin, Zap, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { vibrate, cn } from "@/lib/utils/helpers";
import { useTransactions } from "@/hooks/useTransactions";
import { resolveLocationFromCoordinates } from "@/lib/utils/location";
import { ThemeDecal } from "@/components/ui/ThemeDecal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface FlashEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAccountId: string;
}

export function FlashEntryModal({ isOpen, onClose, defaultAccountId }: FlashEntryModalProps) {
  const { addTransaction } = useTransactions();
  const [amount, setAmount] = useState("");
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [isCapturing, setIsCapturing] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setTxType("expense");
      setIsCapturing(false);
    }
  }, [isOpen]);

  const handleKeypadPress = (val: string) => {
    vibrate([15]);
    if (val === "C") {
      setAmount("");
    } else if (val === "⌫") {
      setAmount((prev) => prev.slice(0, -1));
    } else {
      if (val === "." && amount.includes(".")) return;
      if (amount.length >= 8) return;
      setAmount((prev) => prev + val);
    }
  };

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    
    setIsCapturing(true);
    vibrate([50]);

    // 1. Capture Coordinates & Timestamp immediately
    const now = new Date();
    let locationString: string | undefined;

    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => 
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000, maximumAge: 10000 })
      );
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      
      const richLoc = await resolveLocationFromCoordinates(lat, lon);
      if (richLoc) {
        locationString = JSON.stringify(richLoc);
      } else {
        locationString = JSON.stringify({ lat, lon, source: "manual_gps" });
      }
    } catch (err) {
      console.warn("Flash Entry: Failed to get location:", err);
    }

    // 2. Save Transaction
    const tempId = crypto.randomUUID();
    
    await addTransaction({
      id: tempId,
      amount: Number(amount),
      type: txType,
      currency: "INR",
      description: txType === "expense" ? "Flash Expense" : "Flash Income",
      date: now.toISOString(),
      categoryId: "other",
      accountId: defaultAccountId,
      location: locationString,
      status: "completed",
      needsReview: false
    });

    // 3. Close for the user
    setIsCapturing(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm"
          >
            <Card className="relative overflow-hidden border-2 border-[var(--color-border)] rounded-[24px]">
              <ThemeDecal slot="stat-card-tr" />
              
              {/* Header */}
              <div className="bg-[var(--color-primary)] p-3.5 flex items-center justify-between border-b-2 border-[var(--color-border)] relative z-10">
                <div className="flex items-center gap-2 text-white font-black uppercase tracking-wider text-sm">
                  <Zap className="w-4 h-4 fill-white stroke-[2px]" />
                  <span className="font-display">Flash Entry</span>
                </div>
                <Badge variant="default" className="text-[10px] py-0.5">
                  <MapPin className="w-3 h-3 stroke-[2.5px] mr-1" /> Auto-GPS
                </Badge>
              </div>

              {/* Type Switcher Pill */}
              <div className="p-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    vibrate([10]);
                    setTxType("expense");
                  }}
                  className={cn(
                    "flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all flex items-center justify-center gap-1.5",
                    txType === "expense"
                      ? "bg-rose-500 text-white border-rose-600 shadow-sm"
                      : "bg-[var(--color-surface)] border-transparent text-gray-400 hover:text-[var(--color-text)]"
                  )}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  Expense
                </button>

                <button
                  type="button"
                  onClick={() => {
                    vibrate([10]);
                    setTxType("income");
                  }}
                  className={cn(
                    "flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all flex items-center justify-center gap-1.5",
                    txType === "income"
                      ? "bg-emerald-500 text-black border-emerald-600 shadow-sm"
                      : "bg-[var(--color-surface)] border-transparent text-gray-400 hover:text-[var(--color-text)]"
                  )}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Income
                </button>
              </div>

              {/* Amount Display */}
              <div className="p-6 text-center bg-[var(--color-surfaceHover)] border-b-2 border-[var(--color-border)] relative z-10">
                <span className="text-4xl font-display font-black text-[var(--color-text)] tracking-tight font-numbers tabular-nums">
                  <span className="text-gray-500 mr-1.5 text-3xl font-normal">₹</span>
                  {amount || "0"}
                </span>
              </div>

              {/* Keypad */}
              <div className="p-4 relative z-10">
                <div className="grid grid-cols-3 gap-2">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((btn) => (
                    <Button
                      key={btn}
                      variant="secondary"
                      onClick={() => handleKeypadPress(btn)}
                      className="h-12 text-lg font-numbers font-black tabular-nums border-2 border-[var(--color-border)] rounded-xl active:scale-95"
                    >
                      {btn}
                    </Button>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-2.5 mt-4">
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="h-12 uppercase tracking-wider text-xs font-black border-2 border-[var(--color-border)] rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={!amount || Number(amount) <= 0 || isCapturing}
                    className="h-12 uppercase tracking-wider text-xs font-black rounded-xl border-2 border-[var(--color-border)] shadow-none"
                  >
                    {isCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Fast"}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

