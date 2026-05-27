"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Sparkles, Send, X, Command } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { vibrate } from "@/lib/utils/helpers";

export function CommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { addTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  
  // Basic NLP Parsing
  const parseNLP = (text: string) => {
    // E.g. "Spent 15 on coffee", "Got 500 for birthday"
    const match = text.match(/(spent|paid|bought|got)\s+(?:\$|€|₹|£)?\s*(\d+(?:\.\d+)?)\s+(on|for|from)\s+(.+)/i);
    if (!match) return null;
    
    const [, verb, amountStr, , description] = match;
    const isIncome = verb.toLowerCase() === "got";
    
    return {
      type: isIncome ? "income" : "expense",
      amount: parseFloat(amountStr),
      description: description.trim(),
    };
  };

  const parsed = parseNLP(input);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed || isSubmitting) return;
    
    const defaultAccount = accounts.find(a => a.isDefault) || accounts[0];
    if (!defaultAccount) {
       alert("No accounts available to log this transaction.");
       return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        id: crypto.randomUUID(),
        amount: parsed.amount,
        type: parsed.type as any,
        currency: defaultAccount.currency || "INR",
        description: parsed.description.charAt(0).toUpperCase() + parsed.description.slice(1),
        date: new Date().toISOString(),
        categoryId: "other",
        accountId: defaultAccount.id,
      });
      vibrate([50, 50]);
      setInput("");
      setIsOpen(false);
    } catch (err) {
      vibrate([50, 50, 50]);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-[0_4px_20px_rgba(124,58,237,0.5)] hover:bg-violet-500 hover:scale-105 transition-all"
        aria-label="Smart Entry"
      >
        <Sparkles className="h-6 w-6" />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-[20%] left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xl z-50 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
            >
              <div className="p-4 border-b border-slate-800/60 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">Smart Entry</h3>
                  <p className="text-[10px] text-slate-400">Type naturally, e.g. "Spent $15 on coffee"</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="E.g., Spent 45 on gas..."
                    className="w-full bg-transparent border-none text-xl text-white focus:ring-0 px-2 py-4 placeholder:text-slate-600"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                    <button type="button" className="p-2 text-slate-500 hover:text-white bg-slate-800/50 rounded-xl">
                      <Mic className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {parsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-2xl">
                        <div className="flex-1">
                          <p className="text-xs text-violet-300 font-medium">Ready to log</p>
                          <p className="text-sm text-white font-semibold">
                            {parsed.type === "expense" ? "-" : "+"}{parsed.amount} for {parsed.description}
                          </p>
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="h-10 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                          {isSubmitting ? "Saving" : "Save"} <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
