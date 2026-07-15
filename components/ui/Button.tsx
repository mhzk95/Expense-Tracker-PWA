import React from "react";
import { cn } from "@/lib/utils/helpers";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", children, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-150 ease-out outline-none min-h-tap-target min-w-tap-target";
    
    const variants = {
      primary: "brutal-btn bg-[var(--color-primary)] text-white",
      secondary: "brutal-btn brutal-btn-secondary bg-[var(--color-surface)] text-[var(--color-text)]",
      danger: "brutal-btn bg-[var(--color-danger)] text-[var(--color-text)]",
      ghost: "bg-transparent text-[var(--color-text)] border-2 border-transparent hover:border-[var(--color-border)] rounded-xl",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
      icon: "p-2 aspect-square",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
