import React from "react";
import { cn } from "@/lib/utils/helpers";

import { useComponentStyle } from "@/hooks/useComponentStyle";
import { 
  getGeometryClasses, 
  getSurfaceClasses, 
  getTypographyClasses 
} from "@/lib/theme/style-mapper";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export const Badge = ({ className = "", variant = "default", children, ...props }: BadgeProps) => {
  const style = useComponentStyle("badge");
  const baseClasses = "inline-flex items-center justify-center px-2 py-0.5";
  const resolvedSurface = { ...style.surface, colorIntent: variant === "default" ? "surface" : variant };

  return (
    <span 
      className={cn(
        baseClasses, 
        getGeometryClasses(style.geometry),
        getSurfaceClasses(resolvedSurface as any),
        getTypographyClasses(style.typography),
        "text-[10px]",
        className
      )} 
      {...props}
    >
      {children}
    </span>
  );
};
