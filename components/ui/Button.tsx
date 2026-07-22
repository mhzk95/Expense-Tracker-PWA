import React from "react";
import { cn } from "@/lib/utils/helpers";

import { useComponentStyle } from "@/hooks/useComponentStyle";
import { 
  getGeometryClasses, 
  getSurfaceClasses, 
  getInteractionClasses, 
  getTypographyClasses 
} from "@/lib/theme/style-mapper";

import { useTheme } from "@/components/providers/ThemeProvider";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", children, ...props }, ref) => {
    
    const style = useComponentStyle("button", { semanticVariant: variant });

    const { manifest } = useTheme();

    const baseClasses = "inline-flex items-center justify-center transition-all duration-150 ease-out outline-none min-h-tap-target min-w-tap-target relative";
    
    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
      icon: "p-2 aspect-square",
    }[size];

    const assetStyles: React.CSSProperties = {
      ...(style.surface.maskAsset && manifest.assets?.[style.surface.maskAsset] ? { WebkitMaskImage: `url('${manifest.assets[style.surface.maskAsset].src}')`, maskImage: `url('${manifest.assets[style.surface.maskAsset].src}')`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat' } : {}),
      ...(style.surface.backgroundAsset && manifest.assets?.[style.surface.backgroundAsset] ? { backgroundImage: `url('${manifest.assets[style.surface.backgroundAsset].src}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
      ...(props.style || {})
    };

    return (
      <button
        ref={ref}
        style={assetStyles}
        className={cn(
          baseClasses,
          sizeClasses,
          getGeometryClasses(style.geometry),
          getSurfaceClasses(style.surface),
          getInteractionClasses(style.interaction, style.geometry.borderWidth === "thick"),
          getTypographyClasses(style.typography),
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
