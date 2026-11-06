"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleCheck,
  Database,
  FileCheck2,
  Layers,
  Play,
  RefreshCcw,
  ShieldCheck,
  Waypoints,
} from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";

type StageId = "capture" | "recompute" | "commit" | "reconcile";

const stages: {
  id: StageId;
  index: string;
  label: string;
  title: string;
  body: string;
  bullets: string[];
  icon: React.ComponentType<{ className?: string }>;
  consoleLabel: string;
}[] = [
  {
    id: "capture",
    index: "01",
    label: "Capture",
    title: "Every player. Ten events.",
    body: "A segment machine turns raw media events into durable, replay-safe playback ranges. The video file never leaves the device, and no provider SDK is involved.",
    bullets: ["No SDK or iframe", "Durable outbox in IndexedDB", "Idempotency-Key per batch"],
    icon: Play,
    consoleLabel: "segment-machine / capture",
  },
  {
    id: "recompute",
    index: "02",
    label: "Recompute",
    title: "Evidence becomes arithmetic.",
    body: "The server validates bounds, playback rate and wall-clock plausibility, then recomputes watched seconds from ranges it controls. Client-supplied totals are never read.",
    bullets: ["Segment bounds enforced", "Union survives every rewatch", "Paused time excluded"],
    icon: Waypoints,
    consoleLabel: "watch-math / recompute",
  },
  {
    id: "commit",
    index: "03",
    label: "Commit",
    title: "One transaction. Two indexes.",
    body: "Evidence, session, projection and outbox land inside a single BEGIN IMMEDIATE. If any part fails, none of it happened — which is what makes a retry safe.",
    bullets: ["UNIQUE(idempotency_key)", "UNIQUE(student, scope, segment_id)", "Broker only schedules reads"],
    icon: Database,
    consoleLabel: "write-path / commit",
  },
  {
    id: "reconcile",
    index: "04",
    label: "Reconcile",
    title: "Audit. Repair. Verify.",
    body: "The projection is measured against the append-only log, repaired in bounded resumable pages, then re-audited. Drift is never allowed to be silent.",
    bullets: ["Audit → dry run → apply", "Bounded, resumable pages", "Verify returns delta 0"],
    icon: RefreshCcw,
    consoleLabel: "repair-engine / reconcile",
  },
];

function ConsoleShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-card text-ink shadow-card">
      <div className="relative flex h-11 items-center border-b border-line px-5 sm:px-6">
        <span className="truncate font-mono text-[9px] uppercase tracking-[0.14em] text-subtle-ink">
          {label}
        </span>
      </div>
      <div className="relative p-5 sm:p-7">{children}</div>
    </div>
  );
}

function ConsoleHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-6">
      <div className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ink/40">
        {kicker}
      </div>
      <div className="mt-2 text-[22px] font-medium leading-[1.15] tracking-[-0.03em] text-ink sm:text-[24px]">
        {title}
      </div>
    </div>
  );
}

function CaptureConsole() {
  return (
    <ConsoleShell label="segment-machine / capture">
      <ConsoleHeader kicker="Event stream" title="Ten events in. One segment out." />
      <div className="rounded-2xl border border-line bg-surface-soft p-3.5">
        <div className="mb-3 flex items-center justify-between text-[8px] text-subtle-ink">
          <span>player.events</span>
          <span>local only</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["play", "playing", "timeupdate", "pause", "seeking", "seeked", "ratechange", "ended"].map(
            (event, index) => (
              <span
                key={event}
                className={cn(
                  "rounded-full border px-2 py-1 font-mono text-[8px]",
                  index === 2
                    ? "border-sky/30 bg-sky-soft/50 text-sky-ink"
                    : "border-line bg-surface-soft text-muted-ink",
                )}
              >
                {event}
              </span>
            ),
          )}
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-surface-soft px-3 py-2.5">
          <span className="grid size-6 place-items-center rounded-full bg-sky-soft/50 text-sky-ink">
            <Layers className="size-3" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[8px] text-subtle-ink">segment machine → durable outbox</div>
            <div className="mt-0.5 font-mono text-[9px] text-body">
              segment 418 → 892 · wallClock 377s
            </div>
          </div>
          <span className="rounded-full bg-sky-soft/50 px-2 py-0.5 text-[7px] font-semibold text-sky-ink">
            ready
          </span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ["Video uploaded", "0 bytes"],
          ["Player SDK", "none"],
          ["Batch retries", "safe"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-surface-soft p-2.5">
            <div className="text-[6.5px] text-subtle-ink">{label}</div>
            <div className="mt-0.5 text-[10px] font-semibold text-ink/75">{value}</div>
          </div>
        ))}
      </div>
    </ConsoleShell>
  );
}

