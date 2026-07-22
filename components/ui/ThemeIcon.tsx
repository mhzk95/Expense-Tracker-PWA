"use client";

import React from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import type { IconName } from "@/lib/theme/types";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils/helpers";

interface ThemeIconProps {
  name: IconName;
  className?: string;
  [key: string]: any;
}

export function ThemeIcon({ name, className, ...props }: ThemeIconProps) {
  const { manifest } = useTheme();
  
  const iconConfig = manifest.iconMap[name];

  if (!iconConfig) {
    console.warn(`Icon ${name} not found in theme manifest ${manifest.id}`);
    return null;
  }

  if (iconConfig.type === "lucide") {
    // @ts-ignore
    const LucideComponent = LucideIcons[iconConfig.name] as React.ElementType;
    if (!LucideComponent) {
      console.warn(`Lucide icon ${iconConfig.name} not found`);
      return null;
    }
    return <LucideComponent className={className} {...props} />;
  }

  if (iconConfig.type === "svg") {
    return (
      <span 
        className={cn("inline-flex items-center justify-center [&>svg]:w-full [&>svg]:h-full", className)}
        dangerouslySetInnerHTML={{ __html: iconConfig.content }} 
        {...props} 
      />
    );
  }

  return null;
}
