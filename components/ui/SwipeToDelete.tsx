"use client";

import React, { useState, useRef, useEffect } from "react";
import { Trash2, Edit2, X } from "lucide-react";
import { vibrate } from "@/lib/utils/helpers";
import toast from "react-hot-toast";

interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
  onEdit?: () => void;
  className?: string;
  style?: React.CSSProperties;
  deleteMessage?: string;
  confirmText?: string;
  cancelText?: string;
  glowColor?: string;
  expanded?: boolean;
}

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  let r = 139, g = 92, b = 246; // fallback violet
  try {
    if (clean.length === 3) {
      r = parseInt(clean[0] + clean[0], 16);
      g = parseInt(clean[1] + clean[1], 16);
      b = parseInt(clean[2] + clean[2], 16);
    } else if (clean.length === 6) {
      r = parseInt(clean.substring(0, 2), 16);
      g = parseInt(clean.substring(2, 4), 16);
      b = parseInt(clean.substring(4, 6), 16);
    }
  } catch (e) {}
  return `${r}, ${g}, ${b}`;
}

function interpolateColor(color1: string, color2: string, factor: number) {
  const parseHex = (hex: string) => {
    const rgbStr = hexToRgb(hex);
    const parts = rgbStr.split(",").map(x => parseInt(x.trim(), 10));
    return { r: parts[0], g: parts[1], b: parts[2] };
  };

  try {
    const rgb1 = color1.startsWith("#") ? parseHex(color1) : { r: 139, g: 92, b: 246 };
    const rgb2 = color2.startsWith("#") ? parseHex(color2) : { r: 239, g: 68, b: 68 };

    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);

    return {
      primary: `rgb(${r}, ${g}, ${b})`,
      glow: `rgba(${r}, ${g}, ${b}, 0.15)`,
    };
  } catch (e) {
    return {
      primary: color1,
      glow: `${color1}26`,
    };
  }
}

