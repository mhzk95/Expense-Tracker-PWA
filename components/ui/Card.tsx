import React from "react";
import { cn } from "@/lib/utils/helpers";

export const Card = ({ 
  children, 
  className = "", 
  onClick 
}: { 
  children: React.ReactNode; 
  className?: string; 
  onClick?: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "brutal-card",
        onClick ? "cursor-pointer interactive" : "",
        className
      )}
    >
      <div className="relative z-20 h-full w-full">
        {children}
      </div>
    </div>
  );
};
