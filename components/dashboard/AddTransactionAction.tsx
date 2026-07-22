"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AdaptiveOverlay } from "@/components/ui/AdaptiveOverlay";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { Button } from "@/components/ui/Button";

export function AddTransactionAction() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
    <div className="relative group shrink-0 transform -rotate-2">
      {/* Tilted background shadow */}
      <div className="absolute inset-0 bg-[#facc15] border-2 border-[var(--color-border)] rounded-lg translate-x-[4px] translate-y-[4px] shadow-none z-0" />
      <div className="absolute inset-0 bg-black translate-x-1.5 translate-y-1.5 rounded-lg z-0" />
      <div className="relative z-10">
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          className="gap-1.5 bg-[#facc15] text-black border-[3px] border-black rounded-lg font-black uppercase tracking-wider shadow-none hover:bg-[#eab308] hover:translate-x-0 hover:translate-y-0"
          style={{ color: '#000' }}
        >
          <Plus className="h-4 w-4 stroke-[3px]" />
          Add
        </Button>
      </div>
    </div>

      <AdaptiveOverlay 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title="New Transaction"
        contentClassName="p-0 max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden"
      >
        <TransactionForm onSuccess={() => setIsOpen(false)} />
      </AdaptiveOverlay>
    </>
  );
}
