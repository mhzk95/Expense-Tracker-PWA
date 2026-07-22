"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AdaptiveOverlay } from "@/components/ui/AdaptiveOverlay";
import { AccountForm } from "@/components/accounts/AccountForm";

export function AddAccountAction() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest text-white bg-[var(--color-primary)] hover:brightness-110 border-2 border-[var(--color-border)] transition-all shadow-[4px_4px_0px_0px_var(--color-border)] active:translate-x-1 active:translate-y-1 active:shadow-none transform -rotate-2"
      >
        <Plus className="h-4 w-4 stroke-[3px]" />
        Add Account
      </button>

      <AdaptiveOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Account">
        <AccountForm onSuccess={() => setIsOpen(false)} />
      </AdaptiveOverlay>
    </>
  );
}
