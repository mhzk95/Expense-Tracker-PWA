/**
 * Root layout — Sets up fonts, metadata, global styles, and the AppShell.
 *
 * The AppShell is a Client Component (uses browser APIs for runtime detection).
 * This layout itself is a Server Component.
 */

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell/AppShell";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { OfflineAuthGuard } from "@/components/providers/OfflineAuthGuard";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ExpenseTracker — Personal Finance PWA",
    template: "%s | ExpenseTracker",
  },
  description:
    "A production-grade expense tracker Progressive Web App. Track spending, manage budgets, and gain financial insights.",
  keywords: ["expense tracker", "budget", "personal finance", "PWA", "money management"],
  authors: [{ name: "ExpenseTracker" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ExpenseTracker",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    title: "ExpenseTracker — Personal Finance PWA",
    description: "Track expenses, manage budgets, and gain financial insights.",
    siteName: "ExpenseTracker",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
    { media: "(prefers-color-scheme: light)", color: "#020617" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // Important for iOS safe areas
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('et_theme') || 'dark';
                if (theme === 'system') {
                  var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
                } else {
                  document.documentElement.setAttribute('data-theme', theme);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="h-full bg-slate-950 text-white antialiased font-sans relative">
        {/* Global Ambient Luminescence for Glassmorphism */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[var(--color-slate-950)] transition-colors duration-300">
          {/* Top Center Spotlight */}
          <div 
            className="absolute transition-all duration-500" 
            style={{ 
              top: 'var(--ambient-top-1, -30%)',
              left: 'var(--ambient-left-1, 25%)',
              right: 'var(--ambient-right-1, 25%)',
              width: 'var(--ambient-width-1, 50%)',
              height: 'var(--ambient-height-1, 60%)',
              borderRadius: 'var(--ambient-radius-1, 50%)',
              background: 'var(--ambient-color-1, var(--color-primary))',
              opacity: 'var(--ambient-opacity-1, 0.6)',
              transform: 'var(--ambient-transform-1, none)',
              animation: 'var(--ambient-animation-1, none)',
              mixBlendMode: 'var(--ambient-blend, screen)' as any, 
              filter: 'blur(var(--ambient-blur, 120px))'
            }} 
          />
          {/* Left Flowing Stadium Light */}
          <div 
            className="absolute transition-all duration-500" 
            style={{ 
              top: 'var(--ambient-top-2, 20%)',
              left: 'var(--ambient-left-2, -30%)',
              width: 'var(--ambient-width-2, 70%)',
              height: 'var(--ambient-height-2, 70%)',
              borderRadius: 'var(--ambient-radius-2, 50%)',
              background: 'var(--ambient-color-2, #6366f1)',
              opacity: 'var(--ambient-opacity-2, 0.4)',
              transform: 'var(--ambient-transform-2, none)',
              animation: 'var(--ambient-animation-2, aurora-flow-1 25s infinite ease-in-out)',
              mixBlendMode: 'var(--ambient-blend, screen)' as any, 
              filter: 'blur(var(--ambient-blur, 120px))'
            }} 
          />
          {/* Right Flowing Stadium Light */}
          <div 
            className="absolute transition-all duration-500" 
            style={{ 
              top: 'var(--ambient-top-3, auto)',
              bottom: 'var(--ambient-bottom-3, -10%)',
              right: 'var(--ambient-right-3, -30%)',
              width: 'var(--ambient-width-3, 70%)',
              height: 'var(--ambient-height-3, 70%)',
              borderRadius: 'var(--ambient-radius-3, 50%)',
              background: 'var(--ambient-color-3, #d946ef)',
              opacity: 'var(--ambient-opacity-3, 0.3)',
              transform: 'var(--ambient-transform-3, none)',
              animation: 'var(--ambient-animation-3, aurora-flow-2 30s infinite ease-in-out)',
              mixBlendMode: 'var(--ambient-blend, screen)' as any, 
              filter: 'blur(var(--ambient-blur, 120px))'
            }} 
          />
        </div>
        {/*
         * AppShell is a Client Component.
         * It detects the runtime environment and renders the correct shell:
         * - Desktop browser → sidebar
         * - Mobile browser → mobile header
         * - Standalone PWA → bottom navigation
         */}
        <AuthProvider>
          <OfflineAuthGuard>
            <AppShell>{children}</AppShell>
          </OfflineAuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
