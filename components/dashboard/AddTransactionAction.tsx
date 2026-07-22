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
      <Button
        onClick={() => setIsOpen(true)}
        size="sm"
        variant="primary"
        className="gap-1.5"
      >
        <Plus className="h-4 w-4 stroke-[3px]" />
        Add
      </Button>

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
