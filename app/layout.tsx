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
                var theme = localStorage.getItem('et_theme');
                if (theme === 'light') {
                  document.documentElement.setAttribute('data-theme', 'light');
                } else if (theme === 'system') {
                  var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="h-full bg-slate-950 text-white antialiased font-sans relative">
        {/* Global Ambient Luminescence for Glassmorphism */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-slate-950">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[var(--color-primary)]/20 rounded-full mix-blend-screen filter blur-[120px] opacity-60 animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full mix-blend-screen filter blur-[150px] opacity-40 animate-pulse" style={{ animationDuration: '12s' }} />
          <div className="absolute -bottom-[20%] left-[20%] w-[40%] h-[40%] bg-fuchsia-500/10 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-pulse" style={{ animationDuration: '10s' }} />
        </div>
        {/*
         * AppShell is a Client Component.
         * It detects the runtime environment and renders the correct shell:
         * - Desktop browser → sidebar
         * - Mobile browser → mobile header
         * - Standalone PWA → bottom navigation
         */}
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
