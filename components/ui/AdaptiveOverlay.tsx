"use client";

import { useAppRuntime, getRuntimeUiConfig } from "@/hooks/useAppRuntime";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/helpers";
import { X } from "lucide-react";

interface AdaptiveOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  contentClassName?: string;
}

export function AdaptiveOverlay({ isOpen, onClose, title, children, contentClassName }: AdaptiveOverlayProps) {
  const runtime = useAppRuntime();
  const uiConfig = getRuntimeUiConfig(runtime);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const isBottomSheet = uiConfig.modalPresentation === "bottom-sheet";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/80 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0"
        )} 
        onClick={onClose} 
      />

      <div 
        className={cn(
          "relative",
          isBottomSheet 
            ? "w-full max-w-lg mt-auto self-end" 
            : "w-[90%] max-w-md"
        )}
      >
        {/* Tilted background shadow only for centered modals */}
        {!isBottomSheet && (
          <>
            <div className="absolute inset-0 bg-[var(--color-primary)] border-2 border-[var(--color-border)] rounded-[var(--radius-theme-card)] translate-x-2 translate-y-2 z-0" />
            <div className="absolute inset-0 bg-[var(--color-border)] translate-x-2 translate-y-2 rounded-[var(--radius-theme-card)] z-0" />
          </>
        )}
        
        <div 
          className={cn(
            "relative z-10 bg-[var(--color-surface)] border-[length:var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--color-border)] overflow-hidden transition-all h-full",
            isBottomSheet 
              ? "rounded-t-[var(--radius-theme-card)] border-b-0" 
              : "rounded-[var(--radius-theme-card)] scale-100",
          )}
          style={{
            boxShadow: isBottomSheet ? "0 -8px 0px 0px var(--color-border)" : undefined,
            backgroundImage: "var(--theme-bg-card)",
            backgroundBlendMode: "var(--theme-texture-blend)" as any
          }}
        >
        {isBottomSheet && (
          <div className="flex justify-center pt-3 pb-1 w-full">
            <div className="h-1.5 w-12 bg-[var(--color-border)] rounded-full" />
          </div>
        )}
        
        <div className="flex items-center justify-between p-4 sm:p-5 border-b-[length:var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--color-border)]">
          <h2 className="text-xl sm:text-3xl font-display font-black text-[var(--color-text)] uppercase tracking-tight">{title}</h2>
          {!isBottomSheet && (
            <button onClick={onClose} className="p-1 rounded-xl bg-[var(--color-surface-hover)] hover:bg-[var(--color-border)] hover:text-[var(--color-surface)] border-2 border-[var(--color-border)] text-[var(--color-text)] active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-brutal-sm active:shadow-none">
              <X className="w-6 h-6 stroke-[3px]" />
            </button>
          )}
        </div>

        <div className={cn("p-4 max-h-[80vh] overflow-y-auto", contentClassName)}>
          {children}
        </div>
      </div>
      </div>
    </div>,
    document.body
  );
}
