"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MapPin, Zap } from "lucide-react";
import { vibrate } from "@/lib/utils/helpers";
import { useTransactions } from "@/hooks/useTransactions";
import { resolveLocationFromCoordinates } from "@/lib/utils/location";

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
            className="w-full max-w-sm bg-slate-900 border border-violet-500/30 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-violet-600/10 p-4 flex items-center justify-between border-b border-violet-500/20">
              <div className="flex items-center gap-2 text-violet-400 font-bold">
                <Zap className="w-5 h-5 fill-violet-400" />
                <span>Flash Entry</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full font-semibold">
                <MapPin className="w-3 h-3" /> Auto-GPS
              </div>
            </div>

            {/* Amount Display */}
            <div className="p-6 text-center">
              <span className="text-4xl font-bold text-white tracking-tight">
                <span className="text-slate-500 mr-1">₹</span>
                {amount || "0"}
              </span>
            </div>

            {/* Keypad */}
            <div className="p-4 bg-slate-950/50">
              <div className="grid grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => handleKeypadPress(btn)}
                    className="h-14 rounded-2xl bg-slate-800/80 text-xl font-semibold text-white hover:bg-slate-700 active:scale-95 transition-all border border-slate-700/50"
                  >
                    {btn}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={onClose}
                  className="h-12 rounded-xl bg-slate-800 text-sm font-semibold text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!amount || isCapturing}
                  className="h-12 rounded-xl bg-violet-600 text-sm font-bold text-white hover:bg-violet-500 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-violet-600/20"
                >
                  {isCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Fast"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
