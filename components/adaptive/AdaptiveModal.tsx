"use client";

import { useAppRuntime, getRuntimeUiConfig } from "@/hooks/useAppRuntime";
import { CenterModal } from "./CenterModal";
import { DrawerModal } from "./DrawerModal";
import { BottomSheet } from "./BottomSheet";

export interface AdaptiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function AdaptiveModal(props: AdaptiveModalProps) {
  const runtime = useAppRuntime();

  if (!runtime.isBrowser) return null;

  const uiConfig = getRuntimeUiConfig(runtime);

  switch (uiConfig.modalPresentation) {
    case "bottom-sheet":
      return <BottomSheet {...props} />;
    case "drawer":
      return <DrawerModal {...props} />;
    case "center-modal":
    default:
      return <CenterModal {...props} />;
  }
}
