"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { vibrate, getCategoryIcon, ICON_MAP } from "@/lib/utils/helpers";
import { 
  Camera, Loader2, Sparkles, MapPin, X, ChevronLeft, ChevronDown, Search, Plus, Tag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TransactionEntity } from "@/lib/db/indexeddb";
import { resolveLocationFromCoordinates, parseGoogleMapsUrl } from "@/lib/utils/location";

interface TransactionFormProps {
  onSuccess: () => void;
  editingTransaction?: TransactionEntity;
}

const formatDateYYYYMMDD = (d: Date) => {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTimeHHMM = (d: Date) => {
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

export function TransactionForm({ onSuccess, editingTransaction }: TransactionFormProps) {
  const { transactions, addTransaction, updateTransaction } = useTransactions();
  const { categories, addCategory } = useCategories();
  const { accounts } = useAccounts();
  
  const [type, setType] = useState<"expense" | "income" | "transfer">(editingTransaction?.type || "expense");
  const [amount, setAmount] = useState(editingTransaction?.amount?.toString() || "");
  const [description, setDescription] = useState(editingTransaction?.description || "");
  const [note, setNote] = useState(editingTransaction?.note || "");
  const [payee, setPayee] = useState(editingTransaction?.payee || "");
  const [location, setLocation] = useState(editingTransaction?.location || "");
  const [isLocationManuallySet, setIsLocationManuallySet] = useState(!!editingTransaction?.location);
  
  const [date, setDate] = useState(
    editingTransaction?.date 
      ? formatDateYYYYMMDD(new Date(editingTransaction.date))
      : formatDateYYYYMMDD(new Date())
  );
  
  const [time, setTime] = useState(
    editingTransaction?.date 
      ? formatTimeHHMM(new Date(editingTransaction.date))
      : formatTimeHHMM(new Date())
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
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationInput, setLocationInput] = useState(() => {
    if (editingTransaction?.location) {
      try {
        const loc = JSON.parse(editingTransaction.location);
        if (loc.display || loc.city || loc.place_name) {
          return loc.display || loc.city || loc.place_name;
        }
        if (loc.lat && loc.lon) {
          return `${Number(loc.lat).toFixed(4)}, ${Number(loc.lon).toFixed(4)}`;
        }
        return editingTransaction.location;
      } catch {
        return editingTransaction.location;
      }
    }
    return "";
  });

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Custom Dropdowns & Keypad states
  const [showKeypad, setShowKeypad] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showToAccountDropdown, setShowToAccountDropdown] = useState(false);
  
  // Auto-suggest states
  const [showPayeeSuggestions, setShowPayeeSuggestions] = useState(false);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryManuallySet, setIsCategoryManuallySet] = useState(false);
  const [isAccountManuallySet, setIsAccountManuallySet] = useState(false);
  
  const [showOptionalDetails, setShowOptionalDetails] = useState(
    !!(editingTransaction?.payee || editingTransaction?.description || editingTransaction?.location || editingTransaction?.note)
  );

  // Notes inline tag states
  const [activeTagIndex, setActiveTagIndex] = useState<{ start: number, end: number, query: string } | null>(null);
  const [selectedWordRange, setSelectedWordRange] = useState<{ start: number, end: number, text: string } | null>(null);

  // Derive existing data for suggestions
  const existingPayees = Array.from(new Set(transactions.map(t => t.payee).filter(Boolean))) as string[];
  const payeeSuggestions = payee.trim() ? existingPayees.filter(p => p.toLowerCase().includes(payee.toLowerCase()) && p !== payee) : [];

  const existingItems = Array.from(new Set(transactions.map(t => t.description).filter(Boolean))) as string[];
  const itemSuggestions = description.trim() ? existingItems.filter(i => i.toLowerCase().includes(description.toLowerCase()) && i !== description) : [];

  const allTags = Array.from(new Set(
    transactions.flatMap(t => t.note?.match(/#[a-zA-Z0-9_]+/g) || [])
  )).map(t => t.slice(1));
  const tagSuggestions = activeTagIndex ? allTags.filter(t => t.toLowerCase().includes(activeTagIndex.query.toLowerCase())) : [];

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNote(val);
    
    // Check if cursor is currently typing a hashtag
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const hashMatch = textBeforeCursor.match(/#([a-zA-Z0-9_]*)$/);
    if (hashMatch) {
      setActiveTagIndex({
        start: cursor - hashMatch[0].length,
        end: cursor,
        query: hashMatch[1]
      });
    } else {
      setActiveTagIndex(null);
    }
  };

  const handleNoteSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    if (start !== end && end - start > 0 && end - start < 30) {
      const text = target.value.substring(start, end);
      if (/^[a-zA-Z0-9_]+$/.test(text.trim())) {
        setSelectedWordRange({ start, end, text: text.trim() });
      } else {
        setSelectedWordRange(null);
      }
    } else {
      setSelectedWordRange(null);
    }
  };

  const insertTag = (tagName: string) => {
    if (!activeTagIndex) return;
    const { start, end } = activeTagIndex;
    const newNote = note.substring(0, start) + `#${tagName} ` + note.substring(end);
    setNote(newNote);
    setActiveTagIndex(null);
    vibrate([10]);
  };

  const convertToTag = () => {
    if (!selectedWordRange) return;
    const { start, end, text } = selectedWordRange;
    const newNote = note.substring(0, start) + `#${text}` + note.substring(end);
    setNote(newNote);
    setSelectedWordRange(null);
    vibrate([10]);
  };

  const evaluateExpression = (expr: string): string => {
    try {
      const sanitized = expr.replace(/[^0-9+\-*/.]/g, "");
      if (!sanitized) return "";
      
      const cleaned = sanitized.replace(/[+\-*/]+$/, "");
      if (!cleaned) return "";

      const result = new Function(`return ${cleaned}`)();
      if (result === undefined || isNaN(result) || !isFinite(result)) {
        return "";
      }
      return Number(Number(result).toFixed(2)).toString();
    } catch {
      return "";
    }
  };

  const handleKeypadPress = (val: string) => {
    vibrate([15]);
    if (val === "C") {
      setAmount("");
    } else if (val === "⌫") {
      setAmount((prev) => prev.slice(0, -1));
    } else if (val === "=") {
      setAmount((prev) => {
        const evaluated = evaluateExpression(prev);
        return evaluated || prev;
      });
    } else if (val === "Next") {
      setAmount((prev) => {
        const evaluated = evaluateExpression(prev);
        return evaluated || prev;
      });
      setShowKeypad(false);
      setShowOptionalDetails(true);
      setTimeout(() => {
        const nextField = document.getElementById("payee-input") || document.getElementById("item-name-input");
        nextField?.focus();
      }, 100);
    } else {
      setAmount((prev) => {
        const operators = ["+", "-", "*", "/"];
        const isNewOperator = operators.includes(val);
        const lastChar = prev.slice(-1);
        const isLastOperator = operators.includes(lastChar);
        
        if (isNewOperator && isLastOperator) {
          return prev.slice(0, -1) + val;
        }
        return prev + val;
      });
    }
  };

  const handleQuickAdd = (val: number) => {
    setAmount((prev) => {
      const hasOperators = /[+\-*/]/.test(prev);
      if (hasOperators) {
        return prev + "+" + val;
      } else {
        const current = parseFloat(prev) || 0;
        return (current + val).toString();
      }
    });
  };

  const suggestCategoryAndAccount = (
    currentPayee: string,
    currentType: string,
    currentLocation: string
  ) => {
    if (!transactions || transactions.length === 0) return null;

    const cleanedPayee = currentPayee.trim().toLowerCase();
    const typeTransactions = transactions.filter(t => t.type === currentType);
    if (typeTransactions.length === 0) return null;

    let matchingTxs = cleanedPayee
      ? typeTransactions.filter(t => t.payee?.toLowerCase().trim() === cleanedPayee)
      : [];

    let suggestedCatId = "";
    if (matchingTxs.length > 0) {
      const catCounts: Record<string, number> = {};
      matchingTxs.forEach(t => {
        if (t.categoryId) {
          catCounts[t.categoryId] = (catCounts[t.categoryId] || 0) + 1;
        }
      });
      const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
      if (sortedCats.length > 0) {
        suggestedCatId = sortedCats[0][0];
      }
    }

    let suggestedAccountId = "";
    let locationTxs: typeof transactions = [];
    if (currentLocation) {
      let locQuery = currentLocation.toLowerCase();
      try {
        const parsed = JSON.parse(currentLocation);
        locQuery = (parsed.display || parsed.city || parsed.place_name || currentLocation).toLowerCase();
      } catch (e) {}

      locationTxs = typeTransactions.filter(t => {
        if (!t.location) return false;
        try {
          const loc = JSON.parse(t.location);
          const name = (loc.display || loc.city || loc.place_name || t.location).toLowerCase();
          return name.includes(locQuery) || locQuery.includes(name);
        } catch (e) {
          return t.location.toLowerCase().includes(locQuery);
        }
      });
    }

    const accountSourceTxs = 
      matchingTxs.length > 0 && locationTxs.length > 0
        ? matchingTxs.filter(t => locationTxs.includes(t))
        : matchingTxs.length > 0
        ? matchingTxs
        : locationTxs.length > 0
        ? locationTxs
        : typeTransactions;

    if (accountSourceTxs.length > 0) {
      const accCounts: Record<string, number> = {};
      accountSourceTxs.forEach(t => {
        if (t.accountId) {
          accCounts[t.accountId] = (accCounts[t.accountId] || 0) + 1;
        }
      });
      const sortedAccs = Object.entries(accCounts).sort((a, b) => b[1] - a[1]);
      if (sortedAccs.length > 0) {
        suggestedAccountId = sortedAccs[0][0];
      }
    }

    let suggestedLocation = "";
    if (matchingTxs.length > 0 && !currentLocation) {
      const locCounts: Record<string, number> = {};
      matchingTxs.forEach(t => {
        if (t.location) {
          locCounts[t.location] = (locCounts[t.location] || 0) + 1;
        }
      });
      const sortedLocs = Object.entries(locCounts).sort((a, b) => b[1] - a[1]);
      if (sortedLocs.length > 0) {
        suggestedLocation = sortedLocs[0][0];
      }
    }

    return { 
      categoryId: suggestedCatId, 
      accountId: suggestedAccountId,
      location: suggestedLocation
    };
  };

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
        if (parsed.payee) setPayee(parsed.payee);
        if (parsed.location) setLocation(parsed.location);
        
        if (parsed.date) {
          const dObj = new Date(parsed.date);
          if (!isNaN(dObj.getTime())) {
            setDate(formatDateYYYYMMDD(dObj));
            setTime(formatTimeHHMM(dObj));
          }
        }
      } catch (e) {}
    }
  }, [editingTransaction]);

  useEffect(() => {
    if (editingTransaction) return;
    if (amount || description || note || payee || location) {
      const combinedDateTime = new Date(`${date}T${time}`).toISOString();
      sessionStorage.setItem("tx_draft", JSON.stringify({ amount, description, note, type, date: combinedDateTime, payee, location }));
    }
  }, [amount, description, note, type, date, time, payee, location, editingTransaction]);

  useEffect(() => {
    if (editingTransaction) return;

    if (!payee.trim()) {
      if (!isCategoryManuallySet && availableCategories.length > 0) {
        setCategoryId(availableCategories[0].id);
      }
      if (!isAccountManuallySet && accounts.length > 0) {
        setAccountId(accounts.find(a => a.isDefault)?.id || accounts[0].id);
      }
      return;
    }
    
    const suggestions = suggestCategoryAndAccount(payee, type, location);
    if (suggestions) {
      if (suggestions.categoryId && !isCategoryManuallySet) {
        const cat = categories.find(c => c.id === suggestions.categoryId);
        if (cat && cat.type === type) {
          setCategoryId(suggestions.categoryId);
        }
      }
      if (suggestions.accountId && !isAccountManuallySet) {
        setAccountId(suggestions.accountId);
      }
      if (suggestions.location && !isLocationManuallySet) {
        setLocation(suggestions.location);
        try {
          const loc = JSON.parse(suggestions.location);
          setLocationInput(loc.display || loc.city || loc.place_name || suggestions.location);
        } catch {
          setLocationInput(suggestions.location);
        }
      }
    }
  }, [payee, type, location, transactions, categories, editingTransaction, isCategoryManuallySet, isAccountManuallySet, isLocationManuallySet, availableCategories, accounts]);

  const fetchLocation = async () => {
    setLocationLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      const { latitude, longitude } = pos.coords;
      const richLoc = await resolveLocationFromCoordinates(latitude, longitude);
      if (richLoc) {
        setLocation(JSON.stringify(richLoc));
        setLocationInput(richLoc.display || richLoc.city || richLoc.place_name || "");
      } else {
        setLocation(JSON.stringify({ lat: latitude, lon: longitude, source: "manual_gps" }));
        setLocationInput(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
      setIsLocationManuallySet(true);
    } catch {
      setLocation("");
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    if (!locationInput) return;
    const isUrl = locationInput.includes("http");
    if (isUrl) {
      const processUrl = async () => {
        setLocationLoading(true);
        let url = locationInput;
        try {
          if (url.includes("maps.app.goo.gl")) {
            const res = await fetch("/api/expand-url", { 
              method: "POST", 
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url }) 
            });
            const data = await res.json();
            if (data.expandedUrl) url = data.expandedUrl;
          }
          const parsed = parseGoogleMapsUrl(url);
          if (parsed) {
            if (parsed.lat && parsed.lon) {
              const rich = await resolveLocationFromCoordinates(parsed.lat, parsed.lon);
              if (rich && rich.display) parsed.display = rich.display;
            }
            setLocation(JSON.stringify(parsed));
            setLocationInput(parsed.display || url);
            setIsLocationManuallySet(true);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLocationLoading(false);
        }
      };
      processUrl();
    }
  }, [locationInput]);

  const getLocationDisplay = () => {
    if (!location) return null;
    try {
      const loc = JSON.parse(location);
      const text = loc.display || loc.city || loc.place_name || null;
      if (!text) return null;
      if (loc.source === "google_link" || loc.source === "overpass") {
        return `📍 ${text}`;
      }
      return text;
    } catch {
      return location;
    }
  };

  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocationInput(val);
    setIsLocationManuallySet(true);
    try {
      const existing = location ? JSON.parse(location) : {};
      setLocation(JSON.stringify({ ...existing, display: val, source: "manual" }));
    } catch {
      setLocation(JSON.stringify({ display: val, source: "manual" }));
    }
  };

  const handleClearLocation = () => {
    setLocation("");
    setLocationInput("");
    setIsLocationManuallySet(true);
  };

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

  const handleTypeChange = (newType: "expense" | "income" | "transfer") => {
    setType(newType);
    if (newType !== "transfer") {
      const newCategories = categories.filter(c => c.type === newType);
      setCategoryId(newCategories[0]?.id || "");
    }
    setIsCreatingCategory(false);
    setShowCategoryDropdown(false);
    setShowAccountDropdown(false);
    setShowToAccountDropdown(false);
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
    const evaluatedAmount = evaluateExpression(amount) || amount;
    if (!evaluatedAmount || isNaN(Number(evaluatedAmount))) return;
    if (!accountId) return;
    if (type === "transfer" && (!toAccountId || accountId === toAccountId)) return;

    setIsSubmitting(true);
    try {
      const rawDesc = description.trim();
      const rawPayee = payee.trim();

      const combinedDateTime = new Date(`${date}T${time}`).toISOString();

      const txData = {
        amount: Number(evaluatedAmount),
        type,
        currency: "INR",
        description: rawDesc || (type === "transfer" ? "Transfer" : "Quick Entry"),
        date: combinedDateTime,
        note: note.trim(),
        categoryId: type === "transfer" ? undefined : (categoryId || "other"),
        accountId,
        toAccountId: type === "transfer" ? toAccountId : undefined,
        needsReview,
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
        sessionStorage.removeItem("tx_draft");
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

  const showLivePreview = /[+\-*/]/.test(amount);
  const livePreviewValue = showLivePreview ? evaluateExpression(amount) : "";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-[75vh] md:h-auto max-h-[85vh] overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none pb-28">
        
        {/* Main Details Card - Structured Stacking Context relative z-30 */}
        <div className="relative z-30 p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-4 backdrop-blur-md">
          {/* Type Toggle */}
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800/60">
            {(["expense", "income", "transfer"] as const).map((t) => {
              const isActive = type === t;
              const activeClasses = 
                t === "expense" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                t === "income" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                "bg-blue-500/20 text-blue-400 border border-blue-500/30";
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all active:scale-[0.98] ${
                    isActive ? activeClasses : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* Amount field */}
          <div className="relative z-20">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Amount</label>
                {showLivePreview && livePreviewValue && (
                  <span className="text-[10px] text-emerald-400 font-semibold truncate animate-pulse bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    = ₹{livePreviewValue}
                  </span>
                )}
              </div>
              <label className="flex items-center gap-1 text-[10px] text-violet-400 font-semibold cursor-pointer hover:text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-lg border border-violet-500/20">
                {isScanning ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Camera className="w-2.5 h-2.5" />}
                <span>Scan</span>
                <input type="file" accept="image/*" onChange={handleScanReceipt} className="hidden" disabled={isScanning} />
              </label>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg font-semibold">₹</span>
              <input
                type="text"
                inputMode="none"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onFocus={() => {
                  setShowKeypad(true);
                  setShowCategoryDropdown(false);
                  setShowAccountDropdown(false);
                  setShowToAccountDropdown(false);
                }}
                onClick={() => {
                  setShowKeypad(true);
                  setShowCategoryDropdown(false);
                  setShowAccountDropdown(false);
                  setShowToAccountDropdown(false);
                }}
                className={`w-full bg-slate-950/40 border border-slate-800/80 rounded-xl pl-9 pr-4 py-3 text-lg font-bold text-white transition-all shadow-inner outline-none ${activeFocus}`}
                placeholder="0.00"
                required
                autoFocus={!editingTransaction}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const evaluated = evaluateExpression(amount);
                    if (evaluated) setAmount(evaluated);
                    setShowKeypad(false);
                  }
                }}
              />
            </div>

            {/* Quick Add and Clear */}
            <div className="flex gap-1.5 mt-2">
              {[100, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    handleQuickAdd(val);
                    vibrate([20]);
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold bg-slate-900 border border-slate-800/80 rounded-lg text-slate-400 hover:text-white transition-all active:scale-95"
                >
                  +{val}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setAmount("");
                  vibrate([20]);
                }}
                className="px-2.5 py-1 text-[10px] font-bold bg-slate-900 border border-slate-800/80 rounded-lg text-red-400 hover:text-red-300 transition-all active:scale-95 ml-auto"
              >
                Clear
              </button>
            </div>

            {/* Custom Keypad & Calculator Panel - Placed directly below the Amount field */}
            <AnimatePresence>
              {showKeypad && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden bg-slate-950/90 border border-slate-800/60 rounded-2xl p-3 space-y-2 mt-3 shadow-2xl relative z-40"
                >
                  <div className="grid grid-cols-4 gap-1.5 text-center text-sm font-semibold select-none">
                    <button type="button" onClick={() => handleKeypadPress("C")} className="h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 transition-all active:scale-95">C</button>
                    <button type="button" onClick={() => handleKeypadPress("⌫")} className="h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 transition-all active:scale-95 flex items-center justify-center">⌫</button>
                    <button type="button" onClick={() => handleKeypadPress("/")} className="h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all active:scale-95">/</button>
                    <button type="button" onClick={() => handleKeypadPress("*")} className="h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all active:scale-95">*</button>

                    <button type="button" onClick={() => handleKeypadPress("7")} className="h-10 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-all active:scale-95">7</button>
                    <button type="button" onClick={() => handleKeypadPress("8")} className="h-10 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-all active:scale-95">8</button>
                    <button type="button" onClick={() => handleKeypadPress("9")} className="h-10 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-all active:scale-95">9</button>
                    <button type="button" onClick={() => handleKeypadPress("-")} className="h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all active:scale-95">-</button>

                    <button type="button" onClick={() => handleKeypadPress("4")} className="h-10 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-all active:scale-95">4</button>
                    <button type="button" onClick={() => handleKeypadPress("5")} className="h-10 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-all active:scale-95">5</button>
                    <button type="button" onClick={() => handleKeypadPress("6")} className="h-10 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-all active:scale-95">6</button>
                    <button type="button" onClick={() => handleKeypadPress("+")} className="h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all active:scale-95">+</button>

                    <button type="button" onClick={() => handleKeypadPress("1")} className="h-10 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-all active:scale-95">1</button>
                    <button type="button" onClick={() => handleKeypadPress("2")} className="h-10 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-all active:scale-95">2</button>
                    <button type="button" onClick={() => handleKeypadPress("3")} className="h-10 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-all active:scale-95">3</button>
                    <button type="button" onClick={() => handleKeypadPress("=")} className="h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/20 transition-all active:scale-95">=</button>

                    <button type="button" onClick={() => handleKeypadPress("0")} className="h-10 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-all active:scale-95">0</button>
                    <button type="button" onClick={() => handleKeypadPress(".")} className="h-10 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-all active:scale-95">.</button>
                    <button type="button" onClick={() => handleKeypadPress("Next")} className="col-span-2 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all active:scale-95">Next</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Date & Time Selection (Side by Side) - relative z-10 */}
          <div className="relative z-10 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onFocus={() => {
                  setShowKeypad(false);
                  setShowCategoryDropdown(false);
                  setShowAccountDropdown(false);
                  setShowToAccountDropdown(false);
                }}
                className={`w-full bg-slate-950/40 border border-slate-800/80 rounded-xl px-3 py-2.5 text-xs text-white transition-all shadow-inner outline-none ${activeFocus}`}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                onFocus={() => {
                  setShowKeypad(false);
                  setShowCategoryDropdown(false);
                  setShowAccountDropdown(false);
                  setShowToAccountDropdown(false);
                }}
                className={`w-full bg-slate-950/40 border border-slate-800/80 rounded-xl px-3 py-2.5 text-xs text-white transition-all shadow-inner outline-none ${activeFocus}`}
                required
              />
            </div>
          </div>

          {/* Custom Select Dropdowns Row - relative z-25 */}
          {type !== "transfer" ? (
            <div className="relative z-25 grid grid-cols-2 gap-3">
              <div className="relative z-50">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryDropdown(!showCategoryDropdown);
                      setShowAccountDropdown(false);
                      setShowToAccountDropdown(false);
                      setShowKeypad(false);
                    }}
                    className={`w-full text-left bg-slate-950/40 border border-slate-800/80 rounded-xl px-3 py-2.5 text-white transition-all shadow-inner outline-none flex items-center justify-between ${activeFocus}`}
                  >
                    {(() => {
                      const selectedCat = categories.find(c => c.id === categoryId);
                      if (!selectedCat) {
                        return <span className="text-slate-500 text-xs">Select...</span>;
                      }
                      const IconComp = getCategoryIcon(selectedCat.icon);
                      return (
                        <span className="flex items-center gap-1.5 min-w-0">
                          <span 
                            className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${selectedCat.color}20` }}
                          >
                            <IconComp className="w-2.5 h-2.5" style={{ color: selectedCat.color }} />
                          </span>
                          <span className="text-xs font-semibold truncate">{selectedCat.name}</span>
                        </span>
                      );
                    })()}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  </button>

                  <AnimatePresence>
                    {showCategoryDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-[60] left-0 right-[-100px] md:right-0 mt-2 bg-slate-950/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-3 flex flex-col gap-2 max-h-[280px] overflow-hidden"
                      >
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Search..."
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg pl-8 pr-2 py-1.5 text-[11px] text-white placeholder-slate-500 outline-none focus:border-violet-500/50"
                          />
                        </div>

                        {(() => {
                          const typedCats = categories.filter(c => c.type === type);
                          if (typedCats.length === 0) return null;

                          const counts: Record<string, number> = {};
                          transactions.forEach(t => {
                            if (t.categoryId) counts[t.categoryId] = (counts[t.categoryId] || 0) + 1;
                          });
                          const suggested = typedCats
                            .map(c => ({ ...c, count: counts[c.id] || 0 }))
                            .sort((a, b) => b.count - a.count)
                            .slice(0, 3);

                          if (suggested.length === 0) return null;

                          return (
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">Suggestions</span>
                              <div className="flex flex-wrap gap-1">
                                {suggested.map(cat => {
                                  const IconComp = getCategoryIcon(cat.icon);
                                  return (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => {
                                        setCategoryId(cat.id);
                                        setIsCategoryManuallySet(true);
                                        setShowCategoryDropdown(false);
                                      }}
                                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800/50 text-[10px] text-slate-300 hover:text-white transition-all"
                                    >
                                      <span className="w-3 h-3 rounded-full flex items-center justify-center" style={{ backgroundColor: `${cat.color}20` }}>
                                        <IconComp className="w-2 h-2" style={{ color: cat.color }} />
                                      </span>
                                      {cat.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 scrollbar-none">
                          {categories
                            .filter(c => c.type === type && c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                            .map(cat => {
                              const IconComp = getCategoryIcon(cat.icon);
                              const isSelected = cat.id === categoryId;
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => {
                                    setCategoryId(cat.id);
                                    setIsCategoryManuallySet(true);
                                    setShowCategoryDropdown(false);
                                  }}
                                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-[11px] transition-colors ${
                                    isSelected ? "bg-slate-900 text-white font-medium border border-slate-800" : "text-slate-300 hover:bg-slate-900/50 hover:text-white"
                                  }`}
                                >
                                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cat.color}20` }}>
                                    <IconComp className="w-3 h-3" style={{ color: cat.color }} />
                                  </span>
                                  <span className="flex-1 truncate">{cat.name}</span>
                                </button>
                              );
                            })}
                          
                          <button
                            type="button"
                            onClick={() => {
                              setIsCreatingCategory(true);
                              setShowCategoryDropdown(false);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-[11px] text-violet-400 hover:bg-slate-900/50 transition-colors font-semibold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>New Category</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="relative z-45">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Account</label>
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAccountDropdown(!showAccountDropdown);
                      setShowCategoryDropdown(false);
                      setShowToAccountDropdown(false);
                      setShowKeypad(false);
                    }}
                    className={`w-full text-left bg-slate-950/40 border border-slate-800/80 rounded-xl px-3 py-2.5 text-white transition-all shadow-inner outline-none flex items-center justify-between ${activeFocus}`}
                  >
                    {(() => {
                      const selectedAcc = accounts.find(a => a.id === accountId);
                      if (!selectedAcc) {
                        return <span className="text-slate-500 text-xs">Select...</span>;
                      }
                      return <span className="text-xs font-semibold truncate">{selectedAcc.name}</span>;
                    })()}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  </button>

                  <AnimatePresence>
                    {showAccountDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-[60] left-[-60px] md:left-0 right-0 mt-2 bg-slate-950/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 max-h-[220px] overflow-y-auto scrollbar-none"
                      >
                        {accounts.length === 0 ? (
                          <div className="text-slate-500 text-[11px] p-2 text-center">No accounts</div>
                        ) : (
                          accounts.map((acc) => {
                            const isSelected = acc.id === accountId;
                            return (
                              <button
                                key={acc.id}
                                type="button"
                                onClick={() => {
                                  setAccountId(acc.id);
                                  setIsAccountManuallySet(true);
                                  setShowAccountDropdown(false);
                                }}
                                className={`w-full px-3 py-2 rounded-lg text-left text-[11px] transition-colors ${
                                  isSelected ? "bg-slate-900 text-white font-medium border border-slate-800" : "text-slate-300 hover:bg-slate-900/50 hover:text-white"
                                }`}
                              >
                                {acc.name}
                              </button>
                            );
                          })
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative z-25 grid grid-cols-2 gap-3">
              <div className="relative z-50">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">From Account</label>
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAccountDropdown(!showAccountDropdown);
                      setShowToAccountDropdown(false);
                      setShowCategoryDropdown(false);
                      setShowKeypad(false);
                    }}
                    className={`w-full text-left bg-slate-950/40 border border-slate-800/80 rounded-xl px-3 py-2.5 text-white transition-all shadow-inner outline-none flex items-center justify-between ${activeFocus}`}
                  >
                    {(() => {
                      const selectedAcc = accounts.find(a => a.id === accountId);
                      if (!selectedAcc) {
                        return <span className="text-slate-500 text-xs">Select...</span>;
                      }
                      return <span className="text-xs font-semibold truncate">{selectedAcc.name}</span>;
                    })()}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  </button>

                  <AnimatePresence>
                    {showAccountDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-[60] left-0 right-0 mt-2 bg-slate-950/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 max-h-[220px] overflow-y-auto scrollbar-none"
                      >
                        {accounts.map((acc) => {
                          const isSelected = acc.id === accountId;
                          return (
                            <button
                              key={acc.id}
                              type="button"
                              onClick={() => {
                                setAccountId(acc.id);
                                setIsAccountManuallySet(true);
                                setShowAccountDropdown(false);
                              }}
                              className={`w-full px-3 py-2 rounded-lg text-left text-[11px] transition-colors ${
                                isSelected ? "bg-slate-900 text-white font-medium border border-slate-800" : "text-slate-300 hover:bg-slate-900/50 hover:text-white"
                              }`}
                            >
                                {acc.name}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="relative z-45">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">To Account</label>
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowToAccountDropdown(!showToAccountDropdown);
                      setShowAccountDropdown(false);
                      setShowCategoryDropdown(false);
                      setShowKeypad(false);
                    }}
                    className={`w-full text-left bg-slate-950/40 border border-slate-800/80 rounded-xl px-3 py-2.5 text-white transition-all shadow-inner outline-none flex items-center justify-between ${activeFocus}`}
                  >
                    {(() => {
                      const selectedAcc = accounts.find(a => a.id === toAccountId);
                      if (!selectedAcc) {
                        return <span className="text-slate-500 text-xs">Select...</span>;
                      }
                      return <span className="text-xs font-semibold truncate">{selectedAcc.name}</span>;
                    })()}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  </button>

                  <AnimatePresence>
                    {showToAccountDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-[60] left-[-60px] md:left-0 right-0 mt-2 bg-slate-950/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 max-h-[220px] overflow-y-auto scrollbar-none"
                      >
                        <option value="" disabled>Select destination</option>
                        {accounts.filter(a => a.id !== accountId).map((acc) => {
                          const isSelected = acc.id === toAccountId;
                          return (
                            <button
                              key={acc.id}
                              type="button"
                              onClick={() => {
                                setToAccountId(acc.id);
                                setIsAccountManuallySet(true);
                                setShowToAccountDropdown(false);
                              }}
                              className={`w-full px-3 py-2 rounded-lg text-left text-[11px] transition-colors ${
                                isSelected ? "bg-slate-900 text-white font-medium border border-slate-800" : "text-slate-300 hover:bg-slate-900/50 hover:text-white"
                              }`}
                            >
                              {acc.name}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}

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
                    className={`flex-1 bg-slate-950/40 border border-slate-800/80 rounded-lg px-3 py-2 text-xs text-white transition-all outline-none ${activeFocus}`} 
                  />
                  <button type="button" onClick={handleQuickAddCategory} className="px-3 py-2 bg-violet-600 hover:bg-violet-500 transition-colors rounded-lg text-white text-xs font-semibold shadow-lg shadow-violet-500/20">Add</button>
                  <button type="button" onClick={() => setIsCreatingCategory(false)} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 transition-colors rounded-lg text-slate-300 text-xs">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowOptionalDetails(!showOptionalDetails);
            setShowKeypad(false);
            setShowCategoryDropdown(false);
            setShowAccountDropdown(false);
            setShowToAccountDropdown(false);
          }}
          className="w-full py-2.5 px-4 rounded-xl border border-slate-800/80 bg-slate-950/20 text-slate-400 hover:text-white transition-all text-xs font-semibold flex items-center justify-between hover:bg-slate-900/20 active:scale-[0.99]"
        >
          <span>{showOptionalDetails ? "Hide Optional Details" : "Show Optional Details"}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showOptionalDetails ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {showOptionalDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 overflow-hidden pt-1 relative z-20"
            >
              <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-4 backdrop-blur-md">
                
                {/* Payee / Merchant with Auto Suggest */}
                {type !== "transfer" && (
                  <div className="relative">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Payee / Merchant</label>
                    <input
                      id="payee-input"
                      type="text"
                      value={payee}
                      onFocus={() => {
                        setShowKeypad(false);
                        setShowCategoryDropdown(false);
                        setShowAccountDropdown(false);
                        setShowToAccountDropdown(false);
                        setShowPayeeSuggestions(true);
                      }}
                      onBlur={() => setTimeout(() => setShowPayeeSuggestions(false), 200)}
                      onChange={(e) => {
                        setPayee(e.target.value);
                        setShowPayeeSuggestions(true);
                      }}
                      className={`w-full bg-slate-950/40 border border-slate-800/80 rounded-xl px-3 py-2.5 text-xs text-white transition-all shadow-inner outline-none ${activeFocus}`}
                      placeholder="E.g., Uber, Starbucks, Amazon..."
                    />
                    <AnimatePresence>
                      {showPayeeSuggestions && payeeSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute z-[70] left-0 right-0 mt-1 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-40 overflow-y-auto"
                        >
                          {payeeSuggestions.slice(0, 5).map(p => (
                            <button
                              key={p}
                              type="button"
                              onMouseDown={() => {
                                setPayee(p);
                                setShowPayeeSuggestions(false);
                                vibrate([10]);
                              }}
                              className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border-b border-slate-800/50 last:border-0"
                            >
                              {p}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Item Name with Auto Suggest */}
                <div className="relative">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Item Name</label>
                  <input
                    id="item-name-input"
                    type="text"
                    value={description}
                    onFocus={() => {
                      setShowKeypad(false);
                      setShowCategoryDropdown(false);
                      setShowAccountDropdown(false);
                      setShowToAccountDropdown(false);
                      setShowItemSuggestions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowItemSuggestions(false), 200)}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setShowItemSuggestions(true);
                    }}
                    className={`w-full bg-slate-950/40 border border-slate-800/80 rounded-xl px-3 py-2.5 text-xs text-white transition-all shadow-inner outline-none ${activeFocus}`}
                    placeholder={type === "transfer" ? "Transfer" : "E.g., Grocery Shopping, Coffee..."}
                  />
                  <AnimatePresence>
                    {showItemSuggestions && itemSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute z-[70] left-0 right-0 mt-1 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-40 overflow-y-auto"
                      >
                        {itemSuggestions.slice(0, 5).map(i => (
                          <button
                            key={i}
                            type="button"
                            onMouseDown={() => {
                              setDescription(i);
                              setShowItemSuggestions(false);
                              vibrate([10]);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border-b border-slate-800/50 last:border-0"
                          >
                            {i}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Location */}
                <div className="relative">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Location</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={locationInput}
                      onFocus={() => {
                        setShowKeypad(false);
                        setShowCategoryDropdown(false);
                        setShowAccountDropdown(false);
                        setShowToAccountDropdown(false);
                      }}
                      onChange={handleLocationInputChange}
                      className={`flex-1 min-w-0 bg-slate-950/40 border border-slate-800/80 rounded-xl pl-3 pr-8 py-2.5 text-xs text-white transition-all shadow-inner outline-none ${activeFocus}`}
                      placeholder="Search or paste map link..."
                    />
                    <AnimatePresence>
                      {locationInput && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          type="button"
                          onClick={handleClearLocation}
                          className="absolute right-[52px] top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-full transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                    <button
                      type="button"
                      onClick={async () => {
                        vibrate([15]);
                        await fetchLocation();
                      }}
                      disabled={locationLoading}
                      className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-slate-950/40 border border-slate-800/80 text-slate-400 hover:bg-slate-900/40 hover:text-white transition-all outline-none ${activeFocus}`}
                      title="Use current location"
                    >
                      {locationLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-violet-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Notes with Inline Hashtags */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Notes</label>
                    <AnimatePresence>
                      {selectedWordRange && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          type="button"
                          onClick={convertToTag}
                          className="text-[10px] font-bold bg-violet-600/20 text-violet-400 px-2 py-0.5 rounded border border-violet-500/30 hover:bg-violet-500/30 transition-colors flex items-center gap-1"
                        >
                          <Tag className="w-3 h-3" />
                          Convert to #{selectedWordRange.text}
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative">
                    <div 
                      className="absolute inset-0 pointer-events-none px-3 py-2.5 text-xs whitespace-pre-wrap break-words border border-transparent overflow-hidden"
                      aria-hidden="true"
                    >
                      {note.split(/(#[a-zA-Z0-9_]+)/g).map((part, i) => 
                        part.startsWith('#') 
                          ? <span key={i} className="bg-violet-500/40 text-transparent rounded-sm">{part}</span> 
                          : <span key={i} className="text-transparent">{part}</span>
                      )}
                    </div>
                    <textarea
                      id="notes-input"
                      value={note}
                      onFocus={() => {
                        setShowKeypad(false);
                        setShowCategoryDropdown(false);
                        setShowAccountDropdown(false);
                        setShowToAccountDropdown(false);
                      }}
                      onChange={handleNoteChange}
                      onSelect={handleNoteSelect}
                      rows={2}
                      className={`relative z-10 w-full bg-slate-950/40 border border-slate-800/80 rounded-xl px-3 py-2.5 text-xs text-white transition-all shadow-inner outline-none resize-none bg-transparent ${activeFocus}`}
                      placeholder="E.g., split with friends... Use #tag for tags"
                    />
                  </div>
                  
                  <AnimatePresence>
                    {activeTagIndex && tagSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute z-[70] left-0 right-0 bottom-full mb-1 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-40 overflow-y-auto"
                      >
                        {tagSuggestions.slice(0, 5).map(t => (
                          <button
                            key={t}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent blur
                              insertTag(t);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-violet-300 hover:bg-slate-800 hover:text-violet-200 transition-colors border-b border-slate-800/50 last:border-0 flex items-center gap-1"
                          >
                            <Tag className="w-3 h-3 opacity-70" /> {t}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Needs Review Toggle - relative z-10 */}
        <div className="relative z-10 flex items-center justify-between p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 backdrop-blur-md">
          <div className="pr-4">
            <label className="block text-xs font-semibold text-amber-500 uppercase tracking-wider">Needs Review</label>
            <p className="text-[10px] text-amber-500/70 mt-0.5 leading-tight">
              Flag this transaction for verification or matching later.
            </p>
          </div>
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

      <div className="absolute bottom-0 inset-x-0 p-4 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-md flex-shrink-0 z-20">
        <button
          type="submit"
          disabled={isSubmitting || !amount}
          className={`w-full py-3.5 font-semibold text-sm rounded-xl transition-all disabled:opacity-50 active:scale-[0.98] ${
            type === "expense"
              ? "bg-red-600 hover:bg-red-500 hover:shadow-red-500/20 text-white shadow-lg shadow-red-600/10"
              : type === "income"
              ? "bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/20 text-white shadow-lg shadow-emerald-600/10"
              : "bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/20 text-white shadow-lg shadow-blue-600/10"
          }`}
        >
          {isSubmitting ? "Saving..." : editingTransaction ? "Update Transaction" : `Save ${type === "expense" ? "Expense" : type === "income" ? "Income" : "Transfer"}`}
        </button>
      </div>



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
                <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                <div className="absolute inset-[-20px] rounded-full border-2 border-fuchsia-500/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
                
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
