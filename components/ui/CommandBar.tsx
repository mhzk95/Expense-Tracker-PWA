"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Sparkles, Send, X, Command, ImageIcon } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useReminders } from "@/hooks/useReminders";
import { useResearch } from "@/hooks/useResearch";
import { vibrate } from "@/lib/utils/helpers";

export function CommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { addTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const { addReminder } = useReminders();
  const { addItem } = useResearch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsSubmitting(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      await addItem({
        id: crypto.randomUUID(),
        type: "image",
        imageUrl: base64,
        title: "Uploaded Image",
        content: ""
      } as any);
      vibrate([50, 50]);
      setIsOpen(false);
      setIsSubmitting(false);
    };
    reader.readAsDataURL(file);
  };
  
  // Basic NLP Parsing for Transactions, Reminders, and Research
  const parseNLP = (text: string) => {
    // 1. Check if it's a URL -> Research Item
    if (text.trim().match(/^https?:\/\//i)) {
      return { type: "link", url: text.trim(), description: "Save to Inbox" };
    }

    // 2. Check if it's a reminder
    if (text.toLowerCase().startsWith("remind") || text.includes("#")) {
      let priority = "medium";
      let title = text;
      
      // Basic extraction
      if (text.toLowerCase().startsWith("remind me to ")) {
        title = text.substring("remind me to ".length);
      } else if (text.toLowerCase().startsWith("remind me ")) {
        title = text.substring("remind me ".length);
      }

      if (title.toLowerCase().includes("urgent") || title.toLowerCase().includes("critical")) priority = "critical";
      else if (title.toLowerCase().includes("high")) priority = "high";

      // Extract tags
      const tagsMatch = title.match(/#\w+/g);
      const tags = tagsMatch ? tagsMatch.map(t => t.substring(1)) : [];
      title = title.replace(/#\w+/g, "").trim();

      return { type: "reminder", title, priority, tags };
    }

    // 3. Check if it's a Transaction
    const match = text.match(/(spent|paid|bought|got)\s+(?:\$|€|₹|£)?\s*(\d+(?:\.\d+)?)\s+(on|for|from)\s+(.+)/i);
    if (match) {
      const [, verb, amountStr, , description] = match;
      const isIncome = verb.toLowerCase() === "got";
      
      return {
        type: "transaction",
        txType: isIncome ? "income" : "expense",
        amount: parseFloat(amountStr),
        description: description.trim(),
      };
    }

    // 4. Quote
    if (text.trim().startsWith('"') && text.trim().endsWith('"')) {
      return { type: "quote", content: text.trim().slice(1, -1), title: "Saved Quote" };
    }

    // 5. Fallback to Note
    return { type: "note", content: text.trim(), title: "Quick Note" };
  };

  const parsed = parseNLP(input);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      if (parsed.type === "link" || parsed.type === "note" || parsed.type === "quote") {
        let domain = "";
        if (parsed.url) {
          try {
            domain = new URL(parsed.url as string).hostname.replace("www.", "");
          } catch(e) {}
        }

        await addItem({
          id: crypto.randomUUID(),
          type: parsed.type,
          url: parsed.url,
          content: parsed.content,
          domain: domain || undefined,
          title: parsed.title || "Saved Item"
        } as any);
      } else if (parsed.type === "reminder") {
        await addReminder({
          id: crypto.randomUUID(),
          title: parsed.title || "Reminder",
          priority: parsed.priority || "medium",
          contextTags: parsed.tags || [],
          isRecurring: false,
          status: "pending"
        });
      } else if (parsed.type === "transaction") {
        const defaultAccount = accounts.find(a => a.isDefault) || accounts[0];
        if (!defaultAccount) {
           alert("No accounts available to log this transaction.");
           setIsSubmitting(false);
           return;
        }

        await addTransaction({
          id: crypto.randomUUID(),
          amount: parsed.amount as number,
          type: parsed.txType as any,
          currency: defaultAccount.currency || "INR",
          description: (parsed.description as string).charAt(0).toUpperCase() + (parsed.description as string).slice(1),
          date: new Date().toISOString(),
          categoryId: "other",
          accountId: defaultAccount.id,
        });
      }

      vibrate([50, 50]);
      setInput("");
      setIsOpen(false);
    } catch (err) {
      console.error(err);
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
        className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-[16px] bg-[var(--color-primary)] text-white flex items-center justify-center border-2 border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)] hover:bg-[var(--color-primary)]/90 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:translate-x-1.5 active:translate-y-1.5 active:shadow-none transform -rotate-2"
        aria-label="Smart Entry"
      >
        <Sparkles className="h-6 w-6 stroke-[2.5px]" />
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
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-[20%] left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xl z-50 bg-[var(--color-surface)] border-4 border-[var(--color-border)] rounded-[24px] overflow-hidden shadow-[8px_8px_0px_0px_var(--color-border)]"
            >
              <div className="p-4 border-b-4 border-[var(--color-border)] bg-[var(--color-primary)] flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] flex items-center justify-center shadow-brutal-sm">
                  <Sparkles className="h-5 w-5 text-[var(--color-text)] stroke-[2.5px]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-black uppercase tracking-wider">Smart Entry</h3>
                  <p className="text-[10px] text-white/90 font-bold">Log txns, type URLs, or say "Remind me to..."</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white hover:text-white/80 min-w-tap-target min-h-tap-target flex items-center justify-center -mr-2 transition-colors">
                  <X className="h-6 w-6 stroke-[3px]" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-[var(--color-bg)]">
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="E.g., Spent 45 on gas, or https://..."
                    className="w-full bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] text-xl text-[var(--color-text)] font-bold focus:shadow-[4px_4px_0px_0px_var(--color-border)] focus:-translate-x-1 focus:-translate-y-1 transition-all outline-none rounded-[16px] px-4 py-4 placeholder:text-gray-400 pr-20"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="min-w-tap-target min-h-tap-target flex items-center justify-center bg-[var(--color-surface-hover)] border-2 border-[var(--color-border)] rounded-xl text-[var(--color-text)] hover:bg-[var(--color-border)] hover:text-[var(--color-surface)] shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                      <ImageIcon className="h-5 w-5 stroke-[2.5px]" />
                    </button>
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
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
                      <div className="flex items-center gap-3 p-4 bg-[var(--color-primary)] border-[3px] border-[var(--color-border)] rounded-[16px] shadow-brutal text-white">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase font-black tracking-widest opacity-80">Ready to log</p>
                          <p className="text-base font-bold truncate mt-1">
                            {parsed.type === "transaction" 
                              ? `${parsed.txType === "expense" ? "-" : "+"}${parsed.amount} for ${parsed.description}`
                              : parsed.type === "reminder"
                                ? `Remind: ${parsed.title} ${parsed.tags?.length ? `(#${parsed.tags.join(' #')})` : ''} - [${parsed.priority}]`
                                : parsed.type === "quote" || parsed.type === "note"
                                  ? `Save ${parsed.type}: ${parsed.content}`
                                  : `Save URL: ${parsed.url}`}
                          </p>
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="h-12 px-5 shrink-0 rounded-xl bg-[var(--color-border)] text-[var(--color-surface)] text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-all border-2 border-[var(--color-border)] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 shadow-brutal-sm active:shadow-none"
                        >
                          {isSubmitting ? "Saving" : "Save"} <Send className="h-4 w-4 stroke-[3px]" />
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
