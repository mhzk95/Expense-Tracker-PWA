"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { STORAGE_KEYS } from "@/lib/constants/app";
import { DESKTOP_BREAKPOINT, ENABLE_APP_SHELL_FOR_MOBILE_DEVICE_BROWSER } from "@/lib/constants/app";
import { hasDropboxConnection, uploadBackupToDropbox } from "@/lib/services/dropbox";

export type DisplayMode =
  | "standalone"       // Installed PWA (homescreen launch)
  | "minimal-ui"       // Minimal browser chrome
  | "fullscreen"       // Fullscreen PWA
  | "browser";         // Normal browser tab

export type RuntimeMode =
  | "desktop-web"
  | "resized-desktop-mobile-web"
  | "mobile-device-browser"
  | "standalone-pwa";

export interface AppRuntime {
  isBrowser: boolean;
  isDesktopViewport: boolean;
  isMobileViewport: boolean;
  isTouchDevice: boolean;
  isCoarsePointer: boolean;
  isHoverSupported: boolean;
  isMobileUserAgent: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalonePWA: boolean;
  isMobileDeviceBrowser: boolean;
  isResizedDesktopMobileViewport: boolean;
  displayMode: DisplayMode;
  runtimeMode: RuntimeMode;
  isOnline: boolean;
  safeAreaSupported: boolean;
  serviceWorkerSupported: boolean;
  serviceWorkerRegistered: boolean;
}

const INITIAL_STATE: AppRuntime = {
  isBrowser: false,
  isDesktopViewport: false,
  isMobileViewport: true,
  isTouchDevice: false,
  isCoarsePointer: false,
  isHoverSupported: false,
  isMobileUserAgent: false,
  isIOS: false,
  isAndroid: false,
  isStandalonePWA: false,
  isMobileDeviceBrowser: false,
  isResizedDesktopMobileViewport: false,
  displayMode: "browser",
  runtimeMode: "desktop-web",
  isOnline: true,
  safeAreaSupported: false,
  serviceWorkerSupported: false,
  serviceWorkerRegistered: false,
};

function detectDisplayMode(): DisplayMode {
  if (typeof window === "undefined") return "browser";

  if (window.matchMedia("(display-mode: standalone)").matches) return "standalone";
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return "minimal-ui";
  if (window.matchMedia("(display-mode: fullscreen)").matches) return "fullscreen";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((navigator as any).standalone === true) return "standalone";

  return "browser";
}

function detectSafeAreaSupport(): boolean {
  if (typeof window === "undefined") return false;
  return CSS.supports("padding-bottom: env(safe-area-inset-bottom)");
}

function detectRuntime(): AppRuntime {
  if (typeof window === "undefined") return INITIAL_STATE;

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isAndroid = /android/i.test(ua);
  const isMobileUserAgent = /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  
  const width = window.innerWidth;
  const isDesktopViewport = width >= DESKTOP_BREAKPOINT;
  const isMobileViewport = width < DESKTOP_BREAKPOINT;

  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const isHoverSupported = window.matchMedia("(hover: hover)").matches;

  const displayMode = detectDisplayMode();
  const isStandalonePWA = displayMode === "standalone" || (navigator as any).standalone === true;

  const isMobileDeviceSignal = isMobileUserAgent || (isTouchDevice && isCoarsePointer && !isHoverSupported);
  
  let isMobileDeviceBrowser = false;
  let isResizedDesktopMobileViewport = false;
  
  if (!isStandalonePWA && isMobileViewport) {
    if (isMobileDeviceSignal) {
      isMobileDeviceBrowser = true;
    } else {
      isResizedDesktopMobileViewport = true;
    }
  }

  let runtimeMode: RuntimeMode = "desktop-web";
  
  if (isStandalonePWA) {
    runtimeMode = "standalone-pwa";
  } else if (isMobileDeviceBrowser) {
    runtimeMode = "mobile-device-browser";
  } else if (isResizedDesktopMobileViewport) {
    runtimeMode = "resized-desktop-mobile-web";
  } else {
    runtimeMode = "desktop-web";
  }

  return {
    isBrowser: true,
    isDesktopViewport,
    isMobileViewport,
    isTouchDevice,
    isCoarsePointer,
    isHoverSupported,
    isMobileUserAgent,
    isIOS,
    isAndroid,
    isStandalonePWA,
    isMobileDeviceBrowser,
    isResizedDesktopMobileViewport,
    displayMode,
    runtimeMode,
    isOnline: navigator.onLine,
    safeAreaSupported: detectSafeAreaSupport(),
    serviceWorkerSupported: "serviceWorker" in navigator,
    serviceWorkerRegistered: false,
  };
}

export const AppRuntimeContext = createContext<AppRuntime>(INITIAL_STATE);

export function AppRuntimeProvider({ children }: { children: ReactNode }) {
  const [runtime, setRuntime] = useState<AppRuntime>(INITIAL_STATE);

  useEffect(() => {
    setRuntime(detectRuntime());

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) setRuntime((prev) => ({ ...prev, serviceWorkerRegistered: true }));
      });
      navigator.serviceWorker.ready.then((reg) => {
        if (reg) setRuntime((prev) => ({ ...prev, serviceWorkerRegistered: true }));
      });
    }

    const handleResize = () => setRuntime((prev) => ({ ...prev, ...detectRuntime() }));
    const handleOnline = () => setRuntime((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setRuntime((prev) => ({ ...prev, isOnline: false }));

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = () => setRuntime((prev) => ({ ...prev, ...detectRuntime() }));

    window.addEventListener("resize", handleResize);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (standaloneQuery.addEventListener) {
      standaloneQuery.addEventListener("change", handleDisplayModeChange);
    }

    const checkDailyBackup = async () => {
      if (!hasDropboxConnection() || !navigator.onLine) return;
      
      const lastBackupStr = localStorage.getItem("last_dropbox_backup_time");
      const now = Date.now();
      
      if (!lastBackupStr || now - parseInt(lastBackupStr, 10) > 24 * 60 * 60 * 1000) {
        try {
          const success = await uploadBackupToDropbox();
          if (success) {
            localStorage.setItem("last_dropbox_backup_time", now.toString());
          }
        } catch (e) {
          console.error("Auto backup failed", e);
        }
      }
    };
    
    checkDailyBackup();
    const backupInterval = setInterval(checkDailyBackup, 60 * 60 * 1000);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(backupInterval);
      if (standaloneQuery.removeEventListener) {
        standaloneQuery.removeEventListener("change", handleDisplayModeChange);
      }
    };
  }, []);

  return (
    <AppRuntimeContext.Provider value={runtime}>
      {children}
    </AppRuntimeContext.Provider>
  );
}
