import type { Metadata } from "next";

import { ArchitectureContent } from "@/components/architecture/architecture-content";

export const metadata: Metadata = {
  title: "Architecture",
  description:
    "The Watchline architecture: untrusted client, server-recomputed watch time, two idempotency layers, a transactional outbox, Kafka or in-process messaging, and a projection that can be audited, repaired and verified.",
  openGraph: {
    title: "Watchline architecture — How a second becomes a number",
    description:
      "The video analytics engine explained: evidence in, one number out, with message queues, partitions, consumer groups and a verified repair path.",
    images: [
      {
        url: "/og-architecture.png",
        width: 1200,
        height: 630,
        alt: "Watchline architecture — How a second becomes a number.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Watchline architecture — How a second becomes a number",
    description:
      "The video analytics engine explained: evidence in, one number out, with message queues, partitions, consumer groups and a verified repair path.",
    images: ["/og-architecture.png"],
  },
};

export default function ArchitecturePage() {
  return <ArchitectureContent />;
}
