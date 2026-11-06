import { ChevronDown } from "lucide-react";

import { MermaidDiagram } from "@/components/architecture/mermaid-diagram";
import { Reveal } from "@/components/marketing/reveal";
import { systemDiagram, systemDiagramMobile } from "@/lib/architecture-diagrams";

const messageDetails = [
  {
    term: "Durable outbox",
    copy: "Written in the same commit as evidence, so a crash cannot lose the intent to publish.",
  },
  {
    term: "Relay",
    copy: "Publishes unpublished rows, then marks them. A crash between the two publishes twice — never not at all.",
  },
  {
    term: "Topic",
    copy: "video.segments, partitioned by subject scope so one subject's updates stay ordered.",
  },
  {
    term: "va-projector",
    copy: "Consumer group with idempotent projection apply. Each partition is assigned to one member.",
  },
  {
    term: "Lag and dead letters",
    copy: "Committed offset vs. end offset per partition; a poison record moves aside instead of stalling the queue.",
  },
  {
    term: "Kafka is optional",
    copy: "KAFKA_BROKERS selects KafkaBroker; otherwise MemoryBroker provides the same semantics in process. Both share one contract.",
  },
];

export function MessageLayer() {
  return (
    <section id="messages" className="pt-[80px] sm:pt-[104px]">
      <div className="page-container">
        <Reveal className="max-w-[760px]">
          <h2 className="text-h2 font-medium text-ink">
            Count first. Deliver separately.
          </h2>
          <p className="mt-4 max-w-[620px] text-base leading-7 text-muted-ink">
            Accepted events leave through a transactional outbox. Use Kafka or the
            in-memory broker; watch time is credited before either runs.
          </p>
        </Reveal>

        <Reveal className="mt-8">
          <MermaidDiagram
            source={systemDiagram}
            mobileSource={systemDiagramMobile}
            compactBelow={1280}
            label="System architecture: playback, heartbeat API, evidence log, outbox, broker, and projection"
            caption="The full path from playback to stored totals. Subject-detail reads also compare the projection with raw evidence."
          />
        </Reveal>

        <Reveal className="mt-6 border-t border-line pt-4">
          <details className="group">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
              <span>Message layer details</span>
              <ChevronDown className="size-4 shrink-0 text-subtle-ink transition-transform group-open:rotate-180" />
            </summary>
            <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {messageDetails.map((item) => (
                <div key={item.term} className="min-w-0">
                  <dt className="text-sm font-medium text-ink">{item.term}</dt>
                  <dd className="mt-0.5 text-sm leading-6 text-muted-ink">{item.copy}</dd>
                </div>
              ))}
            </dl>
          </details>
        </Reveal>
      </div>
    </section>
  );
}
