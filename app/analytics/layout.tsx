import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Detailed spending trends and cash flow insights.",
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
