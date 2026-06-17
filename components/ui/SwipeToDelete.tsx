"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { vibrate } from "@/lib/utils/helpers";

interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function SwipeToDelete({ children, onDelete, className = "", style }: SwipeToDeleteProps) {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX;
    // Only allow swiping left
    if (diff < 0) {
      setCurrentX(Math.max(diff, -80)); // max swipe distance
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (currentX <= -50) {
      setCurrentX(-80); // Snap open
      vibrate([10]); // subtle tick when snapping open
    } else {
      setCurrentX(0); // Snap back
    }
  };

  // Close swipe if user clicks outside
  useEffect(() => {
    const handleClickOutside = () => setCurrentX(0);
    if (currentX !== 0) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [currentX]);

  return (
    <div className={`relative w-full overflow-hidden group ${className}`} style={style}>


      {/* Swipeable Content */}
      <div 
        className="relative w-full transition-transform flex items-center bg-transparent"
        style={{ transform: `translateX(${currentX}px)`, transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.32, 0.72, 0, 1)" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex-1 min-w-0">
          {children}
        </div>

        {/* Swipe Delete Button (Mobile) - Positioned completely off-screen to the right */}
        <div className="absolute top-0 bottom-0 left-full w-20 bg-red-500/80 backdrop-blur-xl flex items-center justify-center">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              vibrate([50, 50, 50]); // warning pattern
              if (confirm("Are you sure you want to delete this item?")) {
                onDelete(); 
                vibrate([50]); // success
              }
              setCurrentX(0); 
            }} 
            className="w-full h-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        
        {/* Desktop Hover Delete Icon (hidden on mobile) */}
        <div className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity ml-2 pr-5">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              vibrate([50, 50, 50]);
              if (confirm("Are you sure you want to delete this item?")) {
                onDelete(); 
                vibrate([50]);
              }
            }}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="Delete transaction"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
