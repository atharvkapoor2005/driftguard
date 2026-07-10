import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DriftGuard — Catch stale docs & breaking dependency upgrades",
  description:
    "DriftGuard scans any GitHub repo for documentation drift and risky dependency upgrades before they bite.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
