import {
  ArrowUpRight,
  Check,
  CircleCheck,
  Database,
  Gauge,
  KeyRound,
  Layers,
  LockKeyhole,
  Repeat2,
  ShieldCheck,
  Sigma,
  Wrench,
} from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const rangeRows = [
  { label: "Session A", ranges: [[0, 30], [36, 64]], tone: "bg-chart-1/70" },
  { label: "Session B", ranges: [[18, 56], [71, 89]], tone: "bg-chart-2/55" },
  { label: "Session C", ranges: [[6, 26], [44, 84]], tone: "bg-chart-3/45" },
];

function WatchMathVisual() {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-mint-deep bg-mint-soft p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-green-deep/70">
          Raw evidence
        </span>
        <span className="rounded-full bg-card/80 px-2 py-0.5 text-[8px] font-medium text-muted-ink">
          session 4c · 42:18
        </span>
      </div>
      <div className="mt-3.5 space-y-2.5">
        {rangeRows.map((row) => (
          <div key={row.label} className="flex items-center gap-2.5">
            <span className="w-[52px] shrink-0 text-[8.5px] text-muted-ink">{row.label}</span>
            <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-card/80">
              {row.ranges.map(([left, width]) => (
                <span
                  key={`${left}-${width}`}
                  className={cn("absolute inset-y-0 rounded-full", row.tone)}
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="my-3.5 border-t border-dashed border-green/25" />
      <div className="flex items-center gap-2.5">
        <span className="w-[52px] shrink-0 text-[9px] font-semibold text-green-deep">Union</span>
        <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-card">
          {[
            [0, 26],
            [26, 30],
            [56, 15],
            [71, 18],
            [89, 3],
          ].map(([left, width], index) => (
            <span
              key={`${left}-${width}`}
              className="absolute inset-y-0 rounded-[2px] bg-green"
              style={{ left: `${left}%`, width: `${width}%`, opacity: 0.72 + index * 0.045 }}
            />
          ))}
          <span className="absolute inset-y-0 left-[92%] right-0 bg-card" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          ["Total", "14:12"],
          ["Unique", "9:48"],
          ["Rewatch", "4:24"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-card/70 px-2.5 py-2">
            <div className="text-[7px] font-medium uppercase tracking-[0.08em] text-subtle-ink">{label}</div>
            <div className="mt-0.5 text-[13px] font-semibold tracking-[-0.03em] text-ink">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BentoCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-card border border-line bg-card p-6 shadow-card transition-[transform,box-shadow] duration-300 ease-soft hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(13,15,13,0.08)] sm:p-7",
        className,
      )}
    >
      {children}
    </article>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-green-deep/75">
      <span className="size-1.5 rounded-full bg-green" />
      {children}
    </span>
  );
}

export function BentoFeatures() {
  return (
    <section id="product" className="pt-[104px] sm:pt-[120px]">
      <div className="page-container">
        <Reveal className="mx-auto max-w-[780px] text-center">
          <span className="inline-flex items-center rounded-full bg-mint px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-green-deep">
            03 / The engine
          </span>
          <h2 className="mt-4 text-h2 font-medium text-ink">
            Anyone can count.
            <br />
            Very few can prove.
          </h2>
          <p className="mx-auto mt-4 max-w-[600px] text-[16px] leading-7 text-muted-ink sm:text-[17px]">
            Watch-time looks like a counter until the client lies, the network retries,
            or the projection drifts. These are the four invariants that keep the number
            defensible.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-6">
          <Reveal className="lg:col-span-4" delay={0.02}>
            <BentoCard className="h-full">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-[330px]">
                  <Eyebrow>Watch math</Eyebrow>
                  <h3 className="mt-3 text-[24px] font-medium tracking-[-0.025em] text-ink sm:text-[28px]">
                    A union, not a sum.
                  </h3>
                  <p className="mt-2.5 text-[13.5px] leading-6 text-muted-ink">
                    Rewatches cannot be added. The stored figure has to be the size of the
                    union of every range — so every accepted segment is merged, clipped to
                    duration, and measured again.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <Badge variant="secondary">uniqueWatched</Badge>
                    <Badge variant="secondary">totalWatched</Badge>
                    <Badge variant="secondary">repeatWatched</Badge>
                  </div>
                </div>
                <div className="w-full sm:max-w-[318px]">
                  <WatchMathVisual />
                </div>
              </div>
            </BentoCard>
          </Reveal>

          <Reveal className="lg:col-span-2" delay={0.06}>
            <BentoCard className="h-full border-mint-deep bg-gradient-to-b from-mint-soft to-card">
              <div className="flex items-start justify-between gap-3">
                <Eyebrow>Trust boundary</Eyebrow>
                <span className="grid size-7 place-items-center rounded-full bg-mint text-green-deep">
                  <ShieldCheck className="size-3.5" />
                </span>
              </div>
              <h3 className="mt-3 text-[24px] font-medium tracking-[-0.025em] text-ink">
                The client is a witness, not a source.
              </h3>
              <p className="mt-2.5 text-[13px] leading-6 text-muted-ink">
                The API never reads a client-supplied total. It reads raw ranges and
                recomputes what the evidence is worth.
              </p>
              <div className="mt-auto pt-6">
                <div className="overflow-hidden rounded-2xl border border-line bg-card font-mono text-[10px] leading-[1.9]">
                  <div className="flex items-center justify-between border-b border-line-soft bg-surface-soft px-3 py-2 text-[8px] uppercase tracking-[0.12em] text-subtle-ink">
                    <span>client payload</span>
                    <span className="rounded-full bg-danger-surface px-1.5 py-0.5 text-[7px] font-semibold text-danger-foreground">
                      untrusted
                    </span>
                  </div>
                  <div className="space-y-0.5 px-3 py-2.5 text-muted-ink">
                    <div>
                      <span className="text-subtle-ink">{"{"}</span> watchedSeconds:{" "}
                      <span className="text-danger line-through">754</span>
                    </div>
                    <div className="pl-3.5">
                      uniqueWatched: <span className="text-danger line-through">612</span>
                    </div>
                    <div>
                      <span className="text-subtle-ink">{"}"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-line-soft bg-mint-soft px-3 py-2.5">
                    <span className="flex items-center gap-1.5 text-[9px] font-semibold text-green-deep">
                      <ShieldCheck className="size-3" />
                      server recomputed
                    </span>
                    <span className="text-[13px] font-semibold tracking-[-0.02em] text-ink">482s</span>
                  </div>
                </div>
              </div>
            </BentoCard>
          </Reveal>

          <Reveal className="lg:col-span-2" delay={0.02}>
            <BentoCard className="h-full">
              <Eyebrow>Idempotency</Eyebrow>
              <h3 className="mt-3 text-[22px] font-medium tracking-[-0.025em] text-ink">
                Deduplicated twice.
                <br />
                Counted once.
              </h3>
              <p className="mt-2.5 text-[13px] leading-6 text-muted-ink">
                Retries are ordinary. Two independent unique keys make them harmless, even
                when the same evidence returns under a different session id.
              </p>
              <div className="mt-auto space-y-2 pt-5">
                <div className="flex items-center gap-2.5 rounded-2xl border border-mint-deep bg-mint-soft p-3">
                  <span className="grid size-8 place-items-center rounded-full bg-card text-green-deep">
                    <KeyRound className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[8px] font-semibold uppercase tracking-[0.1em] text-green-deep/70">
                      Layer 01 · request
                    </div>
                    <div className="truncate font-mono text-[10px] text-ink">Idempotency-Key</div>
                  </div>
                  <Check className="ml-auto size-3.5 text-green" />
                </div>
                <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface-soft p-3">
                  <span className="grid size-8 place-items-center rounded-full bg-card text-muted-ink">
                    <Layers className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[8px] font-semibold uppercase tracking-[0.1em] text-subtle-ink">
                      Layer 02 · evidence
                    </div>
                    <div className="truncate font-mono text-[10px] text-ink">
                      (student, scope, segment_id)
                    </div>
                  </div>
                  <Check className="ml-auto size-3.5 text-green" />
                </div>
                <div className="flex items-center justify-between rounded-full bg-card px-3.5 py-2 text-[10px] text-muted-ink">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-green" />
                    1,284 duplicates blocked
                  </span>
                  <span className="font-semibold text-green-deep">0 counted twice</span>
                </div>
              </div>
            </BentoCard>
          </Reveal>

          <Reveal className="lg:col-span-4" delay={0.06}>
            <BentoCard className="h-full">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch sm:justify-between">
                <div className="max-w-[330px]">
                  <Eyebrow>Repair engine</Eyebrow>
                  <h3 className="mt-3 text-[24px] font-medium tracking-[-0.025em] text-ink sm:text-[28px]">
                    Drift is detectable.
                    <br />
                    Repair is verifiable.
                  </h3>
                  <p className="mt-2.5 text-[13.5px] leading-6 text-muted-ink">
                    Audit the projection against the log, dry-run the delta, apply a bounded
                    resumable repair, then verify. The whole loop is framework-free and
                    observable.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-mint-deep bg-mint-soft px-3 py-1.5 text-[10px] font-semibold text-green-deep">
                    <Wrench className="size-3" />
                    audit → dry run → apply → verify
                  </div>
                </div>

                <div className="w-full rounded-[20px] border border-mint-deep bg-mint-soft p-4 sm:max-w-[310px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-green-deep/70">
                      Repair session
                    </span>
                    <span className="rounded-full bg-card/80 px-2 py-0.5 text-[8px] font-medium text-green-deep">
                      3.1s
                    </span>
                  </div>
                  <div className="relative mt-3 space-y-2.5">
                    <span className="absolute bottom-2.5 left-[7px] top-2.5 w-px bg-green/25" />
                    {[
                      ["Snapshot evidence log", "0.8s"],
                      ["Recompute subject totals", "1.4s"],
                      ["Diff against projection", "0.2s"],
                      ["Apply bounded repair", "0.3s"],
                      ["Verify after repair", "0.4s"],
                    ].map(([label, time]) => (
                      <div key={label} className="relative flex items-center gap-2.5">
                        <span className="relative z-10 grid size-[15px] shrink-0 place-items-center rounded-full bg-green text-white">
                          <Check className="size-2" />
                        </span>
                        <span className="flex-1 text-[9px] font-medium text-body">{label}</span>
                        <span className="text-[8px] tabular text-subtle-ink">{time}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-card/80 px-3 py-2">
                    <span className="text-[8.5px] text-muted-ink">Delta after repair</span>
                    <span className="text-[10px] font-semibold text-green-deep">0.00%</span>
                  </div>
                </div>
              </div>
            </BentoCard>
          </Reveal>

          <Reveal className="lg:col-span-2" delay={0.02}>
            <BentoCard className="h-full">
              <Eyebrow>Read path</Eyebrow>
              <h3 className="mt-3 text-[22px] font-medium tracking-[-0.025em] text-ink">
                Dashboards that don&apos;t stall.
              </h3>
              <p className="mt-2.5 text-[13px] leading-6 text-muted-ink">
                Reads never touch the evidence log. They hit a materialized projection, so
                the surface stays fast while the engine stays busy.
              </p>
              <div className="mt-auto pt-5">
                <div className="flex items-end justify-between">
                  <span className="text-[34px] font-semibold leading-none tracking-[-0.05em] text-ink">
                    24<span className="ml-0.5 text-base font-medium text-muted-ink">ms</span>
                  </span>
                  <span className="mb-1 rounded-full bg-mint px-2 py-0.5 text-[8px] font-semibold text-green-deep">
                    p95
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    ["Projection read", 22, "24ms"],
                    ["Session page", 38, "41ms"],
                    ["Audit delta", 72, "3.1s"],
                  ].map(([label, width, value]) => (
                    <div key={label as string}>
                      <div className="flex justify-between text-[8px] text-subtle-ink">
                        <span>{label}</span>
                        <span className="tabular">{value}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-strong">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-green to-teal"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </BentoCard>
          </Reveal>

          <Reveal className="lg:col-span-2" delay={0.06}>
            <BentoCard className="h-full">
              <Eyebrow>Rewatch math</Eyebrow>
              <h3 className="mt-3 text-[22px] font-medium tracking-[-0.025em] text-ink">
                A rewatch is real. A double count is not.
              </h3>
              <p className="mt-2.5 text-[13px] leading-6 text-muted-ink">
                Total counts every second. Unique counts every second once. The difference
                is the rewatch you actually earned.
              </p>
              <div className="mt-auto flex items-center gap-5 pt-5">
                <div className="relative grid size-[92px] shrink-0 place-items-center">
                  <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--muted)" strokeWidth="10" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="var(--chart-1)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="176 251"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="var(--chart-3)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="52 251"
                      strokeDashoffset="-182"
                    />
                  </svg>
                  <div className="text-center">
                    <div className="text-[20px] font-semibold tracking-[-0.04em] text-ink">1.31×</div>
                    <div className="text-[6.5px] uppercase tracking-[0.08em] text-subtle-ink">per session</div>
                  </div>
                </div>
                <div className="space-y-2 text-[9px]">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-green" />
                    <span className="text-muted-ink">Unique</span>
                    <span className="ml-auto font-semibold text-ink">12,482h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-sky-soft" />
                    <span className="text-muted-ink">Rewatch</span>
                    <span className="ml-auto font-semibold text-ink">3,822h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-line" />
                    <span className="text-muted-ink">Total</span>
                    <span className="ml-auto font-semibold text-ink">16,304h</span>
                  </div>
                </div>
              </div>
            </BentoCard>
          </Reveal>

          <Reveal className="lg:col-span-2" delay={0.1}>
            <BentoCard className="h-full bg-gradient-to-b from-mint-soft to-card">
              <Eyebrow>Evidence log</Eyebrow>
              <h3 className="mt-3 text-[22px] font-medium tracking-[-0.025em] text-ink">
                Append-only, always.
              </h3>
              <p className="mt-2.5 text-[13px] leading-6 text-muted-ink">
                Segments are never updated or deleted. The projection is a cache; the log
                is the truth. Drop it, rebuild it, and the numbers return.
              </p>
              <div className="mt-auto pt-5">
                <div className="overflow-hidden rounded-2xl border border-line bg-card font-mono text-[9.5px]">
                  <div className="flex items-center justify-between border-b border-line-soft bg-surface-soft px-3 py-2 text-[8px] uppercase tracking-[0.1em] text-subtle-ink">
                    <span className="inline-flex items-center gap-1.5">
                      <Database className="size-3" />
                      watch_segments
                    </span>
                    <LockKeyhole className="size-3 text-green" />
                  </div>
                  <div className="divide-y divide-line-soft">
                    {[
                      ["seg_8841", "0 → 312", "accepted"],
                      ["seg_8842", "418 → 892", "accepted"],
                      ["seg_8843", "970 → 1420", "duplicate"],
                    ].map(([id, range, status]) => (
                      <div key={id} className="flex items-center gap-2 px-3 py-1.5">
                        <span className="text-muted-ink">{id}</span>
                        <span className="ml-auto text-body">{range}</span>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[7px]",
                            status === "accepted"
                              ? "bg-mint text-green-deep"
                              : "bg-warning text-warning-foreground",
                          )}
                        >
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-line-soft bg-surface-soft px-3 py-1.5 text-[7.5px] text-subtle-ink">
                    <span>INSERT only</span>
                    <span className="inline-flex items-center gap-1 text-green-deep">
                      <CircleCheck className="size-2.5" />
                      immutable
                    </span>
                  </div>
                </div>
              </div>
            </BentoCard>
          </Reveal>
        </div>

        <Reveal className="mt-5" delay={0.04}>
          <div className="flex flex-col items-start justify-between gap-4 rounded-card border border-mint-deep bg-gradient-to-r from-mint-soft via-card to-mint-soft px-6 py-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full border border-mint-deep bg-card text-green-deep">
                <Sigma className="size-4" />
              </span>
              <div>
                <div className="text-sm font-semibold text-ink">Four invariants. One number.</div>
                <div className="mt-0.5 text-xs text-muted-ink">
                  The full arithmetic, failure matrix and repair contract are in the architecture.
                </div>
              </div>
            </div>
            <a
              href="/architecture"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-green-deep underline-offset-4 hover:underline"
            >
              Read the architecture
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
