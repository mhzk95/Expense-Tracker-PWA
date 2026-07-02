"use client";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils/helpers";

export function MarqueeText({ text, className, isExpanded }: { text: string; className?: string; isExpanded?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [overflowAmount, setOverflowAmount] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current) {
        const overflow = Math.max(0, containerRef.current.scrollWidth - containerRef.current.clientWidth);
        setOverflowAmount(overflow);
      }
    };
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [text]);

  const shouldAnimate = overflowAmount > 0 && (isExpanded || isHovered);

  return (
    <div 
      className={cn("overflow-hidden whitespace-nowrap min-w-0 flex cursor-default", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        ref={containerRef}
        className={cn("truncate min-w-0", !shouldAnimate && "truncate")}
        style={{
          transform: shouldAnimate ? `translateX(-${overflowAmount + 12}px)` : 'translateX(0)',
          transition: shouldAnimate ? `transform ${overflowAmount * 25}ms linear 200ms` : 'transform 300ms ease-out',
        }}
      >
        {text}
      </div>
    </div>
  );
}
