"use client";

import { useAppRuntime, getRuntimeUiConfig } from "@/hooks/useAppRuntime";
import { DrawerModal } from "./DrawerModal";
import { BottomSheet } from "./BottomSheet";

export interface AdaptiveFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function AdaptiveFilters(props: AdaptiveFiltersProps) {
  const runtime = useAppRuntime();

  if (!runtime.isBrowser) return null;

  const uiConfig = getRuntimeUiConfig(runtime);

  if (uiConfig.filterPresentation === "bottom-sheet") {
    return <BottomSheet title="Filters" {...props} />;
  }

  if (uiConfig.filterPresentation === "drawer") {
    return <DrawerModal title="Filters" {...props} />;
  }

  // Sidebar implementation is normally inline next to main content on desktop,
  // but if rendered as a modal, fallback to drawer
  return <DrawerModal title="Filters" {...props} />;
}
