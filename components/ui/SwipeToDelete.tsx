"use client";

import React, { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { vibrate } from "@/lib/utils/helpers";
import toast from "react-hot-toast";

interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
  className?: string;
  style?: React.CSSProperties;
  deleteMessage?: string;
  confirmText?: string;
  cancelText?: string;
  glowColor?: string;
}

function interpolateColor(color1: string, color2: string, factor: number) {
  const parseHex = (hex: string) => {
    const clean = hex.replace("#", "");
    if (clean.length === 3) {
      return {
        r: parseInt(clean[0] + clean[0], 16),
        g: parseInt(clean[1] + clean[1], 16),
        b: parseInt(clean[2] + clean[2], 16),
      };
    }
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
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
  className = "",
  style,
  deleteMessage = "Delete this item?",
  confirmText = "Delete",
  cancelText = "Cancel",
  glowColor = "#8b5cf6",
}: SwipeToDeleteProps) {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPendingDelete, setIsPendingDelete] = useState(false);

  const cardId = useRef(crypto.randomUUID());
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      if (currentX !== 0 || isConfirming) {
        setCurrentX(0);
        setIsConfirming(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentX, isConfirming]);

  // Listen for other cards swiping to close this one
  useEffect(() => {
    const handleActiveCardChange = (e: Event) => {
      const activeId = (e as CustomEvent).detail?.id;
      if (activeId !== cardId.current) {
        setCurrentX(0);
        setIsConfirming(false);
      }
    };
    window.addEventListener("swipe-card-active", handleActiveCardChange);
    return () => window.removeEventListener("swipe-card-active", handleActiveCardChange);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isConfirming || isPendingDelete) return;
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
    // Notify other components
    window.dispatchEvent(
      new CustomEvent("swipe-card-active", { detail: { id: cardId.current } })
    );
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isConfirming || isPendingDelete) return;
    const diff = e.touches[0].clientX - startX;
    // Allow only swiping left
    if (diff < 0) {
      setCurrentX(Math.max(diff, -100));
    }
  };

  const handleTouchEnd = () => {
    if (isConfirming || isPendingDelete) return;
    setIsDragging(false);
    if (currentX <= -60) {
      setIsConfirming(true);
      setCurrentX(0);
      vibrate([10]);
    } else {
      setCurrentX(0);
    }
  };

  const handleCancel = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsConfirming(false);
    setCurrentX(0);
    vibrate([10]);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate([50]);
    setIsConfirming(false);
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

  const progress = Math.min(Math.abs(currentX) / 80, 1);
  const colors = interpolateColor(glowColor, "#ef4444", isConfirming ? 1 : progress);

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
      "--color-primary-glow": colors.glow,
      transform: `scale(${1 - progress * 0.03}) translateX(${currentX * 0.3}px)`,
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
        maxHeight: isPendingDelete ? "0px" : "200px",
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
        {/* Child Render container */}
        <div
          className="w-full transition-all"
          style={{
            opacity: isConfirming ? 0 : 1,
            pointerEvents: isConfirming ? "none" : "auto",
            transform: isConfirming ? "scale(0.95)" : "none",
            transition: "all 0.25s cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          {clonedChild}
        </div>

        {/* Live Delete Trash Icon Indicator */}
        {progress > 0.05 && !isConfirming && (
          <div
            className="absolute right-6 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none z-10"
            style={{
              opacity: progress,
              transform: `translateY(-50%) scale(${0.8 + progress * 0.2})`,
            }}
          >
            <Trash2 className="w-5 h-5 animate-pulse" />
          </div>
        )}

        {/* Transformed Confirmation Card overlay */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            opacity: isConfirming ? 1 : 0,
            pointerEvents: isConfirming ? "auto" : "none",
            transform: isConfirming ? "scale(1)" : "scale(0.95)",
            transition: "all 0.25s cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          <div
            className="glass-card flex items-center justify-between px-5 py-4 w-full h-full min-h-[58px]"
            style={{
              "--color-primary": "#ef4444",
              "--color-primary-glow": "rgba(239, 68, 68, 0.15)",
            } as React.CSSProperties}
          >
            <span className="text-sm font-semibold text-white flex items-center gap-2 truncate pr-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span className="truncate">{deleteMessage}</span>
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 rounded-xl transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-950/40 transition-colors"
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
