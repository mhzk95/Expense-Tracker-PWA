"use client";

import { useState } from "react";
import { useAccounts } from "@/hooks/useAccounts";

interface AccountFormProps {
  onSuccess: () => void;
}

export function AccountForm({ onSuccess }: AccountFormProps) {
  const { addAccount } = useAccounts();
  const [name, setName] = useState("");
  const [type, setType] = useState("checking");
  const [balance, setBalance] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance || isNaN(Number(balance))) return;

    setIsSubmitting(true);
    try {
      await addAccount({
        id: crypto.randomUUID(),
        name,
        type,
        balance: Number(balance),
        currency: "USD",
        status: "active",
        includeInNetWorth: true,
        isDefault: false,
        color: "#6366f1",
      });
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
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
