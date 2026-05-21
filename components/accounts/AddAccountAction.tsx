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
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 transition-all shadow-lg shadow-violet-500/20"
      >
        <Plus className="h-4 w-4" />
        Add Account
      </button>

      <AdaptiveOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Account">
        <AccountForm onSuccess={() => setIsOpen(false)} />
      </AdaptiveOverlay>
    </>
  );
}
