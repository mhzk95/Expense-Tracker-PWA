"use client";

import { useContext } from "react";
import { AppRuntimeContext } from "@/components/providers/AppRuntimeProvider";
import type { AppRuntime, DisplayMode, RuntimeMode } from "@/components/providers/AppRuntimeProvider";
import { ENABLE_APP_SHELL_FOR_MOBILE_DEVICE_BROWSER } from "@/lib/constants/app";

export type { AppRuntime, DisplayMode, RuntimeMode };

export function useAppRuntime(): AppRuntime {
  return useContext(AppRuntimeContext);
}

export interface RuntimeUiConfig {
  showBottomNav: boolean;
  showDesktopSidebar: boolean;
  showMobileWebHeader: boolean;
  modalPresentation: "center-modal" | "drawer" | "bottom-sheet";
  menuPresentation: "dropdown" | "popover" | "action-sheet";
  filterPresentation: "sidebar" | "drawer" | "bottom-sheet";
  actionBarPresentation: "inline" | "sticky-mobile" | "safe-area-bottom";
}

export function getRuntimeUiConfig(runtime: AppRuntime): RuntimeUiConfig {
  const isPWA = runtime.runtimeMode === "standalone-pwa";
  const isMobileDev = runtime.runtimeMode === "mobile-device-browser";
  const isResizedDesktop = runtime.runtimeMode === "resized-desktop-mobile-web";
  const isDesktop = runtime.runtimeMode === "desktop-web";

  const showBottomNav = isPWA || (isMobileDev && ENABLE_APP_SHELL_FOR_MOBILE_DEVICE_BROWSER);
  const showDesktopSidebar = isDesktop;
  const showMobileWebHeader = !showDesktopSidebar && !isPWA; // Mobile web and resized desktop show mobile header

  let modalPresentation: "center-modal" | "drawer" | "bottom-sheet" = "center-modal";
  if (isPWA || isMobileDev) modalPresentation = "bottom-sheet";
  else if (isResizedDesktop) modalPresentation = "drawer";
  else modalPresentation = "center-modal";

  let menuPresentation: "dropdown" | "popover" | "action-sheet" = "dropdown";
  if (isPWA || isMobileDev) menuPresentation = "action-sheet";
  else menuPresentation = "dropdown";

  let filterPresentation: "sidebar" | "drawer" | "bottom-sheet" = "sidebar";
  if (isPWA || isMobileDev) filterPresentation = "bottom-sheet";
  else if (isResizedDesktop) filterPresentation = "drawer";
  else filterPresentation = "sidebar";

  let actionBarPresentation: "inline" | "sticky-mobile" | "safe-area-bottom" = "inline";
  if (isPWA) actionBarPresentation = "safe-area-bottom";
  else if (isMobileDev || isResizedDesktop) actionBarPresentation = "sticky-mobile";
  else actionBarPresentation = "inline";

  return {
    showBottomNav,
    showDesktopSidebar,
    showMobileWebHeader,
    modalPresentation,
    menuPresentation,
    filterPresentation,
    actionBarPresentation,
  };
}
