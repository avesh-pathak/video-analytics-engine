import Link from "next/link";
import type { ComponentType } from "react";
import {
  ArrowRight,
  Check,
  Database,
  GitBranch,
  KeyRound,
  Layers,
  ListOrdered,
  Radio,
  RefreshCcw,
  Send,
  ShieldCheck,
  Skull,
  TimerReset,
  Workflow,
} from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";
import { Badge } from "@/components/ui/badge";
import { site } from "@/lib/site";

const primitives = [
  {
    icon: ListOrdered,
    title: "Partitions / subqueues",
    copy: "A topic is split into ordered subqueues. Events for one subject share a partition key, so its updates stay ordered.",
  },
  {
    icon: TimerReset,
    title: "Offsets",
    copy: "A monotonic marker per partition. It is the consumer's progress, and the reason lag and replay are meaningful.",
  },
  {
    icon: Layers,
    title: "Consumer group",
    copy: "Each partition is assigned to exactly one member of va-projector. Two members never process the same partition at once.",
  },
  {
    icon: Radio,
    title: "At-least-once",
    copy: "A record is redelivered until the consumer commits past it. The projector is idempotent, so the redelivery is safe.",
  },
  {
    icon: RefreshCcw,
    title: "Lag",
    copy: "Committed offset vs. end offset, per partition. The one number an alert should fire on when the projector falls behind.",
  },
  {
    icon: Skull,
    title: "Dead letter",
    copy: "A repeatedly failing record is moved aside. One poison message cannot stall every subject behind it.",
  },
];

const partitions = [
  { name: "p0", subject: "subject:42", offset: "18,204", lag: "0" },
  { name: "p1", subject: "subject:91", offset: "12,881", lag: "0" },
  { name: "p2", subject: "subject:07", offset: "9,442", lag: "0" },
];

function MessageNode({
  icon: Icon,
  title,
  note,
  tag,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  note: string;
  tag: string;
}) {
  return (
    <div className="flex-1 rounded-2xl border border-line bg-surface-soft p-3">
      <div className="flex items-center justify-between">
        <Icon className="size-3.5 text-green-deep" />
        <span className="rounded-full bg-card px-1.5 py-0.5 font-mono text-[6px] uppercase tracking-[0.06em] text-subtle-ink">
          {tag}
        </span>
      </div>
      <div className="mt-2 text-[10px] font-semibold text-ink">{title}</div>
      <div className="mt-0.5 text-[8px] leading-4 text-muted-ink">{note}</div>
    </div>
  );
}