function RecomputeConsole() {
  return (
    <ConsoleShell label="watch.math / recompute">
      <ConsoleHeader kicker="Server arithmetic" title="The union is the answer." />

      <div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[10px] font-medium text-subtle-ink">Accepted ranges</span>
          <span className="font-mono text-[9px] text-sky-ink">clipped 42:18</span>
        </div>

        <div className="mt-4 space-y-3.5">
          {[
            { label: "session_a", spans: [[6, 11.6], [42, 47.6]], tone: "bg-sky" },
            { label: "session_b", spans: [[9.6, 15.2], [45.6, 51.2]], tone: "bg-sky/70" },
            { label: "session_c", spans: [[12, 17.6], [48, 53.6]], tone: "bg-sky/40" },
          ].map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[72px_1fr] items-center gap-3 sm:grid-cols-[88px_1fr] sm:gap-4"
            >
              <div>
                <div className="font-mono text-[10px] text-muted-ink">{row.label}</div>
                <div className="mt-0.5 text-[8.5px] text-subtle-ink">2 ranges</div>
              </div>
              <div className="relative h-2 rounded-full bg-surface-strong">
                {row.spans.map(([from, to]) => (
                  <span
                    key={`${from}-${to}`}
                    className={cn("absolute inset-y-0 rounded-[2px]", row.tone)}
                    style={{ left: `${from}%`, width: `${to - from}%`, opacity: 0.85 }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-line pt-5">
          <div className="grid grid-cols-[72px_1fr] items-center gap-3 sm:grid-cols-[88px_1fr] sm:gap-4">
            <div>
              <div className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-sky-ink">
                Union
              </div>
              <div className="mt-1 text-[26px] font-medium leading-none tracking-[-0.04em] text-sky-ink tabular-nums">
                9:48
              </div>
            </div>
            <div className="relative h-3 rounded-full bg-surface-strong">
              {[
                [6, 17.6],
                [42, 53.6],
              ].map(([from, to]) => (
                <span
                  key={`${from}-${to}`}
                  className="absolute inset-y-0 rounded-[2px] bg-sky"
                  style={{ left: `${from}%`, width: `${to - from}%` }}
                />
              ))}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-[72px_1fr] gap-3 sm:grid-cols-[88px_1fr] sm:gap-4">
            <div className="hidden sm:block" />
            <div className="flex justify-between font-mono text-[8.5px] text-subtle-ink">
              <span>00:00</span>
              <span>10:30</span>
              <span>21:00</span>
              <span>31:30</span>
              <span>42:18</span>
            </div>
          </div>
        </div>
      </div>

      <dl className="mt-7 grid grid-cols-2 gap-x-5 gap-y-5 border-t border-line pt-5 sm:grid-cols-4">
        {[
          ["Total", "14:12"],
          ["Unique", "9:48"],
          ["Rewatch", "4:24"],
          ["Engaged", "8:06"],
        ].map(([label, value]) => (
          <div key={label}>
            <dt
              className={cn(
                "text-[9px] font-semibold uppercase tracking-[0.12em]",
                label === "Unique" ? "text-sky-ink" : "text-subtle-ink",
              )}
            >
              {label}
            </dt>
            <dd
              className={cn(
                "mt-1.5 text-[20px] font-medium leading-none tracking-[-0.03em] tabular-nums",
                label === "Unique" ? "text-sky-ink" : "text-body",
              )}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-1.5 text-[10px] text-muted-ink">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Client-supplied totals ignored
        </span>
        <span className="font-mono text-[9px] text-subtle-ink">
          unique = |merge(ranges)|
        </span>
      </div>
    </ConsoleShell>
  );
}

function CommitConsole() {
  return (
    <ConsoleShell label="write-path / commit">
      <ConsoleHeader kicker="Write path" title="All of it, or none of it." />
      <div className="rounded-2xl border border-line bg-surface-soft p-3.5 font-mono text-[9px] leading-[2.1]">
        <div className="text-subtle-ink">BEGIN IMMEDIATE;</div>
        <div className="flex items-center gap-1.5 text-ink/60">
          <Check className="size-2.5 text-sky-ink" />
          INSERT INTO watch_segments <span className="text-subtle-ink">…</span>
        </div>
        <div className="flex items-center gap-1.5 text-ink/60">
          <Check className="size-2.5 text-sky-ink" />
          UPDATE session_clock <span className="text-subtle-ink">…</span>
        </div>
        <div className="flex items-center gap-1.5 text-ink/60">
          <Check className="size-2.5 text-sky-ink" />
          UPSERT subject_progress <span className="text-subtle-ink">…</span>
        </div>
        <div className="flex items-center gap-1.5 text-ink/60">
          <Check className="size-2.5 text-sky-ink" />
          INSERT INTO outbox <span className="text-subtle-ink">…</span>
        </div>
        <div className="text-subtle-ink">COMMIT;</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-line bg-surface-soft p-3">
          <div className="text-[7px] uppercase tracking-[0.1em] text-muted-ink">Request index</div>
          <div className="mt-1 font-mono text-[8.5px] text-body">Idempotency-Key</div>
          <div className="mt-1.5 inline-flex items-center gap-1 text-[7px] text-sky-ink">
            <CircleCheck className="size-2.5" />
            duplicate → 200
          </div>
        </div>
        <div className="rounded-xl border border-line bg-surface-soft p-3">
          <div className="text-[7px] uppercase tracking-[0.1em] text-subtle-ink">Evidence index</div>
          <div className="mt-1 font-mono text-[8px] leading-4 text-ink/60">
            subject + scope
            <br />+ segment_id
          </div>
          <div className="mt-1.5 inline-flex items-center gap-1 text-[7px] text-sky-ink">
            <CircleCheck className="size-2.5" />
            unique row
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-surface-soft px-3 py-2 text-[8px]">
        <span className="inline-flex items-center gap-1.5 text-muted-ink">
          <FileCheck2 className="size-3 text-sky-ink" />
          Transaction committed
        </span>
        <span className="text-subtle-ink">4ms</span>
      </div>
    </ConsoleShell>
  );
}

function ReconcileConsole() {
  return (
    <ConsoleShell label="repair-engine / reconcile">
      <ConsoleHeader kicker="Projection health" title="Drift does not get to hide." />
      <div className="grid gap-2.5 sm:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border border-line bg-surface-soft p-3.5">
          <div className="text-[7px] uppercase tracking-[0.1em] text-subtle-ink">Projection agreement</div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-[34px] font-semibold leading-none tracking-[-0.05em] text-ink">99.98%</span>
            <span className="mb-1 rounded-full border border-line bg-sky-soft/50 px-1.5 py-0.5 text-[6.5px] text-sky-ink">
              healthy
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full w-[99%] rounded-full bg-sky" />
          </div>
          <div className="mt-2 text-[7px] text-subtle-ink">2s delta · 12,482h watched</div>
        </div>
        <div className="space-y-1.5">
          {[
            ["Snapshot log", "0.8s"],
            ["Recompute", "1.4s"],
            ["Apply repair", "3 rows"],
            ["Verify delta", "0.00%"],
          ].map(([label, value], index) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-lg border border-line bg-surface-soft px-2.5 py-1.5"
            >
              <span className="flex items-center gap-1.5 text-[7.5px] text-muted-ink">
                <Check className="size-2.5 text-sky-ink" />
                {label}
              </span>
              <span className={cn("text-[7px]", index === 3 ? "text-sky-ink" : "text-subtle-ink")}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 rounded-xl border border-line bg-surface-soft px-3 py-2.5 text-[8px] text-sky-ink">
        <CircleCheck className="size-3" />
        Audit passed. Projection and evidence log agree.
      </div>
    </ConsoleShell>
  );
}

function StageConsole({ stage }: { stage: StageId }) {
  if (stage === "capture") return <CaptureConsole />;
  if (stage === "recompute") return <RecomputeConsole />;
  if (stage === "commit") return <CommitConsole />;
  return <ReconcileConsole />;
}

export function EngineFlow() {
  const [active, setActive] = React.useState<StageId>("recompute");
  const reduce = useReducedMotion();

  return (
    <section id="lifecycle" className="pt-[104px] sm:pt-[120px]">
      <div className="page-container">
        <Reveal className="mx-auto max-w-[780px] text-center">
          <span className="inline-flex items-center rounded-full bg-mint px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-green-deep">
            06 / Lifecycle
          </span>
          <h2 className="mt-4 text-h2 font-medium text-ink">
            From play
            <br />
            to provable.
          </h2>
          <p className="mx-auto mt-4 max-w-[600px] text-[16px] leading-7 text-muted-ink sm:text-[17px]">
            One event enters. A number comes out. Every step in between is inspectable,
            replayable, and owned by the server.
          </p>
        </Reveal>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
          <Reveal>
            <div className="rounded-card border border-line bg-card p-2 shadow-card">
              {stages.map((stage) => {
                const selected = active === stage.id;
                const Icon = stage.icon;
                return (
                  <div key={stage.id} className="border-b border-line-soft last:border-0">
                    <button
                      type="button"
                      onClick={() => setActive(stage.id)}
                      aria-expanded={selected}
                      className={cn(
                        "flex w-full items-center gap-3.5 rounded-2xl px-4 py-4 text-left transition-colors duration-200 sm:px-5",
                        selected ? "bg-mint-soft" : "hover:bg-surface-soft",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-[12px] border text-[11px] font-semibold",
                          selected
                            ? "border-green-bright/20 bg-card text-green-deep"
                            : "border-line bg-card text-subtle-ink",
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold tabular text-subtle-ink">{stage.index}</span>
                          <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
                            {stage.label}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 block text-[12px]",
                            selected ? "text-green-deep/70" : "text-muted-ink",
                          )}
                        >
                          {stage.title}
                        </span>
                      </span>
                      <ChevronDown
                        className={cn(
                          "size-4 shrink-0 text-subtle-ink transition-transform duration-300",
                          selected && "rotate-180 text-green-deep",
                        )}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {selected ? (
                        <motion.div
                          key={stage.id}
                          initial={reduce ? false : { height: 0, opacity: 0 }}
                          animate={reduce ? undefined : { height: "auto", opacity: 1 }}
                          exit={reduce ? undefined : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-5 pl-[62px] pr-6 sm:px-5 sm:pl-[66px]">
                            <p className="text-[12px] leading-5 text-muted-ink">{stage.body}</p>
                            <div className="mt-3 space-y-1.5">
                              {stage.bullets.map((bullet) => (
                                <div key={bullet} className="flex items-center gap-1.5 text-[10.5px] text-body">
                                  <Check className="size-3 text-green" />
                                  {bullet}
                                </div>
                              ))}
                            </div>
                            <Link
                              href="/architecture"
                              className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-semibold text-green-deep underline-offset-4 hover:underline"
                            >
                              See the full contract
                              <ArrowRight className="size-3" />
                            </Link>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="relative">
              <div
                className="pointer-events-none absolute -inset-4 rounded-[36px] bg-gradient-to-br from-mint/60 via-transparent to-sky-soft/40 blur-xl"
                aria-hidden="true"
              />
              <div className="relative">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active}
                    initial={reduce ? false : { opacity: 0, y: 16 }}
                    animate={reduce ? undefined : { opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0, y: -12 }}
                    transition={{ duration: 0.42, ease: [0.33, 1, 0.68, 1] }}
                  >
                    <StageConsole stage={active} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-5" delay={0.04}>
          <div className="flex flex-col items-start justify-between gap-3 rounded-card border border-line bg-card px-5 py-4 sm:flex-row sm:items-center">
            <span className="text-[12px] text-muted-ink">
              The four invariants, failure matrix, and every code path are documented.
            </span>
            <Link
              href="/architecture"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-green-deep underline-offset-4 hover:underline"
            >
              Read the architecture
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
