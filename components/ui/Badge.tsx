import React from "react";
import { cn } from "@/lib/utils/helpers";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export const Badge = ({ className = "", variant = "default", children, ...props }: BadgeProps) => {
  const baseStyles = "inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000000] text-xs uppercase tracking-wider";
  
  const variants = {
    default: "bg-white text-black",
    success: "bg-[var(--color-success)] text-black",
    warning: "bg-[var(--color-warning)] text-black",
    danger: "bg-[var(--color-danger)] text-black",
    info: "bg-[var(--color-info)] text-black",
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </span>
  );
};
