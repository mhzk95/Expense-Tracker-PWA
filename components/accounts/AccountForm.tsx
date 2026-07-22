"use client";

import { useState } from "react";
import { useAccounts } from "@/hooks/useAccounts";

interface AccountFormProps {
  onSuccess: () => void;
  initialData?: any;
}

export function AccountForm({ onSuccess, initialData }: AccountFormProps) {
  const { accounts, addAccount, updateAccount } = useAccounts();
  const [name, setName] = useState(initialData?.name || "");
  const [type, setType] = useState(initialData?.type || "checking");
  const [balance, setBalance] = useState(initialData?.balance?.toString() || "");
  const [excludeFromNetWorth, setExcludeFromNetWorth] = useState(initialData?.excludeFromNetWorth || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance || isNaN(Number(balance))) return;

    setIsSubmitting(true);
    try {
      let iconName = initialData?.icon || "Building2";
      let colorHex = initialData?.color || "#6366f1"; // Default violet

      if (!initialData || initialData.type !== type) {
        if (type === "savings") {
          iconName = "PiggyBank";
          colorHex = "#22c55e"; // Green
        } else if (type === "credit_card") {
          iconName = "CreditCard";
          colorHex = "#f43f5e"; // Rose
        } else if (type === "wallet") {
          iconName = "Wallet";
          colorHex = "#3b82f6"; // Blue
        } else if (type === "checking") {
          iconName = "Building2";
          colorHex = "#6366f1"; // Default violet
        }
      }

      if (initialData) {
        await updateAccount(initialData.id, {
          name,
          type,
          balance: Number(balance),
          icon: iconName,
          color: colorHex,
          excludeFromNetWorth,
        });
      } else {
        await addAccount({
          id: crypto.randomUUID(),
          name,
          type,
          balance: Number(balance),
          currency: "INR",
          status: "active",
          includeInNetWorth: true,
          excludeFromNetWorth,
          isDefault: accounts.length === 0, // Make it default if it's the first account
          icon: iconName,
          color: colorHex,
        });
      }
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const focusClass = "focus: focus:-translate-y-0.5";

  const getButtonClass = () => {
    switch (type) {
      case "savings":
        return "bg-emerald-400";
      case "credit_card":
        return "bg-rose-400";
      case "wallet":
        return "bg-sky-400";
      default: // checking
        return "bg-[var(--color-primary)]";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest mb-1.5">Account Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] font-bold outline-none transition-all ${focusClass}`}
          placeholder="e.g. Main Checking"
          required
        />
      </div>

      <div>
        <label className="block text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest mb-1.5">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={`w-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] font-bold outline-none transition-all appearance-none ${focusClass}`}
        >
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
          <option value="credit_card">Credit Card</option>
          <option value="wallet">Digital Wallet</option>
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest mb-1.5">Current Balance</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
          <input
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className={`w-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl pl-8 pr-4 py-3 text-[var(--color-text)] font-bold outline-none transition-all ${focusClass}`}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-[var(--color-bg)] rounded-[16px] border-2 border-[var(--color-border)]">
        <div>
          <label className="block text-sm font-black text-[var(--color-text)]">Exclude from Net Worth</label>
          <p className="text-[10px] font-bold text-gray-500 mt-0.5 leading-tight uppercase tracking-wider">
            Spendings from this account will not affect overall net worth.
          </p>
        </div>
        <div className="flex-shrink-0 ml-4">
          <button
            type="button"
            onClick={() => setExcludeFromNetWorth(!excludeFromNetWorth)}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-[var(--color-border)] transition-colors duration-200 ease-in-out focus:outline-none ${excludeFromNetWorth ? 'bg-amber-400' : 'bg-gray-300'}`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-border)]  ring-0 transition duration-200 ease-in-out ${excludeFromNetWorth ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !name || !balance}
        className={`w-full text-white font-black uppercase tracking-widest rounded-xl py-3 mt-4 border-2 border-[var(--color-border)]  transition-all active:scale-[0.98] active:translate-y-1 active:translate-x-1 active:shadow-none disabled:opacity-50 ${getButtonClass()}`}
      >
        {isSubmitting ? "Adding..." : initialData ? "Update Account" : "Add Account"}
      </button>
    </form>
  );
}
