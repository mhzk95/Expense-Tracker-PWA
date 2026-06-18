"use client";

import { AuthBackground } from "@/components/auth/AuthBackground";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-x-hidden bg-slate-950">
      <AuthBackground />
      <div className="relative z-10 w-full max-w-md px-6 py-12 flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
}
