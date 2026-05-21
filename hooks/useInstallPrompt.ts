"use client";

/**
 * useInstallPrompt — Captures and manages the PWA install prompt.
 *
 * The browser fires a `beforeinstallprompt` event when the PWA
 * is installable. This hook captures that event so you can trigger
 * the install dialog at an appropriate time (e.g., after user action).
 *
 * Only works in Chromium-based browsers. iOS uses "Add to Home Screen"
 * via the Share menu — there is no programmatic API for iOS.
 */

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

export interface InstallPromptState {
  /** True if the install prompt is available (Chromium only) */
  isInstallable: boolean;
  /** True if the user has already installed the app */
  isInstalled: boolean;
  /** Call this to show the native install dialog */
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  /** The outcome of the last install prompt, if any */
  installOutcome: "accepted" | "dismissed" | null;
}

export function useInstallPrompt(): InstallPromptState {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installOutcome, setInstallOutcome] = useState<
    "accepted" | "dismissed" | null
  >(null);

  useEffect(() => {
    // Check if already installed (running as standalone)
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkInstalled();

    // Capture the deferred install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Fired when the user installs via the browser's own UI
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<
    "accepted" | "dismissed" | "unavailable"
  > => {
    if (!deferredPrompt) return "unavailable";

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    setInstallOutcome(outcome);
    setDeferredPrompt(null);

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    return outcome;
  };

  return {
    isInstallable: deferredPrompt !== null,
    isInstalled,
    promptInstall,
    installOutcome,
  };
}
