"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { vibrate } from "@/lib/utils/helpers";
import { Camera, Loader2, Sparkles, MapPin, X, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TransactionEntity } from "@/lib/db/indexeddb";

interface TransactionFormProps {
  onSuccess: () => void;
  editingTransaction?: TransactionEntity;
}

export function TransactionForm({ onSuccess, editingTransaction }: TransactionFormProps) {
  const { addTransaction, updateTransaction } = useTransactions();
  const { categories, addCategory } = useCategories();
  const { accounts } = useAccounts();
  
  const [type, setType] = useState<"expense" | "income" | "transfer">(editingTransaction?.type || "expense");
  const [amount, setAmount] = useState(editingTransaction?.amount?.toString() || "");
  const [description, setDescription] = useState(editingTransaction?.description || "");
  const [note, setNote] = useState(editingTransaction?.note || "");
  const [payee, setPayee] = useState(editingTransaction?.payee || "");
  const [location, setLocation] = useState(editingTransaction?.location || "");
  const [date, setDate] = useState(
    editingTransaction?.date 
      ? new Date(editingTransaction.date).toISOString().split("T")[0] 
      : new Date().toISOString().split("T")[0]
  );
  
  const availableCategories = categories.filter(c => c.type === type);
  const focusStyles = {
    expense: "focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 focus:shadow-[0_0_15px_rgba(239,68,68,0.15)]",
    income: "focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]",
    transfer: "focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]",
  };
  const activeFocus = focusStyles[type];
  
  const [categoryId, setCategoryId] = useState(editingTransaction?.categoryId || "");
  const [accountId, setAccountId] = useState(editingTransaction?.accountId || "");
  const [toAccountId, setToAccountId] = useState(editingTransaction?.toAccountId || "");
  const [needsReview, setNeedsReview] = useState(editingTransaction?.needsReview || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [tempLocationQuery, setTempLocationQuery] = useState("");

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Restore draft from sessionStorage if modal was accidentally closed (only when not editing)
  useEffect(() => {
    if (editingTransaction) return;
    const draft = sessionStorage.getItem("tx_draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.amount) setAmount(parsed.amount);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.note) setNote(parsed.note);
        if (parsed.type) setType(parsed.type);
        if (parsed.date) setDate(parsed.date);
        if (parsed.payee) setPayee(parsed.payee);
        if (parsed.location) setLocation(parsed.location);
      } catch (e) {}
    }
  }, [editingTransaction]);

  // Save draft to prevent data loss (only when not editing)
  useEffect(() => {
    if (editingTransaction) return;
    if (amount || description || note || payee || location) {
      sessionStorage.setItem("tx_draft", JSON.stringify({ amount, description, note, type, date, payee, location }));
    }
  }, [amount, description, note, type, date, payee, location, editingTransaction]);

  const fetchLocation = async () => {
    setLocationLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      const { latitude, longitude } = pos.coords;
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const geo = await r.json();
      const place = geo.address?.suburb || geo.address?.neighbourhood || geo.address?.city_district || "";
      const city = geo.address?.city || geo.address?.town || geo.address?.village || "";
      const country = geo.address?.country || "";
      const displayName = [place, city, country].filter(Boolean).join(", ");
      setLocation(JSON.stringify({ lat: latitude, lng: longitude, place_name: place, city, country, display: displayName }));
    } catch {
      setLocation("");
    } finally {
      setLocationLoading(false);
    }
  };

  const getLocationDisplay = () => {
    if (!location) return null;
    try {
      const loc = JSON.parse(location);
      return loc.display || loc.city || loc.place_name || null;
    } catch {
      return location;
    }
  };

  const handleLocationSelect = (locName: string) => {
    setLocation(JSON.stringify({ display: locName }));
    setShowLocationPicker(false);
  };

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
      const rawDesc = description.trim();
      const rawPayee = payee.trim();
      const isQuickEntry = !rawDesc || (type !== "transfer" && !rawPayee);

      const txData = {
        amount: Number(amount),
        type,
        currency: "INR",
        description: rawDesc || (type === "transfer" ? "Transfer" : "Quick Entry"),
        date: new Date(date).toISOString(),
        note: note.trim(),
        categoryId: type === "transfer" ? undefined : (categoryId || "other"),
        accountId,
        toAccountId: type === "transfer" ? toAccountId : undefined,
        needsReview: needsReview || isQuickEntry,
        status: editingTransaction?.status || "completed",
        payee: type === "transfer" ? undefined : (rawPayee || undefined),
        location: location.trim() || undefined,
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, txData);
      } else {
        await addTransaction({
          id: crypto.randomUUID(),
          ...txData,
        });
        sessionStorage.removeItem("tx_draft"); // Clear draft on success
      }
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
    <form onSubmit={handleSubmit} className="space-y-4 relative">
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

      {/* Amount + Date Compact Horizontal Line Row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-400">Amount</label>
            <label className="flex items-center gap-1 text-[10px] text-violet-400 font-medium cursor-pointer hover:text-violet-300">
              {isScanning ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Camera className="w-2.5 h-2.5" />}
              <span>Scan</span>
              <input type="file" accept="image/*" onChange={handleScanReceipt} className="hidden" disabled={isScanning} />
            </label>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full bg-slate-950/40 border border-slate-800/80 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white transition-all shadow-inner outline-none ${activeFocus}`}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`w-full bg-slate-950/40 border border-slate-800/80 rounded-xl px-3 py-2.5 text-sm text-white transition-all shadow-inner outline-none ${activeFocus}`}
            required
          />
        </div>
      </div>

      {/* Category selector */}
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
            className={`w-full bg-slate-950/40 border border-slate-800/80 rounded-xl px-4 py-3 text-white transition-all shadow-inner outline-none appearance-none ${activeFocus}`}
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
                    className={`flex-1 bg-slate-950/40 border border-slate-800/80 rounded-lg px-3 py-2 text-sm text-white transition-all shadow-inner outline-none ${activeFocus}`} 
                  />
                  <button type="button" onClick={handleQuickAddCategory} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 transition-colors rounded-lg text-white text-sm font-medium shadow-lg shadow-violet-500/20">Add</button>
                  <button type="button" onClick={() => setIsCreatingCategory(false)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 transition-colors rounded-lg text-slate-300 text-sm">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Account / Transfer Destination */}
      {type === "transfer" ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">From Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className={`w-full bg-slate-950/40 border border-slate-800/80 rounded-xl px-4 py-3 text-white transition-all shadow-inner outline-none appearance-none ${activeFocus}`}
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">To Account</label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className={`w-full bg-slate-950/40 border border-slate-800/80 rounded-xl px-4 py-3 text-white transition-all shadow-inner outline-none appearance-none ${activeFocus}`}
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
            className={`w-full bg-slate-950/40 border border-slate-800/80 rounded-xl px-4 py-3 text-white transition-all shadow-inner outline-none appearance-none ${activeFocus}`}
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

      {/* Payee / Merchant (optional) */}
      {type !== "transfer" && (
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Payee / Merchant (optional)</label>
          <input
            type="text"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            className={`w-full bg-slate-950/40 border border-slate-800/80 rounded-xl px-4 py-3 text-white transition-all shadow-inner outline-none ${activeFocus}`}
            placeholder="E.g., Uber, Starbucks, Amazon..."
          />
        </div>
      )}

      {/* Item Name (optional) */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Item Name (optional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`w-full bg-slate-950/40 border border-slate-800/80 rounded-xl px-4 py-3 text-white transition-all shadow-inner outline-none ${activeFocus}`}
          placeholder={type === "transfer" ? "Transfer" : "E.g., Grocery Shopping, Coffee... (Auto: Quick Entry)"}
        />
      </div>

      {/* Location (optional) */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Location (optional)</label>
        <button
          type="button"
          onClick={() => setShowLocationPicker(true)}
          className={`w-full text-left bg-slate-950/40 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-300 transition-all shadow-inner outline-none flex items-center justify-between hover:bg-slate-900/40`}
        >
          <span className="truncate">{getLocationDisplay() || "Add location..."}</span>
          <MapPin className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      {/* Notes (Secondary/Optional) */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Notes (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className={`w-full bg-slate-950/40 border border-slate-800/80 rounded-xl px-4 py-3 text-white transition-all shadow-inner outline-none resize-none ${activeFocus}`}
          placeholder="E.g., split with Rahul, monthly subscription, etc."
        />
      </div>

      <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
        <div>
          <label className="block text-sm font-medium text-amber-500">Needs Review</label>
          <p className="text-[10px] text-amber-500/70 mt-0.5 leading-tight">
            Flag this transaction to double-check amounts or wait for confirmations.
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
        className={`w-full py-3 mt-2 font-medium rounded-xl transition-all disabled:opacity-50 active:scale-[0.98] ${
          type === "expense"
            ? "bg-red-600 hover:bg-red-500 hover:shadow-red-500/20 text-white shadow-lg"
            : type === "income"
            ? "bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/20 text-white shadow-lg"
            : "bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/20 text-white shadow-lg"
        }`}
      >
        {isSubmitting ? "Saving..." : editingTransaction ? "Update Transaction" : `Save ${type === "expense" ? "Expense" : type === "income" ? "Income" : "Transfer"}`}
      </button>

      {/* Fluid Location Picker Overlay */}
      <AnimatePresence>
        {showLocationPicker && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-[-16px] z-50 bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="flex items-center gap-2 p-3 border-b border-slate-800/60 bg-slate-900/50">
              <button type="button" onClick={() => setShowLocationPicker(false)} className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800/50 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <input 
                type="text" 
                autoFocus 
                value={tempLocationQuery} 
                onChange={e => setTempLocationQuery(e.target.value)} 
                placeholder="Search location..." 
                className="flex-1 bg-transparent text-sm text-white font-medium outline-none placeholder-slate-500" 
              />
              <button 
                type="button" 
                onClick={async () => {
                  await fetchLocation();
                  setShowLocationPicker(false);
                }} 
                className={`p-1.5 rounded-full transition-colors ${locationLoading ? "bg-violet-500/20 text-violet-400 animate-pulse" : "bg-slate-800/50 text-violet-400 hover:bg-violet-500 hover:text-white"}`}
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 bg-slate-950 p-4 flex flex-col gap-1 overflow-y-auto">
              <div className="text-[10px] text-slate-500 uppercase font-semibold mb-2 tracking-wider">Suggestions</div>
              {tempLocationQuery ? (
                <button type="button" onClick={() => handleLocationSelect(tempLocationQuery)} className="text-left text-sm text-white py-3 px-3 hover:bg-slate-900 rounded-xl transition-colors font-medium border border-slate-800/50 bg-slate-900/30 font-semibold text-violet-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-violet-400" /> {tempLocationQuery}
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => handleLocationSelect("Current Location")} className="text-left text-sm text-white py-3 px-3 hover:bg-slate-900 rounded-xl transition-colors font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-violet-400" /> Current Location
                  </button>
                  <button type="button" onClick={() => handleLocationSelect("Home")} className="text-left text-sm text-white py-3 px-3 hover:bg-slate-900 rounded-xl transition-colors font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" /> Home
                  </button>
                  <button type="button" onClick={() => handleLocationSelect("Work")} className="text-left text-sm text-white py-3 px-3 hover:bg-slate-900 rounded-xl transition-colors font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" /> Work
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
