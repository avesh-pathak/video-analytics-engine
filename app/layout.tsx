import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Video Analytics Engine",
  description:
    "Server-authoritative watch-time analytics: untrusted client, at-least-once delivery, rebuildable projection.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
