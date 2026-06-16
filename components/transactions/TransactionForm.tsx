"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { vibrate } from "@/lib/utils/helpers";
import { Camera, Loader2, Sparkles, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TransactionFormProps {
  onSuccess: () => void;
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const { addTransaction } = useTransactions();
  const { categories, addCategory } = useCategories();
  const { accounts } = useAccounts();
  const [type, setType] = useState<"expense" | "income" | "transfer">("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  
  const availableCategories = categories.filter(c => c.type === type);
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [needsReview, setNeedsReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Restore draft from sessionStorage if modal was accidentally closed
  useEffect(() => {
    const draft = sessionStorage.getItem("tx_draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.amount) setAmount(parsed.amount);
        if (parsed.note) setNote(parsed.note);
        if (parsed.type) setType(parsed.type);
      } catch (e) {}
    }
  }, []);

  // Save draft to prevent data loss
  useEffect(() => {
    if (amount || note) {
      sessionStorage.setItem("tx_draft", JSON.stringify({ amount, note, type }));
    }
  }, [amount, note, type]);

  // Set default category and account when loaded
  useEffect(() => {
    if (availableCategories.length > 0 && (!categoryId || !availableCategories.find(c => c.id === categoryId))) {
      setCategoryId(availableCategories[0].id);
    }
    if (accounts.length > 0) {
      if (!accountId) {
        setAccountId(accounts.find(a => a.isDefault)?.id || accounts[0].id);
      }
    }
  }, [availableCategories, categoryId, accounts, accountId]);

  // Update category when type changes
  const handleTypeChange = (newType: "expense" | "income" | "transfer") => {
    setType(newType);
    if (newType !== "transfer") {
      const newCategories = categories.filter(c => c.type === newType);
      setCategoryId(newCategories[0]?.id || "");
    }
    setIsCreatingCategory(false);
  };

  const handleQuickAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const newId = crypto.randomUUID();
    await addCategory({
      id: newId,
      name: newCategoryName.trim(),
      type: type === "transfer" ? "expense" : type,
      color: "#8B5CF6", // Default to violet
      icon: "tag"
    });
    setCategoryId(newId);
    setIsCreatingCategory(false);
    setNewCategoryName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    if (!accountId) return; // Prevent submission without account
    if (type === "transfer" && (!toAccountId || accountId === toAccountId)) return;

    setIsSubmitting(true);
    try {
      await addTransaction({
        id: crypto.randomUUID(),
        amount: Number(amount),
        type,
        currency: "INR",
        description: note || (type === "transfer" ? "Transfer" : "New Transaction"),
        date: new Date().toISOString(),
        note,
        categoryId: type === "transfer" ? undefined : (categoryId || "other"),
        accountId,
        toAccountId: type === "transfer" ? toAccountId : undefined,
        needsReview,
      });
      sessionStorage.removeItem("tx_draft"); // Clear draft on success
      vibrate([50]);
      onSuccess();
    } catch (err) {
      console.error(err);
      vibrate([50, 50, 50]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsScanning(true);
    try {
      // Extract Base64 and MimeType
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });
      const base64Img = await base64Promise;
      const mimeType = file.type;

      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Img, mimeType })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "OCR Failed");
      }
      
      if (data.total) {
        setAmount(data.total.toString());
        vibrate([50, 50]);
      } else {
        alert("Could not detect the total amount.");
      }

      if (data.items) {
        setNote(data.items);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error scanning receipt. Ensure the API is reachable.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Toggle */}
      <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => handleTypeChange("expense")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${type === "expense" ? "bg-red-500/20 text-red-400" : "text-slate-400"}`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("income")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${type === "income" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400"}`}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("transfer")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${type === "transfer" ? "bg-blue-500/20 text-blue-400" : "text-slate-400"}`}
        >
          Transfer
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-slate-400">Amount</label>
          <label className="flex items-center gap-1.5 text-xs text-violet-400 font-medium cursor-pointer hover:text-violet-300">
            {isScanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
            <span>{isScanning ? "Scanning..." : "Scan Receipt"}</span>
            <input type="file" accept="image/*" onChange={handleScanReceipt} className="hidden" disabled={isScanning} />
          </label>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      {type !== "transfer" && (
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
          <select
            value={categoryId}
            onChange={(e) => {
              if (e.target.value === "NEW") {
                setIsCreatingCategory(true);
                setCategoryId("");
              } else {
                setCategoryId(e.target.value);
              }
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none appearance-none"
            required={!isCreatingCategory}
          >
            {categories.length === 0 ? (
              <option value="" disabled>No categories available</option>
            ) : (
              categories.filter((c) => c.type === type).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))
            )}
            <option value="NEW" className="text-violet-400 font-medium">+ Add New Category</option>
          </select>
          
          {/* Inline Category Creator */}
          <AnimatePresence>
            {isCreatingCategory && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: "auto", opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2"
              >
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newCategoryName} 
                    onChange={e => setNewCategoryName(e.target.value)} 
                    placeholder="New category name..." 
                    autoFocus
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-violet-500 outline-none" 
                  />
                  <button type="button" onClick={handleQuickAddCategory} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 transition-colors rounded-lg text-white text-sm font-medium shadow-lg shadow-violet-500/20">Add</button>
                  <button type="button" onClick={() => setIsCreatingCategory(false)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 transition-colors rounded-lg text-slate-300 text-sm">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {type === "transfer" ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">From Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none appearance-none"
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))!}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">To Account</label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none appearance-none"
              required
            >
              <option value="" disabled>Select destination</option>
              {accounts.filter(a => a.id !== accountId).map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Account</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none appearance-none"
            required
          >
            {accounts.length === 0 ? (
              <option value="" disabled>No accounts available</option>
            ) : (
              accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))
            )}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none resize-none"
          placeholder="E.g., John owes $20 for pizza, Sarah owes $15..."
        />
      </div>

      <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
        <div>
          <label className="block text-sm font-medium text-amber-500">Needs Review</label>
          <p className="text-[10px] text-amber-500/70 mt-0.5 leading-tight">
            Flag this transaction to double-check amounts or wait for friend confirmations.
          </p>
        </div>
        <div className="flex-shrink-0 ml-4">
          <button
            type="button"
            onClick={() => setNeedsReview(!needsReview)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${needsReview ? 'bg-amber-500' : 'bg-slate-700'}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${needsReview ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !amount}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl py-3 mt-2 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : `Save ${type === "expense" ? "Expense" : type === "income" ? "Income" : "Transfer"}`}
      </button>

      {/* AI Scanning Engaging Overlay - Blocks interaction & prevents data loss */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="relative mb-8"
              >
                {/* Outer pulsing rings */}
                <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                <div className="absolute inset-[-20px] rounded-full border-2 border-fuchsia-500/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
                
                {/* Center orb */}
                <div className="relative bg-gradient-to-br from-violet-600 to-fuchsia-600 h-24 w-24 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.5)]">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-t-2 border-r-2 border-white/30"
                  />
                  <Sparkles className="h-10 w-10 text-white animate-pulse" />
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center space-y-3 px-6"
              >
                <h3 className="text-2xl font-bold text-white tracking-tight">AI Vision Engine</h3>
                <div className="flex items-center justify-center gap-2 text-violet-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm font-medium">Extracting totals and itemizing receipt...</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </form>
  );
}
