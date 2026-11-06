import type { Metadata, Viewport } from "next";
import "./globals.css";

import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL("https://avesh.tech"),
  title: {
    default: "Watchline — Every second counted",
    template: "%s · Watchline",
  },
  description: site.description,
  applicationName: "Watchline",
  authors: [{ name: "Avesh Pathak", url: "https://avesh.tech" }],
  creator: "Avesh Pathak",
  icons: {
    icon: "/favicon.svg",
  },
  keywords: [
    "video analytics",
    "watch time",
    "idempotency",
    "projection repair",
    "Next.js",
    "TypeScript",
  ],
  openGraph: {
    type: "website",
    title: "Watchline — Every second counted",
    description: site.description,
    siteName: "Watchline",
    url: "/",
    images: [
      {
        url: "/og-home.png",
        width: 1200,
        height: 630,
        alt: "Watchline — Every second counted. Every number defended.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Watchline — Every second counted",
    description: site.description,
    images: ["/og-home.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDFDFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0D191E" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/GoogleSansFlex-Latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/GoogleSansFlex-LatinExt.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <ThemeProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
