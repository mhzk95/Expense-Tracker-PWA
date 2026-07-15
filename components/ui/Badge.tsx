import React from "react";
import { cn } from "@/lib/utils/helpers";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export const Badge = ({ className = "", variant = "default", children, ...props }: BadgeProps) => {
  const baseStyles = "inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-full border-2 border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)] text-xs uppercase tracking-wider";
  
  const variants = {
    default: "bg-[var(--color-surface)] text-[var(--color-text)]",
    success: "bg-[var(--color-success)] text-[var(--color-text)]",
    warning: "bg-[var(--color-warning)] text-[var(--color-text)]",
    danger: "bg-[var(--color-danger)] text-[var(--color-text)]",
    info: "bg-[var(--color-info)] text-[var(--color-text)]",
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </span>
  );
};
