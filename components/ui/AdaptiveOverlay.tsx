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
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity",
          isOpen ? "opacity-100" : "opacity-0"
        )} 
        onClick={onClose} 
      />

      <div 
        className={cn(
          "relative bg-white border-[4px] border-black overflow-hidden transition-all",
          isBottomSheet 
            ? "w-full max-w-lg mt-auto rounded-t-[32px] border-b-0 self-end translate-y-0 shadow-[0_-8px_0px_0px_rgba(0,0,0,1)]" 
            : "w-[90%] max-w-md rounded-[24px] scale-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
        )}
      >
        {isBottomSheet && (
          <div className="flex justify-center pt-3 pb-1 w-full">
            <div className="h-1.5 w-12 bg-black rounded-full" />
          </div>
        )}
        
        <div className="flex items-center justify-between p-4 sm:p-5 border-b-[4px] border-black">
          <h2 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight">{title}</h2>
          {!isBottomSheet && (
            <button onClick={onClose} className="p-1 rounded-xl bg-gray-100 hover:bg-gray-200 border-2 border-black text-black active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_#000] active:shadow-none">
              <X className="w-6 h-6 stroke-[3px]" />
            </button>
          )}
        </div>

        <div className={cn("p-4 max-h-[80vh] overflow-y-auto", contentClassName)}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
