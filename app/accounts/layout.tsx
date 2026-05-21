import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accounts",
  description: "Manage your bank accounts, credit cards, and wallets.",
};

export default function AccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
