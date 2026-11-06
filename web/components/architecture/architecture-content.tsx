import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CircleCheck,
  Database,
  FileSearch,
  Fingerprint,
  KeyRound,
  Layers,
  ListChecks,
  LockKeyhole,
  Play,
  RefreshCcw,
  ScanSearch,
  Server,
  ShieldCheck,
  Sparkles,
  TableProperties,
  Wrench,
  X,
} from "lucide-react";

import { ApiTabs } from "@/components/architecture/api-tabs";
import { MessageLayer } from "@/components/architecture/message-layer";
import { SystemOverview } from "@/components/architecture/system-overview";
import { WatchMathLab } from "@/components/architecture/watch-math-lab";
import { GithubIcon } from "@/components/brand/social-icons";
import { Reveal } from "@/components/marketing/reveal";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { site } from "@/lib/site";

const paths = [
  {
    icon: Server,
    title: "Write path",
    note: "Synchronous · transactional",
    copy: "One transaction covers evidence, session, projection and outbox.",
  },
  {
    icon: BarChart3,
    title: "Read path",
    note: "Projection + drift check",
    copy: "Listings read stored progress; subject detail also compares raw evidence.",
  },
  {
    icon: Wrench,
    title: "Repair path",
    note: "Bounded · resumable",
    copy: "Recompute derived state from evidence, in bounded pages, then verify.",
  },
];

const invariants = [
  {
    icon: ShieldCheck,
    number: "01",
    title: "The client is untrusted.",
    copy: "Watched seconds are never taken from the client's word. The API reads raw ranges and recomputes the number using policy the client cannot influence.",
    proof: "computeWatchMetrics(ranges, duration)",
    tint: true,
  },
  {
    icon: KeyRound,
    number: "02",
    title: "Delivery is at-least-once.",
    copy: "Every request is idempotent at the request level, and every segment is idempotent at the evidence level. A retry under a new session id is still harmless.",
    proof: "UNIQUE(idempotency_key)",
    tint: false,
  },
  {
    icon: Database,
    number: "03",
    title: "Reads are projections.",
    copy: "The append-only evidence log is the truth. The projection is a cache. Drop it, rebuild it, and the totals must return unchanged.",
    proof: "drop → rebuild → compare",
    tint: false,
  },
  {
    icon: RefreshCcw,
    number: "04",
    title: "Drift is repairable.",
    copy: "A projection can disagree with its log. Watchline measures that delta, repairs it in bounded pages, and verifies the result afterwards.",
    proof: "audit → repair → verify",
    tint: true,
  },
];

const flow = [
  { icon: Play, title: "Capture", note: "media events · durable outbox", tag: "engine/" },
  { icon: Server, title: "Validate", note: "parse · session context · policy", tag: "POST /heartbeat" },
  { icon: Fingerprint, title: "Deduplicate", note: "request claim · segment identity", tag: "server/repository.ts" },
  { icon: Database, title: "Persist", note: "evidence · session · projection · outbox", tag: "SQLite write unit" },
  { icon: BarChart3, title: "Read surface", note: "stored progress · detail drift", tag: "GET /read" },
];

const failures = [
  {
    failure: "Client claims 60s but spends 6s",
    counter: "Credits all 60",
    engine: "Recomputes 6s from ranges",
    proof: "wall-clock plausibility",
  },
  {
    failure: "Same batch retried twice",
    counter: "Adds it twice",
    engine: "Request key returns the original",
    proof: "UNIQUE(idempotency_key)",
  },
  {
    failure: "Outbox replays under a new session id",
    counter: "Credits the watch again",
    engine: "Segment key rejects the evidence",
    proof: "UNIQUE(student, scope, segment_id)",
  },
  {
    failure: "Learner rewinds and rewatches",
    counter: "Inflates unique watch time",
    engine: "Union stays unchanged, repeat grows",
    proof: "mergeRanges → sumRanges",
  },
  {
    failure: "Projection loses a row",
    counter: "Silent wrong number",
    engine: "Audit finds the delta, repair verifies",
    proof: "audit → dry run → apply → verify",
  },
  {
    failure: "Outbox relay falls behind",
    counter: "Lost or stale totals",
    engine: "Projection stays rebuildable and observable",
    proof: "broker lag + rebuild",
  },
];

