import type { Metadata } from "next";

import { ArchitectureOverview } from "@/components/home/architecture-overview";
import { BentoFeatures } from "@/components/home/bento-features";
import { DashboardPreview } from "@/components/home/dashboard-preview";
import { EngineFlow } from "@/components/home/engine-flow";
import { EventMarquee } from "@/components/home/event-marquee";
import { FaqSection } from "@/components/home/faq-section";
import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { MetricsSection } from "@/components/home/metrics-section";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export const metadata: Metadata = {
  title: "Watchline — Every second counted",
  description:
    "Watchline turns untrusted playback events into watch time your team can stand behind. Recomputed, idempotent, and repairable by design.",
  openGraph: {
    title: "Watchline — Every second counted",
    description:
      "Watch time from an untrusted client, recomputed on the server, deduplicated twice and reconciled against an append-only evidence log.",
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
    description:
      "Watch time from an untrusted client, recomputed on the server, deduplicated twice and reconciled against an append-only evidence log.",
    images: ["/og-home.png"],
  },
};

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <EventMarquee />
        <ArchitectureOverview />
        <BentoFeatures />
        <MetricsSection />
        <DashboardPreview />
        <EngineFlow />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
