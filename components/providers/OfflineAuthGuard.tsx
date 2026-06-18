"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function OfflineAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!pathname) return;
    
    // We don't protect auth routes or diagnostics
    if (pathname.startsWith("/auth") || pathname.startsWith("/pwa-diagnostics")) {
      setIsAuthorized(true);
      return;
    }

    const isTrusted = localStorage.getItem("et_device_trusted") === "true";
    if (!isTrusted) {
      setIsAuthorized(false);
      router.replace("/auth/login");
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, router]);

  // Prevent flicker of protected content before check completes
  if (isAuthorized === null && !pathname?.startsWith("/auth")) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
