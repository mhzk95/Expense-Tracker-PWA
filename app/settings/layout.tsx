import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Configure your ExpenseTracker preferences.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
