/**
 * Application-wide constants.
 */

export const APP_NAME = "ExpenseTracker";
export const APP_VERSION = "1.0.0";
export const APP_DESCRIPTION = "A production-grade expense tracker PWA";

/** 
 * When true, mobile-device-browser mode will show bottom navigation and app shell
 * behavior, mimicking the native app experience in the browser. 
 */
export const ENABLE_APP_SHELL_FOR_MOBILE_DEVICE_BROWSER = true;

/** Breakpoints matching Tailwind defaults */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

/** Desktop threshold — sidebar navigation is shown above this width */
export const DESKTOP_BREAKPOINT = BREAKPOINTS.lg;

/** Navigation items shared across all nav components */
export const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/",
    icon: "LayoutDashboard",
    description: "Overview of your finances",
  },
  {
    id: "transactions",
    label: "Transactions",
    href: "/transactions",
    icon: "ArrowLeftRight",
    description: "All income and expenses",
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/analytics",
    icon: "BarChart3",
    description: "Trends and insights",
  },
  {
    id: "accounts",
    label: "Accounts",
    href: "/accounts",
    icon: "Wallet",
    description: "Bank accounts and cards",
  },
  {
    id: "categories",
    label: "Categories",
    href: "/categories",
    icon: "Target",
    description: "Manage income and expense categories",
  },
  {
    id: "journal",
    label: "Journal",
    href: "/journal",
    icon: "BookImage",
    description: "Memories and life events",
  },
  {
    id: "vault",
    label: "Vault",
    href: "/vault",
    icon: "ShieldAlert",
    description: "Secure, encrypted passwords and notes",
  },
  {
    id: "research",
    label: "Research Hub",
    href: "/research",
    icon: "Link2",
    description: "Web clipper and research collections",
  },
  {
    id: "reminders",
    label: "Reminders",
    href: "/reminders",
    icon: "Bell",
    description: "Action items and tasks",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: "Settings",
    description: "App preferences and configuration",
  },
] as const;

/** Bottom navigation items for PWA mode (subset of full nav) */
export const BOTTOM_NAV_ITEMS = [
  { id: "dashboard", label: "Home", href: "/", icon: "LayoutDashboard" },
  { id: "transactions", label: "Transactions", href: "/transactions", icon: "ArrowLeftRight" },
  { id: "journal", label: "Journal", href: "/journal", icon: "BookImage" },
  { id: "research", label: "Research", href: "/research", icon: "Link2" },
  { id: "more", label: "More", href: "#more", icon: "Menu" },
] as const;

/** Currency codes */
export const DEFAULT_CURRENCY = "INR";
export const SUPPORTED_CURRENCIES = ["INR", "USD", "EUR", "GBP", "CAD", "AUD", "JPY"] as const;

/** Local storage keys */
export const STORAGE_KEYS = {
  THEME: "et_theme",
  CURRENCY: "et_currency",
  SIDEBAR_COLLAPSED: "et_sidebar_collapsed",
  ONBOARDING_COMPLETE: "et_onboarding_complete",
} as const;
