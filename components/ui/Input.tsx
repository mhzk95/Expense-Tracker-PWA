import React from "react";
import { cn } from "@/lib/utils/helpers";

import { useComponentStyle } from "@/hooks/useComponentStyle";
import { 
  getGeometryClasses, 
  getSurfaceClasses,
  getInteractionClasses
} from "@/lib/theme/style-mapper";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Add custom props if needed in future
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    const style = useComponentStyle("input");

    const placeholderClasses = {
      low: "placeholder:opacity-30",
      medium: "placeholder:opacity-50",
      high: "placeholder:opacity-70"
    };

    return (
      <input
        ref={ref}
        className={cn(
          "w-full px-4 py-3 outline-none transition-all",
          getGeometryClasses(style.geometry),
          getSurfaceClasses(style.surface),
          getInteractionClasses(style.interaction, style.geometry.borderWidth === "thick"),
          placeholderClasses[style.placeholderOpacity],
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
