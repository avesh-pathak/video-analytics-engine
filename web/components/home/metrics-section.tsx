import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleDot,
  Info,
  Repeat2,
  Timer,
  X,
} from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const definitions = [
  {
    name: "Unique watch time",
    token: "uniqueWatched",
    definition: "The union of every range, clipped to duration.",
    accent: "bg-green",
  },
  {
    name: "Total watched",
    token: "totalWatched",
    definition: "Every accepted second. Rewatches included.",
    accent: "bg-chart-4",
  },
  {
    name: "Rewatch",
    token: "repeatWatched",
    definition: "Total minus unique. Real attention, not inflation.",
    accent: "bg-sky",
  },
  {
    name: "Completion",
    token: "completion",
    definition: "Unique divided by the authoritative duration.",
    accent: "bg-lilac",
  },
];

function RangeBar() {
  return (
    <div className="mt-4">
      <div className="relative h-3 overflow-hidden rounded-full bg-card">
        {[
          [0, 31],
          [31, 26],
          [57, 14],
          [71, 18],
          [89, 4],
        ].map(([left, width], index) => (
          <span
            key={`${left}-${width}`}
            className="absolute inset-y-0 rounded-[2px] bg-green"
            style={{ left: `${left}%`, width: `${width}%`, opacity: 0.64 + index * 0.06 }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[8px] text-subtle-ink">
        <span>00:00</span>
        <span>42:18</span>
      </div>
    </div>
  );
}

export function MetricsSection() {
  return (
    <section id="metrics" className="pt-[104px] sm:pt-[120px]">
      <div className="page-container">
        <Reveal className="mx-auto max-w-[780px] text-center">
          <span className="inline-flex items-center rounded-full bg-mint px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-green-deep">
            04 / Metrics
          </span>
          <h2 className="mt-4 text-h2 font-medium text-ink">
            Four numbers.
            <br />
            No ambiguity.
          </h2>
          <p className="mx-auto mt-4 max-w-[620px] text-[16px] leading-7 text-muted-ink sm:text-[17px]">
            Every figure on the surface has one definition, one owner, and a path back to
            the evidence that produced it. No renamed counters. No hidden inflation.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1fr_1fr]">
          <Reveal delay={0.02}>
            <div className="flex h-full flex-col rounded-card border border-line bg-card p-6 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-ink">
                  The metric dictionary
                </span>
                <Badge variant="secondary">v1.0</Badge>
              </div>
              <div className="mt-5 divide-y divide-line">
                {definitions.map((item) => (
                  <div key={item.token} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className={`size-1.5 rounded-full ${item.accent}`} />
                      <span className="text-[13px] font-semibold text-ink">{item.name}</span>
                      <code className="ml-auto rounded-md bg-surface-muted px-1.5 py-0.5 font-mono text-[8.5px] text-muted-ink">
                        {item.token}
                      </code>
                    </div>
                    <p className="mt-1 pl-3.5 text-[11.5px] leading-5 text-muted-ink">
                      {item.definition}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-6">
                <Button asChild className="w-full" size="sm">
                  <Link href="/architecture">
                    Read the architecture
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <p className="mt-2.5 text-center text-[9px] text-subtle-ink">
                  Deterministic sample data · no backend connected
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="group flex h-full flex-col rounded-card border border-green-bright bg-card p-2 shadow-[0_18px_44px_rgba(13,15,13,0.06),0_0_0_3px_rgba(48,166,109,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(13,15,13,0.08),0_0_0_4px_rgba(48,166,109,0.09)]">
              <div className="rounded-[21px] bg-surface-muted p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle-ink">
                    Primary metric
                  </span>
                  <span className="rounded-full bg-card px-2.5 py-1 text-[9px] font-semibold text-green-deep shadow-[0_1px_2px_rgba(13,15,13,0.04)]">
                    Current window
                  </span>
                </div>
                <div className="mt-4 flex items-start gap-2">
                  <span className="text-[44px] font-semibold leading-[0.9] tracking-[-0.055em] text-ink sm:text-[48px]">
                    12,482
                  </span>
                  <span className="mt-1 text-sm font-medium text-muted-ink">hours</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 font-semibold text-green-deep">
                    <ArrowUpRight className="size-3" />
                    18.4%
                  </span>
                  <span className="text-muted-ink">vs. previous 30 days</span>
                </div>
                <RangeBar />
              </div>

              <div className="flex flex-1 flex-col px-4 pb-4 pt-5">
                <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-ink">
                  Unique watch time
                </h3>
                <p className="mt-1.5 text-[12px] leading-5 text-muted-ink">
                  The size of the union of every range. A rewatch does not move this number.
                </p>
                <div className="mt-4 divide-y divide-line text-[11.5px]">
                  {[
                    ["Rewatch", "Counted once"],
                    ["Paused time", "Excluded"],
                    ["Client total", "Never read"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between py-2">
                      <span className="text-muted-ink">{label}</span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                        <Check className="size-3 text-green" />
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/architecture"
                  className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[11.5px] font-semibold text-green-deep underline-offset-4 hover:underline"
                >
                  Read the watch math
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.14}>
            <div className="group flex h-full flex-col rounded-card border border-line bg-card p-2 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(13,15,13,0.08)]">
              <div className="rounded-[21px] bg-surface-muted p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle-ink">
                    Secondary metric
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[9px] font-semibold text-muted-ink shadow-[0_1px_2px_rgba(13,15,13,0.04)]">
                    <Repeat2 className="size-2.5" />
                    Includes rewatch
                  </span>
                </div>
                <div className="mt-4 flex items-start gap-2">
                  <span className="text-[44px] font-semibold leading-[0.9] tracking-[-0.055em] text-ink sm:text-[48px]">
                    16,304
                  </span>
                  <span className="mt-1 text-sm font-medium text-muted-ink">hours</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 font-semibold text-green-deep">
                    <ArrowUpRight className="size-3" />
                    24.1%
                  </span>
                  <span className="text-muted-ink">1.31× per session</span>
                </div>
                <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-card">
                  <span className="h-full bg-chart-4" style={{ width: "76.6%" }} />
                  <span className="h-full bg-chart-3" style={{ width: "23.4%" }} />
                </div>
                <div className="mt-1.5 flex justify-between text-[8px] text-subtle-ink">
                  <span>Unique · 12,482h</span>
                  <span>Rewatch · 3,822h</span>
                </div>
              </div>

              <div className="flex flex-1 flex-col px-4 pb-4 pt-5">
                <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-ink">
                  Total watched
                </h3>
                <p className="mt-1.5 text-[12px] leading-5 text-muted-ink">
                  A plain sum of every accepted segment. It measures effort, not reach.
                </p>
                <div className="mt-4 space-y-2.5 rounded-2xl border border-line bg-surface-soft p-3">
                  {[
                    ["Unique", "12,482h"],
                    ["Rewatch", "3,822h"],
                    ["Engaged wall clock", "9,214h"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between text-[10.5px]">
                      <span className="inline-flex items-center gap-1.5 text-muted-ink">
                        <CircleDot className="size-2.5 text-subtle-ink" />
                        {label}
                      </span>
                      <span className="font-semibold text-ink">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-start gap-1.5 text-[9px] leading-4 text-subtle-ink">
                  <Info className="mt-0.5 size-3 shrink-0" />
                  Every total is labelled with its arithmetic. There is no unlabelled number.
                </div>
                <Link
                  href="/architecture#watch-math"
                  className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[11.5px] font-semibold text-green-deep underline-offset-4 hover:underline"
                >
                  Explore every metric
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-4" delay={0.08}>
          <div className="grid gap-4 rounded-card border border-line bg-card p-5 shadow-card sm:grid-cols-2 sm:p-6">
            <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4">
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-card text-danger">
                  <X className="size-3" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-danger">
                  A counter
                </span>
              </div>
              <p className="mt-2.5 text-[12px] leading-5 text-danger">
                Trusts client totals, adds rewatch into unique, and drifts without telling
                anyone. The number looks fine until it is asked to defend itself.
              </p>
            </div>
            <div className="rounded-2xl border border-mint-deep bg-mint-soft p-4">
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-card text-green-deep">
                  <Timer className="size-3" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-green-deep">
                  An engine
                </span>
              </div>
              <p className="mt-2.5 text-[12px] leading-5 text-green-deep">
                Recomputes from evidence, unions ranges, deduplicates twice, and makes
                every projection auditable. Every figure can be traced back to a row.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
