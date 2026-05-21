"use client";

import { useAppRuntime, getRuntimeUiConfig } from "@/hooks/useAppRuntime";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/helpers";
import { X } from "lucide-react";

interface AdaptiveOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function AdaptiveOverlay({ isOpen, onClose, title, children }: AdaptiveOverlayProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity",
          isOpen ? "opacity-100" : "opacity-0"
        )} 
        onClick={onClose} 
      />

      {/* Container */}
      <div 
        className={cn(
          "relative bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 transform",
          isBottomSheet 
            ? "w-full max-w-lg mt-auto rounded-t-2xl border-b-0 self-end translate-y-0" 
            : "w-[90%] max-w-md rounded-2xl scale-100",
        )}
      >
        {isBottomSheet && (
          <div className="flex justify-center pt-3 pb-1 w-full">
            <div className="h-1.5 w-12 bg-slate-700 rounded-full" />
          </div>
        )}
        
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {!isBottomSheet && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-4 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
