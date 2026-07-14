import React from "react";
import { cn } from "@/lib/utils/helpers";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Add custom props if needed in future
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "brutal-input w-full",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
