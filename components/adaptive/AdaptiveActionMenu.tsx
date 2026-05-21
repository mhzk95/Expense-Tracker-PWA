"use client";

import { useAppRuntime, getRuntimeUiConfig } from "@/hooks/useAppRuntime";
import { DropdownMenu } from "./DropdownMenu";
import { ActionSheet } from "./ActionSheet";

export interface ActionMenuItem {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  destructive?: boolean;
}

export interface AdaptiveActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  items: ActionMenuItem[];
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function AdaptiveActionMenu(props: AdaptiveActionMenuProps) {
  const runtime = useAppRuntime();

  if (!runtime.isBrowser) return null;

  const uiConfig = getRuntimeUiConfig(runtime);

  if (uiConfig.menuPresentation === "action-sheet") {
    return <ActionSheet {...props} />;
  }

  return <DropdownMenu {...props} />;
}