const auditSteps = [
  {
    icon: ScanSearch,
    title: "Audit",
    copy: "Read the whole evidence log and diff it against the projection. No writes.",
  },
  {
    icon: FileSearch,
    title: "Dry run",
    copy: "See the scope of the drift before anything changes. Safe to schedule.",
  },
  {
    icon: Wrench,
    title: "Apply",
    copy: "Repair only the affected subjects, in bounded pages with a cursor.",
  },
  {
    icon: CircleCheck,
    title: "Verify",
    copy: "Re-audit. The delta must return zero. Anything else is a failed repair.",
  },
];

export function ArchitectureContent() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="pt-[84px] sm:pt-[92px]">
          <div className="page-container">
            <div className="gradient-hero relative overflow-hidden rounded-[32px] border border-line/60 px-5 py-12 text-center sm:rounded-[40px] sm:px-8 sm:py-16 lg:px-14 lg:py-[72px]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#39D47A]/50 to-transparent" aria-hidden="true" />
              <div className="pointer-events-none absolute -left-24 top-24 size-[380px] rounded-full border border-white/30 bg-white/10 blur-2xl" aria-hidden="true" />
              <Reveal className="relative z-10 mx-auto max-w-[880px]">
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card/75 px-2 py-1.5 pr-3.5 text-[12px] font-medium text-muted-ink shadow-[0_1px_2px_rgba(13,15,13,0.04)] backdrop-blur">
                  <span className="grid size-5 place-items-center rounded-full bg-mint text-green-deep">
                    <Layers className="size-3" />
                  </span>
                  Engine architecture
                  <span className="h-3 w-px bg-line" />
                  <span className="text-[11px] font-semibold text-green-deep">v1.0</span>
                </span>
                <h1 className="mt-6 text-hero font-medium text-ink">
                  How a second
                  <br />
                  becomes a number<span className="text-green">.</span>
                </h1>
                <p className="mx-auto mt-5 max-w-[710px] text-[17px] leading-7 text-muted-ink sm:text-[19px] sm:leading-8">
                  Watchline is a video analytics engine for watch time. This page follows
                  the exact path from a playback event to a trusted total — and shows how
                  each step is measured, deduplicated, audited and repaired.
                </p>
                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    href="#watch-math"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-button px-6 text-[15px] font-semibold text-button-foreground transition hover:-translate-y-px hover:bg-button/90"
                  >
                    Explore the math
                    <ArrowRight className="size-4" />
                  </a>
                  <Button asChild variant="secondary" size="lg" className="h-12 px-6 text-[15px]">
                    <Link href={site.links.github} target="_blank" rel="noreferrer">
                      <GithubIcon className="size-4" />
                      View the source
                    </Link>
                  </Button>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[10.5px] font-medium text-muted-ink">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-card/55 px-3 py-1.5 backdrop-blur">
                    <span className="font-semibold text-green-deep">4</span> invariants
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-card/55 px-3 py-1.5 backdrop-blur">
                    <span className="font-semibold text-green-deep">2</span> idempotency layers
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-card/55 px-3 py-1.5 backdrop-blur">
                    <span className="font-semibold text-green-deep">0</span> client totals trusted
                  </span>
                </div>
              </Reveal>

              <Reveal delay={0.1} className="relative z-10 mx-auto mt-10 grid max-w-[1040px] gap-3 text-left sm:grid-cols-3">
                {paths.map((path) => {
                  const Icon = path.icon;
                  return (
                    <div key={path.title} className="rounded-3xl border border-line bg-card/65 p-4 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <span className="grid size-8 place-items-center rounded-full border border-line bg-card text-green-deep shadow-[0_1px_2px_rgba(13,15,13,0.04)]">
                          <Icon className="size-3.5" />
                        </span>
                        <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-subtle-ink">
                          {path.note}
                        </span>
                      </div>
                      <div className="mt-3 text-[14px] font-semibold text-ink">{path.title}</div>
                      <p className="mt-1 text-[11px] leading-5 text-muted-ink">{path.copy}</p>
                    </div>
                  );
                })}
              </Reveal>
            </div>
          </div>
        </section>

        <SystemOverview />

        <section id="invariants" className="pt-[104px] sm:pt-[120px]">
          <div className="page-container">
            <Reveal className="mx-auto max-w-[760px] text-center">
              <span className="inline-flex items-center rounded-full bg-mint px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-green-deep">
                01 / Invariants
              </span>
              <h2 className="mt-4 text-h2 font-medium text-ink">
                Four rules.
                <br />
                Nothing else.
              </h2>
              <p className="mx-auto mt-4 max-w-[610px] text-[16px] leading-7 text-muted-ink sm:text-[17px]">
                If a change breaks one of them, the number is no longer defensible — even
                if it still looks right.
              </p>
            </Reveal>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {invariants.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Reveal key={item.title} delay={index * 0.04}>
                    <article className={`group h-full rounded-card border p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(13,15,13,0.07)] sm:p-7 ${item.tint ? "border-mint-deep bg-gradient-to-br from-mint-soft to-card" : "border-line bg-card"}`}>
                      <div className="flex items-start justify-between gap-4">
                        <span className="grid size-10 place-items-center rounded-[14px] border border-line bg-card text-green-deep shadow-[0_1px_2px_rgba(13,15,13,0.04)]">
                          <Icon className="size-4" />
                        </span>
                        <span className="text-[11px] font-semibold tabular text-subtle-ink">{item.number}</span>
                      </div>
                      <h3 className="mt-5 text-[21px] font-semibold tracking-[-0.025em] text-ink">{item.title}</h3>
                      <p className="mt-2 text-[13px] leading-6 text-muted-ink">{item.copy}</p>
                      <div className="mt-5 flex items-center gap-2 border-t border-line/70 pt-3.5">
                        <span className="text-[8px] font-semibold uppercase tracking-[0.09em] text-subtle-ink">Proven by</span>
                        <code className="truncate rounded-md bg-card/80 px-2 py-1 font-mono text-[8.5px] text-body">{item.proof}</code>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section id="watch-math" className="pt-[104px] sm:pt-[120px]">
          <div className="page-container">
            <div className="mx-auto grid max-w-[1100px] items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
              <Reveal className="lg:pt-2">
                <h2 className="text-[30px] font-medium leading-[1.12] tracking-[-0.03em] text-ink sm:text-[36px]">
                  A union,
                  <br />
                  not a sum.
                </h2>
                <p className="mt-4 max-w-[360px] text-sm leading-6 text-muted-ink">
                  Rewatches cannot be added. The stored unique figure has to be the size of
                  the union of every accepted range — merged, clipped to duration, and
                  measured again.
                </p>
              </Reveal>

              <Reveal delay={0.06}>
                <WatchMathLab />
              </Reveal>
            </div>

            <div className="mt-14 border-t border-line pt-10 sm:mt-16">
              <div className="grid gap-10 md:grid-cols-2 md:gap-16">
                <Reveal className="h-full">
                  <div className="flex h-full flex-col">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-6 place-items-center rounded-full bg-danger-surface text-danger">
                        <X className="size-3.5" aria-hidden="true" />
                      </span>
                      <h3 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-ink">
                        The anti-pattern
                      </h3>
                    </div>
                    <p className="mt-4 max-w-[430px] text-[14px] leading-6 text-muted-ink">
                      Adding each new range to a running total.
                    </p>
                    <pre className="mt-5 flex-1 overflow-x-auto rounded-xl border border-line/70 border-l-2 border-l-danger/40 bg-danger-surface/40 px-4 py-4 font-mono text-[11px] leading-6 text-danger-foreground">
{`// a union cannot be updated by addition
progress.uniqueContentSeconds +=
  segment.endSecond - segment.startSecond;`}
                    </pre>
                    <p className="mt-4 text-[11px] leading-5 text-muted-ink">
                      Correct for the first segment. Wrong the moment a learner rewatches.
                    </p>
                  </div>
                </Reveal>

                <Reveal className="h-full" delay={0.06}>
                  <div className="flex h-full flex-col">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-6 place-items-center rounded-full bg-success text-success-foreground">
                        <Check className="size-3.5" aria-hidden="true" />
                      </span>
                      <h3 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-ink">
                        The engine
                      </h3>
                    </div>
                    <p className="mt-4 max-w-[430px] text-[14px] leading-6 text-muted-ink">
                      Merging the whole set, then measuring what survives.
                    </p>
                    <pre className="mt-5 flex-1 overflow-x-auto rounded-xl border border-line/70 border-l-2 border-l-green/40 bg-success/50 px-4 py-4 font-mono text-[11px] leading-6 text-green-deep">
{`const merged = mergeRanges([
  ...progress.watchedRanges,
  newRange,
]);
progress.uniqueContentSeconds =
  sumRanges(merged);`}
                    </pre>
                    <p className="mt-4 text-[11px] leading-5 text-muted-ink">
                      Every accepted range passes through the same function. There is one
                      producer of a watched-seconds number.
                    </p>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        <section id="write-path" className="pt-[104px] sm:pt-[120px]">
          <div className="page-container">
            <Reveal className="mx-auto max-w-[760px] text-center">
              <h2 className="text-h2 font-medium text-ink">
                One write.
                <br />
                Two guards.
              </h2>
              <p className="mx-auto mt-4 max-w-[590px] text-[16px] leading-7 text-muted-ink sm:text-[17px]">
                Deliveries are at-least-once. Retries are ordinary. Duplicate evidence is
                made harmless twice, for two different reasons.
              </p>
            </Reveal>

            <Reveal className="mt-10">
              <div className="rounded-card border border-border bg-card p-5 text-card-foreground sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold">The write path</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Synchronous · transactional · idempotent</p>
                  </div>
                </div>
                <ol className="mt-7 grid gap-5 lg:grid-cols-5 lg:gap-6">
                  {flow.map((node, index) => {
                    const Icon = node.icon;
                    return (
                      <li key={node.title} className="relative flex items-start gap-3 lg:flex-col">
                          <span className="text-primary">
                            <Icon className="size-5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium">{node.title}</div>
                            <div className="mt-1 text-xs leading-5 text-muted-foreground">{node.note}</div>
                            <span className="mt-1 block font-mono text-[10px] text-muted-foreground">{node.tag}</span>
                          </div>
                        {index < flow.length - 1 ? (
                          <ArrowRight className="absolute -right-4 top-0.5 hidden size-4 text-muted-foreground lg:block" aria-hidden="true" />
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
                <div className="mt-7 flex flex-col gap-2 border-t border-border pt-5 text-xs leading-5 text-muted-foreground sm:flex-row sm:justify-between sm:gap-6">
                  <span className="inline-flex items-start gap-2">
                    <LockKeyhole className="mt-0.5 size-4 shrink-0 text-success-foreground" />
                    BEGIN IMMEDIATE covers evidence, session, projection and outbox.
                  </span>
                  <span className="font-medium text-success-foreground">One commit. If one write fails, none happened.</span>
                </div>
              </div>
            </Reveal>

            <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-12">
              <Reveal>
                <div>
                  <h3 className="text-xl font-medium tracking-tight text-foreground">
                    The whole request is safe to replay.
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    The API takes an <code className="font-mono text-xs">Idempotency-Key</code>.
                    A repeated key returns a deduplicated acknowledgement instead of
                    applying the batch again.
                  </p>
                  <details className="mt-5 border-t border-border pt-4">
                    <summary className="cursor-pointer text-sm font-medium text-primary">View the replay response</summary>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>POST /heartbeat</span>
                      <span className="text-green-deep">200</span>
                    </div>
                    <pre className="mt-2 overflow-x-auto rounded-xl bg-muted p-4 font-mono text-xs leading-6 text-muted-foreground">
{`Idempotency-Key: 7f3c...

{
  "ok": true,
  "deduplicated": true,
  "duplicateSegmentIds": ["c"]
}`}
                    </pre>
                  </details>
                </div>
              </Reveal>

              <Reveal delay={0.05}>
                <div>
                  <h3 className="text-xl font-medium tracking-tight text-foreground">
                    The segment is safe to replay anywhere.
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    A unique tuple of student, scope and client segment id means the same
                    evidence cannot land twice — even if it returns under a different
                    session id after a resume.
                  </p>
                  <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4">
                    <code className="overflow-x-auto font-mono text-xs leading-6 text-info-foreground">
                      UNIQUE(student, scope, client_segment_id)
                    </code>
                    <p className="flex items-center gap-2 text-xs leading-5 text-success-foreground">
                      <Check className="size-4 shrink-0" aria-hidden="true" />
                      New session id · duplicateSegmentIds: ["c"] · zero credit
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal className="mt-8">
              <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-start sm:justify-between">
                  <p className="max-w-[850px] text-sm leading-6 text-muted-foreground">
                    <span className="font-medium text-foreground">The broker never decides whether a segment counts.</span>{" "}
                    A unique index does. The heartbeat updates the projection synchronously;
                    broker delivery is a separate hand-off, not a condition for crediting watch time.
                  </p>
                <span className="shrink-0 font-mono text-xs leading-6 text-muted-foreground">
                  memory ≡ Kafka
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        <MessageLayer />

        <section id="repair" className="pt-[104px] sm:pt-[120px]">
          <div className="page-container">
            <Reveal className="mx-auto max-w-[760px] text-center">
              <span className="inline-flex items-center rounded-full bg-mint px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-green-deep">
                05 / Repair engine
              </span>
              <h2 className="mt-4 text-h2 font-medium text-ink">
                Drift is measurable.
                <br />
                Repair is verifiable.
              </h2>
              <p className="mx-auto mt-4 max-w-[620px] text-[16px] leading-7 text-muted-ink sm:text-[17px]">
                A projection over an append-only log can drift. The difference is whether
                the system can see it, bound it, fix it and prove the fix.
              </p>
            </Reveal>

            <div className="mt-10 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <Reveal>
                <div className="h-full rounded-card border border-line bg-card p-5 shadow-card sm:p-7">
                  <div className="flex items-center gap-2">
                    <Badge variant="green">Read-only first</Badge>
                    <Badge variant="secondary">bounded pages</Badge>
                  </div>
                  <h3 className="mt-4 text-[24px] font-semibold tracking-[-0.03em] text-ink">
                    Repair never means &ldquo;rewrite everything.&rdquo;
                  </h3>
                  <p className="mt-2 max-w-[440px] text-[13px] leading-6 text-muted-ink">
                    Audit is safe to schedule. A repair touches only the subjects that
                    disagree, and a cursor makes it resumable if the page budget runs out.
                  </p>
                  <div className="mt-6 space-y-3">
                    {auditSteps.map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div key={step.title} className="flex items-start gap-3">
                          <span className="relative grid size-8 shrink-0 place-items-center rounded-[11px] border border-mint-deep bg-mint-soft text-green-deep">
                            <Icon className="size-3.5" />
                          </span>
                          <div className="min-w-0 flex-1 border-b border-line-soft pb-3 last:border-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold tabular text-subtle-ink">0{index + 1}</span>
                              <span className="text-[12px] font-semibold text-ink">{step.title}</span>
                            </div>
                            <p className="mt-0.5 text-[10.5px] leading-5 text-muted-ink">{step.copy}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-[9px] text-green-deep">
                    <LockKeyhole className="size-3" />
                    Apply is separate from dry-run. There is no accidental write.
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.06}>
                <div className="flex h-full flex-col rounded-card border border-line bg-surface-soft p-5 shadow-card sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-ink">Repair window</span>
                    <span className="rounded-full bg-card px-2 py-0.5 text-[8px] font-medium text-muted-ink">
                      3 rows · page 1 of 1
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl border border-amber/20 bg-amber/10 p-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-amber">
                        <ScanSearch className="size-3" />
                        Before
                      </span>
                      <span className="rounded-full bg-card px-2 py-0.5 text-[8px] font-semibold text-amber">
                        drift 0.07%
                      </span>
                    </div>
                    <div className="mt-3 space-y-2.5">
                      <div>
                        <div className="flex justify-between text-[8px] text-amber">
                          <span>Projection</span>
                          <span>12,480h</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-card">
                          <div className="h-full w-[93%] rounded-full bg-[#D3B373]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[8px] text-amber">
                          <span>Evidence log</span>
                          <span>12,482h</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-card">
                          <div className="h-full w-[96%] rounded-full bg-[#B58A52]" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-[8px] text-amber">Delta +2s across 3 subjects</div>
                  </div>

                  <div className="flex justify-center py-2">
                    <span className="grid size-7 place-items-center rounded-full border border-line bg-card text-green-deep">
                      <ArrowDown className="size-3.5" />
                    </span>
                  </div>

                  <div className="rounded-2xl border border-mint-deep bg-mint-soft p-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-green-deep">
                        <CircleCheck className="size-3" />
                        After verify
                      </span>
                      <span className="rounded-full bg-card px-2 py-0.5 text-[8px] font-semibold text-green-deep">
                        delta 0.00%
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        ["Agreement", "99.98%"],
                        ["Repaired", "3 rows"],
                        ["Next cursor", "null"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl bg-card/75 p-2">
                          <div className="text-[6.5px] uppercase tracking-[0.06em] text-subtle-ink">{label}</div>
                          <div className="mt-0.5 text-[10px] font-semibold text-ink">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto pt-4">
                    <div className="flex items-center justify-between text-[8px] text-subtle-ink">
                      <span>Re-audit result</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-green-deep">
                        <Check className="size-2.5" />
                        verified
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-strong">
                      <div className="h-full w-full rounded-full bg-green" />
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { icon: ScanSearch, title: "Read-only audit", copy: "Safe to run on a schedule, no writes." },
                { icon: ListChecks, title: "Bounded apply", copy: "Only the drifted subjects, one page at a time." },
                { icon: RefreshCcw, title: "Resumable by cursor", copy: "Stop and continue without starting over." },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <Reveal key={item.title} delay={index * 0.04}>
                    <div className="flex items-start gap-3 rounded-2xl border border-line bg-card p-4">
                      <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-mint-soft text-green-deep">
                        <Icon className="size-3.5" />
                      </span>
                      <div>
                        <div className="text-[11.5px] font-semibold text-ink">{item.title}</div>
                        <p className="mt-0.5 text-[10px] leading-5 text-muted-ink">{item.copy}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section id="failures" className="pt-[104px] sm:pt-[120px]">
          <div className="page-container">
            <Reveal className="mx-auto max-w-[760px] text-center">
              <span className="inline-flex items-center rounded-full bg-mint px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-green-deep">
                06 / Failure matrix
              </span>
              <h2 className="mt-4 text-h2 font-medium text-ink">
                The failures
                <br />
                are the product.
              </h2>
              <p className="mx-auto mt-4 max-w-[600px] text-[16px] leading-7 text-muted-ink sm:text-[17px]">
                A counter handles the happy path. This is what happens when the client,
                the network, or the projection does something ordinary and terrible.
              </p>
            </Reveal>

            <Reveal className="mt-10">
              <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-soft hover:bg-surface-soft">
                      <TableHead className="pl-4 sm:pl-6">Failure</TableHead>
                      <TableHead className="hidden md:table-cell">A counter</TableHead>
                      <TableHead>Watchline</TableHead>
                      <TableHead className="hidden pr-4 lg:table-cell sm:pr-6">Proof</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failures.map((row) => (
                      <TableRow key={row.failure}>
                        <TableCell className="max-w-[240px] whitespace-normal pl-4 text-[11px] font-medium leading-5 text-ink sm:pl-6">
                          {row.failure}
                        </TableCell>
                        <TableCell className="hidden whitespace-normal text-[10.5px] leading-5 text-muted-ink md:table-cell">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="grid size-4 place-items-center rounded-full bg-danger/10 text-danger">
                              <X className="size-2.5" />
                            </span>
                            {row.counter}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[240px] whitespace-normal text-[10.5px] leading-5 text-ink">
                          <span className="inline-flex items-start gap-1.5">
                            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-mint text-green-deep">
                              <Check className="size-2.5" />
                            </span>
                            {row.engine}
                          </span>
                        </TableCell>
                        <TableCell className="hidden whitespace-normal pr-4 lg:table-cell sm:pr-6">
                          <code className="rounded-md bg-surface-muted px-1.5 py-1 font-mono text-[8px] leading-4 text-muted-ink">
                            {row.proof}
                          </code>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft px-4 py-3 text-[9px] text-subtle-ink sm:px-6">
                  <span>Every row above is covered by the engine's test suite.</span>
                  <Link
                    href={site.links.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-green-deep underline-offset-2 hover:underline"
                  >
                    Read the tests
                    <ArrowUpRight className="size-3" />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="api" className="pt-[104px] sm:pt-[120px]">
          <div className="page-container">
            <Reveal className="mx-auto max-w-[760px] text-center">
              <span className="inline-flex items-center rounded-full bg-mint px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-green-deep">
                07 / API surface
              </span>
              <h2 className="mt-4 text-h2 font-medium text-ink">
                A small surface.
                <br />
                A strict contract.
              </h2>
              <p className="mx-auto mt-4 max-w-[590px] text-[16px] leading-7 text-muted-ink sm:text-[17px]">
                Three paths: write, read, repair. Every response returns a verdict, not a
                vague acknowledgement.
              </p>
            </Reveal>

            <Reveal className="mt-10">
              <ApiTabs />
            </Reveal>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Auth is a layer above",
                  copy: "Access control answers who may watch. The engine answers what was watched.",
                },
                {
                  icon: Layers,
                  title: "The broker is not a judge",
                  copy: "It schedules projection updates. A unique index decides what counts.",
                },
                {
                  icon: TableProperties,
                  title: "No player coupling",
                  copy: "No SDK, no iframe, no media fetch. A purity guard fails the test suite if coupling appears.",
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <Reveal key={item.title} delay={index * 0.04}>
                    <div className="flex h-full items-start gap-3 rounded-2xl border border-line bg-card p-4">
                      <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-mint-soft text-green-deep">
                        <Icon className="size-3.5" />
                      </span>
                      <div>
                        <div className="text-[11.5px] font-semibold text-ink">{item.title}</div>
                        <p className="mt-0.5 text-[10px] leading-5 text-muted-ink">{item.copy}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="pt-[104px] sm:pt-[120px]">
          <div className="page-container">
            <Reveal>
              <div className="relative overflow-hidden rounded-panel border border-mint-deep gradient-enterprise px-5 py-12 text-center sm:px-9 sm:py-16">
                <div className="absolute inset-x-0 top-0 h-px gradient-brand opacity-70" aria-hidden="true" />
                <div className="pointer-events-none absolute -right-24 -top-32 size-[380px] rounded-full border border-white/40 bg-white/20 blur-3xl" aria-hidden="true" />
                <div className="relative mx-auto max-w-[700px]">
                  <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-green-deep backdrop-blur">
                    <Sparkles className="size-3" />
                    The code is open
                  </span>
                  <h2 className="mt-4 text-h2 font-medium text-ink">See the number defend itself.</h2>
                  <p className="mx-auto mt-4 max-w-[560px] text-[16px] leading-7 text-muted-ink">
                    Read the reasoning, the arithmetic and the failure modes. Then read
                    the repository for every line that earns the number.
                  </p>
                  <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
                    <Button asChild size="lg" className="h-12 px-6 text-[15px]">
                      <a href="#watch-math">
                        Read the watch math
                        <ArrowRight className="size-4" />
                      </a>
                    </Button>
                    <Button asChild variant="secondary" size="lg" className="h-12 px-6 text-[15px]">
                      <Link href={site.links.github} target="_blank" rel="noreferrer">
                        <GithubIcon className="size-4" />
                        Read the source
                      </Link>
                    </Button>
                  </div>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] text-muted-ink">
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="size-3 text-green" />
                      Test-covered invariants
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="size-3 text-green" />
                      Deterministic demo
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="size-3 text-green" />
                      No backend calls
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
