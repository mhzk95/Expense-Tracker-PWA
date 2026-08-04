"use client";

import { useState } from "react";
import { useAccounts } from "@/hooks/useAccounts";
import { 
  Building2, CreditCard, PiggyBank, Wallet, Landmark, 
  Coins, Banknote, DollarSign, ArrowLeftRight, Shield, Check, Star
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { vibrate } from "@/lib/utils/helpers";

interface AccountFormProps {
  onSuccess: () => void;
  initialData?: any;
}

const ACCOUNT_ICONS = [
  { name: "Building2", label: "Bank", Icon: Building2 },
  { name: "CreditCard", label: "Card", Icon: CreditCard },
  { name: "PiggyBank", label: "Savings", Icon: PiggyBank },
  { name: "Wallet", label: "Wallet", Icon: Wallet },
  { name: "Landmark", label: "Institution", Icon: Landmark },
  { name: "Coins", label: "Coins", Icon: Coins },
  { name: "Banknote", label: "Cash", Icon: Banknote },
  { name: "DollarSign", label: "Funds", Icon: DollarSign },
];

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#84cc16", // Lime
  "#f59e0b", // Amber
  "#f97316", // Orange
  "#ef4444", // Red
  "#ec4899", // Pink
  "#8b5cf6", // Violet
];