export function MessageLayer() {
  return (
    <section id="messages" className="pt-[104px] sm:pt-[120px]">
      <div className="page-container">
        <Reveal className="mx-auto max-w-[780px] text-center">
          <span className="inline-flex items-center rounded-full bg-mint px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-green-deep">
            04 / Message layer
          </span>
          <h2 className="mt-4 text-h2 font-medium text-ink">
            The queue moves the event.
            <br />
            The index decides the count.
          </h2>
          <p className="mx-auto mt-4 max-w-[650px] text-[16px] leading-7 text-muted-ink sm:text-[17px]">
            The write path never waits on a broker. A transactional outbox makes the
            hand-off durable, the relay publishes it, and a consumer group projects it.
            Kafka is optional; the same semantics are implemented in-process.
          </p>
        </Reveal>

        <Reveal className="mt-10">
          <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-full bg-mint text-green-deep">
                  <Radio className="size-3.5" />
                </span>
                <div>
                  <div className="text-[12px] font-semibold text-ink">The event pipeline</div>
                  <div className="text-[9px] text-subtle-ink">outbox → relay → topic → projector</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="green">at-least-once</Badge>
                <Badge variant="secondary">idempotent consumer</Badge>
                <Badge variant="secondary">topic video.segments</Badge>
              </div>
            </div>

            <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.25fr_0.75fr]">
              <div>
                <div className="flex flex-col items-stretch gap-1.5 md:flex-row md:items-center">
                  <MessageNode
                    icon={Database}
                    title="Transactional outbox"
                    note="written in the same commit as evidence"
                    tag="durable"
                  />
                  <ArrowRight className="mx-auto size-3 shrink-0 rotate-90 text-subtle-ink md:rotate-0" />
                  <MessageNode
                    icon={Send}
                    title="Relay"
                    note="publishes unpublished rows, then marks them"
                    tag="publisher"
                  />
                  <ArrowRight className="mx-auto size-3 shrink-0 rotate-90 text-subtle-ink md:rotate-0" />
                  <MessageNode
                    icon={GitBranch}
                    title="Topic + subqueues"
                    note="keyed by subject scope for ordered updates"
                    tag="partitioned"
                  />
                  <ArrowRight className="mx-auto size-3 shrink-0 rotate-90 text-subtle-ink md:rotate-0" />
                  <MessageNode
                    icon={Workflow}
                    title="va-projector"
                    note="consumer group · idempotent projection apply"
                    tag="consumer"
                  />
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {partitions.map((partition) => (
                    <div key={partition.name} className="rounded-xl border border-line bg-card p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[8px] font-semibold text-ink">{partition.name}</span>
                        <span className="font-mono text-[7px] text-subtle-ink">{partition.subject}</span>
                      </div>
                      <div className="mt-2 flex h-2 gap-0.5 overflow-hidden rounded-full">
                        {[8, 5, 7, 4, 9, 6, 8, 5, 7].map((width, index) => (
                          <span
                            key={index}
                            className="h-full rounded-full bg-green/50"
                            style={{ width: `${width}%` }}
                          />
                        ))}
                      </div>
                      <div className="mt-2 flex justify-between text-[7px] text-subtle-ink">
                        <span>offset {partition.offset}</span>
                        <span className="text-green-deep">lag {partition.lag}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-mint-soft px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5 text-[8.5px] text-green-deep">
                    <Check className="size-3" />
                    One subject stays ordered inside its partition subqueue.
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[8.5px] text-muted-ink">
                    <Skull className="size-3" />
                    poison → dead letter
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-surface-soft p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.09em] text-subtle-ink">
                    Broker observability
                  </span>
                  <span className="inline-flex items-center gap-1 text-[8px] text-green-deep">
                    <span className="size-1.5 rounded-full bg-green" />
                    observed stats
                  </span>
                </div>
                <div className="mt-3 divide-y divide-line">
                  {[
                    ["Topic", "video.segments"],
                    ["Partitions", "3 ordered subqueues"],
                    ["Consumer group", "va-projector"],
                    ["Committed lag", "0 records"],
                    ["Dead letters", "0 records"],
                    ["Replay", "seek by offset"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between py-2 text-[9px]">
                      <span className="text-muted-ink">{label}</span>
                      <span className="font-mono text-[8px] text-ink">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl bg-card p-2.5 font-mono text-[8px] leading-4 text-muted-ink">
                  <span className="text-green-deep">KAFKA_BROKERS</span>=localhost:9092
                  <br />
                  <span className="text-subtle-ink">// absent → MemoryBroker</span>
                </div>
                <div className="mt-2.5 inline-flex items-center gap-1.5 text-[8px] text-subtle-ink">
                  <KeyRound className="size-2.5" />
                  Kafka is optional. The guarantee is not.
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Reveal>
            <div className="h-full rounded-card border border-line bg-card p-5 shadow-card sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
                    Messages, not side effects.
                  </h3>
                  <p className="mt-0.5 text-[9.5px] text-subtle-ink">
                    The broker is observable but never in the write path.
                  </p>
                </div>
                <span className="grid size-8 place-items-center rounded-full bg-mint text-green-deep">
                  <Workflow className="size-4" />
                </span>
              </div>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {primitives.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-2xl border border-line bg-surface-soft p-3">
                      <div className="flex items-center gap-1.5">
                        <Icon className="size-3 text-green-deep" />
                        <span className="text-[9.5px] font-semibold text-ink">{item.title}</span>
                      </div>
                      <p className="mt-1 text-[8.5px] leading-4 text-muted-ink">{item.copy}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="flex h-full flex-col gap-3">
              <div className="rounded-card border border-line bg-card p-5 shadow-card">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-mint text-green-deep">
                    <ShieldCheck className="size-3.5" />
                  </span>
                  <span className="text-[11px] font-semibold text-ink">Two implementations. One contract.</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="rounded-xl border border-line bg-surface-soft p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[8.5px] font-semibold text-ink">MemoryBroker</span>
                      <Badge variant="secondary">default</Badge>
                    </div>
                    <p className="mt-1 text-[8.5px] leading-4 text-muted-ink">
                      Real partition assignment, monotonic offsets, consumer groups,
                      at-least-once delivery, lag and replay — no infrastructure.
                    </p>
                  </div>
                  <div className="rounded-xl border border-line bg-surface-soft p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[8.5px] font-semibold text-ink">KafkaBroker</span>
                      <Badge variant="green">optional</Badge>
                    </div>
                    <p className="mt-1 text-[8.5px] leading-4 text-muted-ink">
                      The same semantics over Apache Kafka via <span className="font-mono">kafkajs</span>.
                      Enabled when <span className="font-mono">KAFKA_BROKERS</span> is set.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-card border border-mint-deep bg-mint-soft p-5">
                <p className="text-[10.5px] leading-5 text-green-deep">
                  <span className="font-semibold">The ordering that matters:</span> the outbox row
                  is written with the evidence, and marked published only after the broker
                  accepts it. If the process dies between, the event is published twice —
                  never not at all. The consumer is idempotent, so twice is safe.
                </p>
                <a
                  href={site.links.github}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-[9.5px] font-semibold text-green-deep underline-offset-2 hover:underline"
                >
                  Read the broker interface
                  <ArrowRight className="size-3" />
                </a>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-4">
          <div className="flex flex-col items-start justify-between gap-3 rounded-card border border-line bg-card px-4 py-3.5 sm:flex-row sm:items-center">
            <span className="text-[10px] leading-5 text-muted-ink">
              Messages, queues, partitions, offsets, consumer groups, lag, dead letters and
              replay are all first-class in the architecture brief.
            </span>
            <a
              href="/architecture#messages"
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-green-deep underline-offset-2 hover:underline"
            >
              Read the message layer
              <ArrowRight className="size-3" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
