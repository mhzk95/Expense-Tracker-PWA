import React from "react";
import { cn } from "@/lib/utils/helpers";

import { useComponentStyle } from "@/hooks/useComponentStyle";
import { 
  getGeometryClasses, 
  getSurfaceClasses, 
  getInteractionClasses 
} from "@/lib/theme/style-mapper";
import { useTheme } from "@/components/providers/ThemeProvider";

export const Card = ({ 
  children, 
  className = "",
  style: propStyle, 
  variant = "surface",
  onClick 
}: { 
  children: React.ReactNode; 
  className?: string;
  style?: React.CSSProperties; 
  variant?: "primary" | "secondary" | "danger" | "ghost" | "surface";
  onClick?: () => void;
}) => {
  const style = useComponentStyle("card", { isInteractive: !!onClick, semanticVariant: variant });
  const { manifest } = useTheme();

  let bgAssetKey = style.surface.backgroundAsset;
  if (bgAssetKey && style.surface.colorIntent && manifest.assets?.[`${bgAssetKey}-${style.surface.colorIntent}`]) {
     bgAssetKey = `${bgAssetKey}-${style.surface.colorIntent}`;
  }

  const assetStyles: React.CSSProperties = {
    ...(style.surface.maskAsset && manifest.assets?.[style.surface.maskAsset] ? { WebkitMaskImage: `url('${manifest.assets[style.surface.maskAsset].src}')`, maskImage: `url('${manifest.assets[style.surface.maskAsset].src}')`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat' } : {}),
    ...(bgAssetKey && manifest.assets?.[bgAssetKey] ? { backgroundImage: `url('${manifest.assets[bgAssetKey].src}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
    ...propStyle
  };

  return (
    <div
      onClick={onClick}
      style={assetStyles}
      className={cn(
        "relative overflow-hidden w-full",
        getGeometryClasses(style.geometry),
        getSurfaceClasses(style.surface),
        getInteractionClasses(style.interaction, style.geometry.borderWidth === "thick"),
        className
      )}
    >
      {style.decoration?.overlay && manifest.assets?.[style.decoration.overlay]?.src && (
         <div 
           className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay opacity-10" 
           style={{ backgroundImage: `url('${manifest.assets[style.decoration.overlay].src}')` }} 
         />
      )}
      <div className="relative z-20 h-full w-full">
        {children}
      </div>
    </div>
  );
};