export function AccountForm({ onSuccess, initialData }: AccountFormProps) {
  const { accounts, addAccount, updateAccount, setDefaultAccount } = useAccounts();
  const [name, setName] = useState(initialData?.name || "");
  const [institution, setInstitution] = useState(initialData?.institution || "");
  const [type, setType] = useState(initialData?.type || "checking");
  const [balance, setBalance] = useState(initialData?.balance?.toString() || "");
  const [lastFour, setLastFour] = useState(initialData?.lastFour || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [isDefault, setIsDefault] = useState(initialData?.isDefault ?? accounts.length === 0);
  const [excludeFromNetWorth, setExcludeFromNetWorth] = useState(initialData?.excludeFromNetWorth || false);
  const [color, setColor] = useState(initialData?.color || "#6366f1");
  const [icon, setIcon] = useState(initialData?.icon || "Building2");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (!initialData) {
      if (newType === "savings") {
        setIcon("PiggyBank");
        setColor("#10b981");
      } else if (newType === "credit_card") {
        setIcon("CreditCard");
        setColor("#ef4444");
      } else if (newType === "wallet") {
        setIcon("Wallet");
        setColor("#3b82f6");
      } else if (newType === "cash") {
        setIcon("Banknote");
        setColor("#f59e0b");
      } else {
        setIcon("Building2");
        setColor("#6366f1");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || balance === "" || isNaN(Number(balance))) return;

    setIsSubmitting(true);
    try {
      const sanitizedLastFour = lastFour.trim().slice(-4);
      
      if (initialData) {
        await updateAccount(initialData.id, {
          name: name.trim(),
          institution: institution.trim() || undefined,
          type,
          balance: Number(balance),
          lastFour: sanitizedLastFour || undefined,
          notes: notes.trim() || undefined,
          icon,
          color,
          excludeFromNetWorth,
        });

        if (isDefault && !initialData.isDefault) {
          await setDefaultAccount(initialData.id);
        }
      } else {
        const newId = crypto.randomUUID();
        await addAccount({
          id: newId,
          name: name.trim(),
          institution: institution.trim() || undefined,
          type,
          balance: Number(balance),
          currency: "INR",
          status: "active",
          lastFour: sanitizedLastFour || undefined,
          notes: notes.trim() || undefined,
          includeInNetWorth: true,
          excludeFromNetWorth,
          isDefault: isDefault || accounts.length === 0,
          icon,
          color,
        });

        if (isDefault && accounts.length > 0) {
          await setDefaultAccount(newId);
        }
      }
      onSuccess();
    } catch (err) {
      console.error("Failed to save account", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-4">
      {/* Account Name */}
      <div>
        <label className="block text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest mb-1.5">
          Account Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] font-bold outline-none transition-all focus:border-[var(--color-primary)] text-sm"
          placeholder="e.g. Primary Salary Checking, Apple Card"
          required
        />
      </div>

      {/* Institution & Last 4 Digits (2 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest mb-1.5">
            Bank / Institution (Optional)
          </label>
          <input
            type="text"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            className="w-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] font-bold outline-none transition-all focus:border-[var(--color-primary)] text-sm"
            placeholder="e.g. Chase, HDFC, Revolut"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest mb-1.5">
            Last 4 Digits (Optional)
          </label>
          <input
            type="text"
            maxLength={4}
            value={lastFour}
            onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ""))}
            className="w-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] font-bold font-mono outline-none transition-all focus:border-[var(--color-primary)] text-sm"
            placeholder="e.g. 4892"
          />
        </div>
      </div>

      {/* Type & Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest mb-1.5">
            Account Type
          </label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] font-bold outline-none transition-all appearance-none text-sm cursor-pointer"
          >
            <option value="checking">Checking / Bank</option>
            <option value="savings">Savings Account</option>
            <option value="credit_card">Credit Card</option>
            <option value="wallet">Digital Wallet</option>
            <option value="cash">Cash in Hand</option>
            <option value="investment">Investment / Brokerage</option>
            <option value="loan">Loan / Mortgage</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest mb-1.5">
            Current Balance *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-black">₹</span>
            <input
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl pl-8 pr-4 py-3 text-[var(--color-text)] font-black tabular-nums outline-none transition-all focus:border-[var(--color-primary)] text-sm"
              placeholder="0.00"
              required
            />
          </div>
        </div>
      </div>

      {/* Icon & Color Customization */}
      <div className="space-y-3 p-3.5 bg-[var(--color-bg)] rounded-[16px] border-2 border-[var(--color-border)]">
        <label className="block text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest">
          Card Styling
        </label>
        
        {/* Icon Selection */}
        <div className="flex flex-wrap gap-2">
          {ACCOUNT_ICONS.map((item) => {
            const isSelected = icon === item.name;
            const ItemIcon = item.Icon;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  setIcon(item.name);
                  vibrate([10]);
                }}
                className={`w-9 h-9 flex items-center justify-center rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-[var(--color-border)] bg-[var(--color-primary)] text-black"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)]"
                }`}
                title={item.label}
              >
                <ItemIcon className="w-4 h-4 stroke-[2.5px]" />
              </button>
            );
          })}
        </div>

        {/* Color Palette */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {PRESET_COLORS.map((c) => {
            const isSelected = color.toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  vibrate([10]);
                }}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  isSelected ? "border-[var(--color-border)] scale-110 ring-2 ring-[var(--color-primary)]" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            );
          })}
          
          {/* Custom Color Input */}
          <div 
            className="relative w-7 h-7 rounded-full border-2 border-dashed border-gray-400 hover:border-[var(--color-border)] transition-colors flex items-center justify-center overflow-hidden cursor-pointer ml-auto"
            style={{ backgroundColor: PRESET_COLORS.includes(color.toLowerCase()) ? "transparent" : color }}
          >
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {PRESET_COLORS.includes(color.toLowerCase()) ? (
              <span className="text-[10px] text-gray-400 font-bold pointer-events-none">+</span>
            ) : (
              <span className="w-2 h-2 rounded-full border border-[var(--color-border)] bg-white pointer-events-none" />
            )}
          </div>
        </div>
      </div>

      {/* Account Memo / Notes */}
      <div>
        <label className="block text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest mb-1.5">
          Account Memo / Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text)] font-medium text-xs outline-none transition-all focus:border-[var(--color-primary)] resize-none"
          placeholder="e.g. Main joint expenses, Salary deposit account, Emergency cash"
        />
      </div>

      {/* Default Account Toggle */}
      <div className="flex items-center justify-between p-3.5 bg-[var(--color-bg)] rounded-[16px] border-2 border-[var(--color-border)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-amber-500">
            <Star className="w-4 h-4 fill-amber-500" />
          </div>
          <div>
            <label className="block text-xs font-black text-[var(--color-text)] uppercase tracking-wider">
              Set as Default Account
            </label>
            <p className="text-[10px] font-bold text-gray-500 leading-tight">
              Pre-selected when creating new transactions.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsDefault(!isDefault);
            vibrate([10]);
          }}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-[var(--color-border)] transition-colors duration-200 ease-in-out focus:outline-none ${
            isDefault ? 'bg-amber-400' : 'bg-gray-400'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] transition duration-200 ease-in-out ${
              isDefault ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Exclude from Net Worth Toggle */}
      <div className="flex items-center justify-between p-3.5 bg-[var(--color-bg)] rounded-[16px] border-2 border-[var(--color-border)]">
        <div>
          <label className="block text-xs font-black text-[var(--color-text)] uppercase tracking-wider">
            Exclude from Net Worth
          </label>
          <p className="text-[10px] font-bold text-gray-500 leading-tight">
            Balances will not count toward total net worth calculations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setExcludeFromNetWorth(!excludeFromNetWorth);
            vibrate([10]);
          }}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-[var(--color-border)] transition-colors duration-200 ease-in-out focus:outline-none ${
            excludeFromNetWorth ? 'bg-amber-400' : 'bg-gray-400'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] transition duration-200 ease-in-out ${
              excludeFromNetWorth ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting || !name.trim() || balance === ""}
        variant="primary"
        className="w-full py-3.5 mt-2"
      >
        {isSubmitting ? "Saving..." : initialData ? "Update Account" : "Create Account"}
      </Button>
    </form>
  );
}
