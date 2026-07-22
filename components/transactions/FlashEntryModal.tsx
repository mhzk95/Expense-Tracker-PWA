"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MapPin, Zap } from "lucide-react";
import { vibrate } from "@/lib/utils/helpers";
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
  const { addTransaction, updateTransaction } = useTransactions();
  const [amount, setAmount] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setAmount("");
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
      setAmount((prev) => prev + val);
    }
  };

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) return;
    
    setIsCapturing(true);
    vibrate([50]);

    // 1. Capture Coordinates & Timestamp immediately
    const now = new Date();
    let locationString: string | undefined;

    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => 
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000, maximumAge: 10000 })
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
      type: "expense",
      currency: "INR",
      description: "Quick Entry",
      date: now.toISOString(),
      categoryId: "other", // Default or generic
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
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm"
          >
            <Card className="relative overflow-hidden">
            <ThemeDecal slot="stat-card-tr" />
            
            {/* Header */}
            <div className="bg-[var(--color-primary)] p-4 flex items-center justify-between border-b border-black/10 relative z-10">
              <div className="flex items-center gap-2 text-white font-black uppercase tracking-wider">
                <Zap className="w-5 h-5 fill-white stroke-[2px]" />
                <span className="font-display">Flash Entry</span>
              </div>
              <Badge variant="default">
                <MapPin className="w-3 h-3 stroke-[3px] mr-1" /> Auto-GPS
              </Badge>
            </div>

            {/* Amount Display */}
            <div className="p-8 text-center bg-[var(--color-surface-hover)] border-b-[length:var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--color-border)] relative z-10">
              <span className="text-5xl font-display font-black text-[var(--color-text)] tracking-tight">
                <span className="text-[var(--color-text)]/50 mr-2 text-4xl">₹</span>
                {amount || "0"}
              </span>
            </div>

            {/* Keypad */}
            <div className="p-5 relative z-10">
              <div className="grid grid-cols-3 gap-3">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((btn) => (
                  <Button
                    key={btn}
                    variant="secondary"
                    onClick={() => handleKeypadPress(btn)}
                    className="h-14 text-xl font-numbers font-black"
                  >
                    {btn}
                  </Button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-5">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="h-14 uppercase tracking-wider"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={!amount || isCapturing}
                  className="h-14 uppercase tracking-wider"
                >
                  {isCapturing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Fast"}
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