export function SwipeToDelete({
  children,
  onDelete,
  onEdit,
  className = "",
  style,
  deleteMessage = "Delete this item?",
  confirmText = "Delete",
  cancelText = "Cancel",
  glowColor = "#8b5cf6",
  expanded = false,
}: SwipeToDeleteProps) {
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isVerticalScroll, setIsVerticalScroll] = useState(false);
  const [isPendingDelete, setIsPendingDelete] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const cardId = useRef(crypto.randomUUID());
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const revealWidth = 80;

  // Execute pending delete on unmount
  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
        onDelete();
      }
    };
  }, [onDelete]);

  // Listen for window scroll to cancel active swipes
  useEffect(() => {
    const handleScroll = () => {
      if (currentX !== 0 || isRevealed) {
        setCurrentX(0);
        setIsRevealed(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentX, isRevealed]);

  // Listen for other cards swiping to close this one
  useEffect(() => {
    const handleActiveCardChange = (e: Event) => {
      const activeId = (e as CustomEvent).detail?.id;
      if (activeId !== cardId.current) {
        setCurrentX(0);
        setIsRevealed(false);
      }
    };
    window.addEventListener("swipe-card-active", handleActiveCardChange);
    return () => window.removeEventListener("swipe-card-active", handleActiveCardChange);
  }, []);

  // Tap outside to collapse
  useEffect(() => {
    if (currentX === 0 && !isRevealed) return;
    const handleDocumentClick = () => {
      setCurrentX(0);
      setIsRevealed(false);
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [currentX, isRevealed]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isPendingDelete || isRevealed) return;
    setStartX(e.touches[0].clientX);
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
    setIsVerticalScroll(false);
    // Notify other components
    window.dispatchEvent(
      new CustomEvent("swipe-card-active", { detail: { id: cardId.current } })
    );
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isPendingDelete || isRevealed || isVerticalScroll) return;
    
    const diffX = e.touches[0].clientX - startX;
    const diffY = e.touches[0].clientY - startY;

    // Check if vertical scrolling is taking place
    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 10) {
      setIsVerticalScroll(true);
      setCurrentX(0);
      return;
    }

    // Allow only swiping left
    if (diffX < 0) {
      setCurrentX(Math.max(diffX, -revealWidth - 20));
    }
  };

  const handleTouchEnd = () => {
    if (isPendingDelete || isRevealed || isVerticalScroll) {
      setIsDragging(false);
      return;
    }
    setIsDragging(false);
    if (currentX <= -50) {
      setIsRevealed(true);
      vibrate([10]);
    }
    setCurrentX(0);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(deleteMessage)) {
      setCurrentX(0);
      setIsRevealed(false);
      return;
    }
    vibrate([50]);
    setIsPendingDelete(true);

    const toastId = toast.success(
      (t) => (
        <div className="flex items-center justify-between gap-4 w-full">
          <span className="text-sm font-medium text-white">Item deleted</span>
          <button
            onClick={() => {
              if (deleteTimeoutRef.current) {
                clearTimeout(deleteTimeoutRef.current);
                deleteTimeoutRef.current = null;
              }
              setIsPendingDelete(false);
              toast.dismiss(toastId);
              vibrate([15]);
            }}
            className="px-2.5 py-1 text-xs font-semibold text-violet-400 hover:text-violet-300 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
          >
            Undo
          </button>
        </div>
      ),
      {
        duration: 5000,
        style: {
          background: "rgba(15, 23, 42, 0.9)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(12px)",
          color: "#fff",
        },
      }
    );

    deleteTimeoutRef.current = setTimeout(() => {
      deleteTimeoutRef.current = null;
      onDelete();
    }, 5000);
  };

  const progress = Math.min(Math.abs(currentX) / revealWidth, 1);
  const colors = interpolateColor(glowColor, "#ef4444", progress);

  const transitionStyle = isDragging
    ? "none"
    : "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)";

  // Parse child and merge styles dynamically
  let clonedChild: React.ReactNode = children;
  try {
    const child = React.Children.only(children) as React.ReactElement<any>;
    const mergedStyle = {
      ...child.props.style,
      "--color-primary": colors.primary,
      "--color-primary-rgb": colors.primary.replace("rgb(", "").replace(")", ""),
      "--color-primary-glow": colors.glow,
      transform: `scale(${1 - progress * 0.02}) translateX(${currentX}px)`,
      transition: transitionStyle,
    };
    clonedChild = React.cloneElement(child, {
      style: mergedStyle,
    });
  } catch (e) {
    console.warn("SwipeToDelete requires a single child element");
  }

  return (
    <div
      className={`relative w-full transition-all duration-300 ease-in-out ${className}`}
      style={{
        maxHeight: isPendingDelete ? "0px" : (expanded ? "600px" : "200px"),
        opacity: isPendingDelete ? 0 : 1,
        transform: isPendingDelete ? "scale(0.95)" : "scale(1)",
        pointerEvents: isPendingDelete ? "none" : "auto",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        ...style,
      }}
    >
      <div
        className="relative w-full flex items-center bg-transparent"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background icon indicating swiped action */}
        {progress > 0 && (
          <div 
            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-0"
            style={{
              opacity: progress * 0.7,
              transform: `scale(${0.8 + progress * 0.2})`,
            }}
          >
            <Trash2 className="w-5 h-5 text-red-500/50" />
          </div>
        )}

        {/* Actions Overlay Card */}
        <div
          className="absolute inset-0 w-full h-full z-20"
          style={{
            opacity: isRevealed ? 1 : 0,
            pointerEvents: isRevealed ? "auto" : "none",
            transform: isRevealed ? "scale(1)" : "scale(0.98)",
            transition: "all 0.25s cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-3 w-full h-full bg-white border-[3px] border-black rounded-[16px] sm:rounded-[24px] shadow-[4px_4px_0px_0px_#000]"
          >
            {/* Title / Info */}
            <span className="text-[13px] sm:text-sm font-black uppercase tracking-widest text-black flex items-center gap-2 truncate pr-2">
              <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: glowColor }} />
              <span className="truncate">{deleteMessage.replace("Delete", "Manage").replace("?", "")}</span>
            </span>

            {/* Compact Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                    setIsRevealed(false);
                  }}
                  className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--color-primary)] hover:bg-violet-400 text-white border-2 sm:border-4 border-black active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_#000] active:shadow-none"
                  title="Edit"
                >
                  <Edit2 className="w-5 h-5 stroke-[3px]" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmDelete(e);
                  setIsRevealed(false);
                }}
                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500 hover:bg-red-400 text-white border-2 sm:border-4 border-black active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_#000] active:shadow-none"
                title="Delete"
              >
                <Trash2 className="w-5 h-5 stroke-[3px]" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRevealed(false);
                  vibrate([10]);
                }}
                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 hover:bg-white text-black border-2 sm:border-4 border-black active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_#000] active:shadow-none"
                title="Cancel"
              >
                <X className="w-5 h-5 stroke-[3px]" />
              </button>
            </div>
          </div>
        </div>

        {/* Child Render container */}
        <div
          className="w-full transition-all z-10"
          style={{
            opacity: isRevealed ? 0 : 1,
            pointerEvents: isRevealed ? "none" : "auto",
            transform: isRevealed ? "scale(0.98)" : "none",
            transition: "all 0.25s cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          {clonedChild}
        </div>
      </div>
    </div>
  );
}
