"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AdaptiveOverlay } from "@/components/ui/AdaptiveOverlay";
import { AccountForm } from "@/components/accounts/AccountForm";
import { Button } from "@/components/ui/Button";

export function AddAccountAction() {
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

      <AdaptiveOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Account">
        <AccountForm onSuccess={() => setIsOpen(false)} />
      </AdaptiveOverlay>
    </>
  );
}
