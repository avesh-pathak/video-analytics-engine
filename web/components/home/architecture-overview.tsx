import Link from "next/link";
import type { ComponentType } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Database,
  Play,
  RefreshCcw,
  Server,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

type Node = {
  label: string;
  icon: ComponentType<{ className?: string }>;
};

type Path = {
  label: string;
  note: string;
  dot: string;
  nodes: Node[];
};

const paths: Path[] = [
  {
    label: "Write",
    note: "Synchronous and transactional.",
    dot: "bg-green",
    nodes: [
      { label: "Client ranges", icon: Play },
      { label: "One transaction", icon: Server },
      { label: "Log + projection", icon: Database },
    ],
  },
  {
    label: "Read",
    note: "Projection only.",
    dot: "bg-sky",
    nodes: [
      { label: "Projection", icon: Database },
      { label: "Read API", icon: Server },
      { label: "Surface", icon: ArrowUpRight },
    ],
  },
  {
    label: "Repair",
    note: "Bounded and verified.",
    dot: "bg-amber",
    nodes: [
      { label: "Audit", icon: ShieldCheck },
      { label: "Repair", icon: Wrench },
      { label: "Verify", icon: RefreshCcw },
    ],
  },
];

const facts = [
  {
    title: "Evidence, not a scalar.",
    copy: "The client sends intervals, never a watched-seconds total.",
  },
  {
    title: "One authoritative calculation.",
    copy: "The server validates, merges and clips the ranges itself.",
  },
  {
    title: "A projection that proves itself.",
    copy: "Audit measures drift. Repair bounds the fix. Verify returns zero.",
  },
];

export function ArchitectureOverview() {
  return (
    <section id="architecture" className="pt-[104px] sm:pt-[120px]">
      <div className="page-container">
        <Reveal className="mx-auto max-w-[760px] text-center">
          <span className="inline-flex items-center rounded-full bg-mint px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-green-deep">
            02 / Architecture
          </span>
          <h2 className="mt-4 text-h2 font-medium text-ink">
            One event in.
            <br />
            One number out.
          </h2>
          <p className="mx-auto mt-4 max-w-[600px] text-[16px] leading-7 text-muted-ink sm:text-[17px]">
            Watchline is an evidence system, not a counter. Three paths keep the number
            defensible from the first playback event to the last audit.
          </p>
        </Reveal>

        <Reveal className="mt-10">
          <div className="rounded-card border border-line bg-card p-5 shadow-card sm:p-7 lg:p-9">
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
              <div className="flex flex-col">
                <p className="max-w-[360px] text-[15px] leading-6 text-ink">
                  The client sends intervals. The server recomputes the watched seconds.
                  The projection can always be audited, rebuilt and repaired.
                </p>

                <div className="mt-6 space-y-3">
                  {facts.map((fact, index) => (
                    <div key={fact.title} className="flex gap-3">
                      <span className="mt-0.5 font-mono text-[8px] font-semibold text-subtle-ink">
                        0{index + 1}
                      </span>
                      <div>
                        <div className="text-[11px] font-semibold text-ink">{fact.title}</div>
                        <p className="mt-0.5 text-[10px] leading-5 text-muted-ink">{fact.copy}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-4 pt-7">
                  <Button asChild size="sm">
                    <Link href="/architecture">
                      Read the full architecture
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                  <Link
                    href={site.links.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-muted-ink underline-offset-4 transition hover:text-ink hover:underline"
                  >
                    Repository
                    <ArrowUpRight className="size-3" />
                  </Link>
                </div>
              </div>

              <div className="divide-y divide-line">
                {paths.map((path) => (
                  <div key={path.label} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={cn("size-1.5 rounded-full", path.dot)} />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink">
                          {path.label} path
                        </span>
                      </div>
                      <span className="text-[9px] text-subtle-ink">{path.note}</span>
                    </div>

                    <div className="mt-2.5 flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center">
                      {path.nodes.map((node, index) => {
                        const Icon = node.icon;
                        return (
                          <div key={node.label} className="contents">
                            <div className="flex flex-1 items-center gap-2 rounded-full border border-line bg-surface-soft px-3 py-2">
                              <Icon className="size-3 shrink-0 text-muted-ink" />
                              <span className="truncate text-[9.5px] font-medium text-ink">
                                {node.label}
                              </span>
                            </div>
                            {index < path.nodes.length - 1 ? (
                              <ArrowRight className="mx-auto size-3 shrink-0 rotate-90 text-subtle-ink sm:rotate-0" />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2 border-t border-line pt-4 text-[9.5px] leading-5 text-muted-ink sm:flex-row sm:items-center sm:justify-between">
              <span>
                <span className="font-semibold text-ink">Messages</span> · outbox → topic
                video.segments → partition subqueues → consumer group
              </span>
              <Link
                href="/architecture#messages"
                className="inline-flex shrink-0 items-center gap-1 font-semibold text-green-deep underline-offset-4 hover:underline"
              >
                Kafka optional · message layer
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
