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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Account Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
          placeholder="e.g. Main Checking"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none appearance-none"
        >
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
          <option value="credit_card">Credit Card</option>
          <option value="wallet">Digital Wallet</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Current Balance</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
          <input
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800">
        <div>
          <label className="block text-sm font-medium text-white">Exclude from Net Worth</label>
          <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
            Ideal for uncounted physical cash or petty cash. Spendings from this account will not affect your overall net worth.
          </p>
        </div>
        <div className="flex-shrink-0 ml-4">
          <button
            type="button"
            onClick={() => setExcludeFromNetWorth(!excludeFromNetWorth)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${excludeFromNetWorth ? 'bg-amber-500' : 'bg-slate-700'}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${excludeFromNetWorth ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !name || !balance}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl py-3 mt-2 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Adding..." : "Add Account"}
      </button>
    </form>
  );
}
