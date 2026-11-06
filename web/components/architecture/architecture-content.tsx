import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Database,
  KeyRound,
  Layers,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
  TableProperties,
  X,
} from "lucide-react";

import { ApiTabs } from "@/components/architecture/api-tabs";
import { MessageLayer } from "@/components/architecture/message-layer";
import { MermaidDiagram } from "@/components/architecture/mermaid-diagram";
import { SystemOverview } from "@/components/architecture/system-overview";
import { WatchMathLab } from "@/components/architecture/watch-math-lab";
import { GithubIcon } from "@/components/brand/social-icons";
import { Reveal } from "@/components/marketing/reveal";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
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
import { clientDiagram, idempotencyDiagram, idempotencyDiagramMobile, repairDiagram, repairDiagramMobile } from "@/lib/architecture-diagrams";

const invariants = [
  {
    icon: ShieldCheck,
    title: "The client is untrusted.",
    copy: "The server validates playback ranges and computes the metrics itself.",
    proof: "computeWatchMetrics(ranges, duration)",
  },
  {
    icon: KeyRound,
    title: "Delivery is at-least-once.",
    copy: "Request keys and segment identities stop retries from counting twice.",
    proof: "UNIQUE(idempotency_key)",
  },
  {
    icon: Database,
    title: "Reads are projections.",
    copy: "Stored totals can be rebuilt from the append-only evidence log.",
    proof: "drop → rebuild → compare",
  },
  {
    icon: RefreshCcw,
    title: "Drift is repairable.",
    copy: "Audit the difference, repair affected subjects, then verify the result.",
    proof: "audit → repair → verify",
  },
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

const boundaries = [
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
];

export function ArchitectureContent() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="pt-[84px] sm:pt-[96px]">
          <div className="page-container">
            <div className="gradient-hero rounded-[32px] border border-line/60 px-5 py-12 sm:rounded-[40px] sm:px-10 sm:py-16 lg:px-14">
              <Reveal className="max-w-[820px]">
                <h1 className="text-hero font-medium text-ink">
                  How a second
                  <br />
                  becomes a number
                </h1>
                <p className="mt-5 max-w-[620px] text-base leading-7 text-muted-ink sm:text-lg sm:leading-8">
                  Follow playback evidence from the browser to a verified total.
                  Explore the flowcharts, or try the watch-time calculation below.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
              </Reveal>
            </div>
          </div>
        </section>

        <SystemOverview />

        <section id="invariants" className="pt-[80px] sm:pt-[104px]">
          <div className="page-container">
            <Reveal className="max-w-[760px]">
              <h2 className="text-h2 font-medium text-ink">
                Four guarantees.
              </h2>
            </Reveal>

            <div className="mt-10 grid gap-x-12 gap-y-9 border-t border-line pt-8 sm:grid-cols-2">
              {invariants.map((item) => {
                const Icon = item.icon;
                return (
                  <Reveal key={item.title}>
                    <div className="flex gap-4">
                      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-mint-soft text-green-deep">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-lg font-medium text-ink">{item.title}</h3>
                        <p className="mt-1.5 text-sm leading-6 text-muted-ink">{item.copy}</p>
                        <p className="mt-2 text-xs text-subtle-ink">
                          Proof{" "}
                          <code className="break-words font-mono text-xs text-body">
                            {item.proof}
                          </code>
                        </p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section id="watch-math" className="pt-[80px] sm:pt-[104px]">
          <div className="page-container">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-14">
              <Reveal className="min-w-0 lg:pt-2">
                <h2 className="text-[30px] font-medium leading-[1.12] tracking-[-0.03em] text-ink sm:text-[36px]">
                  Count each second once.
                </h2>
                <p className="mt-4 max-w-[320px] text-sm leading-6 text-muted-ink">
                  Watch the same part twice: total watch time increases, but unique watch
                  time stays the same.
                </p>

                <details className="group mt-6 border-t border-line pt-4">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                    <span>How overlaps are counted</span>
                    <ChevronDown className="size-4 shrink-0 text-subtle-ink transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-4 space-y-6">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-medium text-ink">
                        <span className="grid size-6 place-items-center rounded-full bg-danger-surface text-danger">
                          <X className="size-3.5" aria-hidden="true" />
                        </span>
                        Adding lengths
                      </p>
                      <pre className="mt-3 max-w-full overflow-x-auto overscroll-x-contain rounded-xl bg-muted p-4 font-mono text-xs leading-6 text-danger-foreground">
{`// adding lengths counts a rewatch twice
progress.uniqueContentSeconds +=
  segment.endSecond - segment.startSecond;`}
                      </pre>
                      <p className="mt-2 text-sm leading-6 text-muted-ink">
                        Correct for the first range. Wrong as soon as two ranges overlap.
                      </p>
                    </div>

                    <div>
                      <p className="flex items-center gap-2 text-sm font-medium text-ink">
                        <span className="grid size-6 place-items-center rounded-full bg-success text-success-foreground">
                          <Check className="size-3.5" aria-hidden="true" />
                        </span>
                        Merging ranges
                      </p>
                      <pre className="mt-3 max-w-full overflow-x-auto overscroll-x-contain rounded-xl bg-muted p-4 font-mono text-xs leading-6 text-green-deep">
{`const merged = mergeRanges([
  ...progress.watchedRanges,
  newRange,
]);
progress.uniqueContentSeconds =
  sumRanges(merged);`}
                      </pre>
                      <p className="mt-2 text-sm leading-6 text-muted-ink">
                        Every accepted range passes through the same function. Shared seconds
                        are counted once.
                      </p>
                    </div>
                  </div>
                </details>
              </Reveal>

              <Reveal delay={0.06} className="min-w-0">
                <WatchMathLab />
              </Reveal>
            </div>
          </div>
        </section>

        <section id="write-path" className="pt-[80px] sm:pt-[104px]">
          <div className="page-container">
            <Reveal className="max-w-[760px]">
              <h2 className="text-h2 font-medium text-ink">
                Retries shouldn’t count twice.
              </h2>
              <p className="mt-4 max-w-[560px] text-base leading-7 text-muted-ink">
                One key protects the request. Another protects each playback segment.
              </p>
            </Reveal>

            <Reveal className="mt-8">
              <MermaidDiagram
                source={idempotencyDiagram}
                mobileSource={idempotencyDiagramMobile}
                label="Two layers of idempotency: request keys and segment identities"
                caption="Request keys catch repeated batches. Segment identities catch the same evidence, even in a new session."
              />
            </Reveal>

            <Reveal className="mt-6 border-t border-line pt-4">
              <p className="flex max-w-[75ch] items-start gap-2 text-sm leading-6 text-muted-ink">
                <LockKeyhole className="mt-0.5 size-4 shrink-0 text-green-deep" />
                <span>
                  Evidence, totals, and the outbox commit together. The broker delivers
                  events separately; a unique index prevents double-counting.
                </span>
              </p>

              <details className="group mt-4 border-t border-line pt-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                  <span>Replay details</span>
                  <ChevronDown className="size-4 shrink-0 text-subtle-ink transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-ink">Request key</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-ink">
                      A repeated key returns the original acknowledgement instead of
                      applying the batch again.
                    </p>
                    <code className="mt-2 block break-words font-mono text-xs text-body">
                      UNIQUE(idempotency_key)
                    </code>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-ink">Evidence key</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-ink">
                      The scope is session-independent, so the same evidence cannot count
                      twice under a new session id.
                    </p>
                    <code className="mt-2 block break-words font-mono text-xs text-body">
                      UNIQUE(student, scope, client_segment_id)
                    </code>
                  </div>
                </div>
              </details>

              <details className="group mt-4 border-t border-line pt-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                  <span>How the browser closes a segment</span>
                  <ChevronDown className="size-4 shrink-0 text-subtle-ink transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-4">
                  <p className="max-w-[70ch] text-sm leading-6 text-muted-ink">
                    A segment opens while playback is running and closes on pause, seek,
                    buffering, rate change, tab hide, end, rewind, or at 110 seconds of
                    content.
                  </p>
                  <MermaidDiagram
                    source={clientDiagram}
                    label="Client segment state machine and events that close a playback range"
                    caption="The tracker is player-agnostic: ten standard media events are the whole adapter surface. No SDK, iframe or provider data is involved."
                  />
                </div>
              </details>
            </Reveal>
          </div>
        </section>

        <MessageLayer />

        <section id="repair" className="pt-[80px] sm:pt-[104px]">
          <div className="page-container">
            <Reveal className="max-w-[760px]">
              <h2 className="text-h2 font-medium text-ink">
                Check the totals. Repair the difference.
              </h2>
              <p className="mt-4 max-w-[600px] text-base leading-7 text-muted-ink">
                Compare stored totals with raw evidence. Fix only what disagrees.
              </p>
            </Reveal>

            <Reveal className="mt-8">
              <MermaidDiagram
                source={repairDiagram}
                mobileSource={repairDiagramMobile}
                compactBelow={1280}
                label="Evidence and projection repair: audit, dry run, apply, and verify"
                caption="Audit → preview changes → repair → verify. A successful repair leaves no difference."
              />
            </Reveal>

            <Reveal className="mt-6 border-t border-line pt-4">
              <p className="max-w-[70ch] text-sm leading-6 text-muted-ink">
                Audit is read-only. Apply is separate, keyset-paged per subject, and
                resumable by cursor.
              </p>
              <details className="group mt-4 border-t border-line pt-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                  <span>Paging and savepoints</span>
                  <ChevronDown className="size-4 shrink-0 text-subtle-ink transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 max-w-[70ch] text-sm leading-6 text-muted-ink">
                  A repair walks subjects in keyset order and holds at most one page of
                  locks. Each subject is repaired in its own savepoint, so a bad row is
                  reported and skipped instead of aborting the batch.
                </p>
              </details>
            </Reveal>
          </div>
        </section>

        <section id="failures" className="pt-[80px] sm:pt-[104px]">
          <div className="page-container">
            <Reveal className="max-w-[760px]">
              <h2 className="text-h2 font-medium text-ink">
                When things go wrong.
              </h2>
              <p className="mt-4 max-w-[560px] text-base leading-7 text-muted-ink">
                See how Watchline handles retries, rewatches, and incorrect totals.
              </p>
            </Reveal>

            <Reveal className="mt-8">
              <details className="group rounded-card border border-line bg-card">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="block text-base font-medium text-ink">Failure matrix</span>
                    <span className="mt-1 block text-sm text-muted-ink">
                      Six failures, each caught by a specific guard.
                    </span>
                  </span>
                  <ChevronDown className="size-5 shrink-0 text-subtle-ink transition-transform group-open:rotate-180" />
                </summary>

                <div className="border-t border-line">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-surface-soft hover:bg-surface-soft">
                        <TableHead className="pl-5 sm:pl-6">Failure</TableHead>
                        <TableHead className="hidden sm:table-cell">A counter</TableHead>
                        <TableHead>Watchline</TableHead>
                        <TableHead className="hidden pr-5 md:table-cell sm:pr-6">Proof</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {failures.map((row) => (
                        <TableRow key={row.failure}>
                          <TableCell className="min-w-[180px] max-w-[260px] whitespace-normal pl-5 text-sm font-medium leading-6 text-ink sm:pl-6">
                            {row.failure}
                          </TableCell>
                          <TableCell className="hidden min-w-[160px] max-w-[220px] whitespace-normal text-sm leading-6 text-muted-ink sm:table-cell">
                            <span className="inline-flex items-start gap-2">
                              <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-danger-surface text-danger">
                                <X className="size-2.5" aria-hidden="true" />
                              </span>
                              {row.counter}
                            </span>
                          </TableCell>
                          <TableCell className="min-w-[200px] max-w-[280px] whitespace-normal text-sm leading-6 text-ink">
                            <span className="inline-flex items-start gap-2">
                              <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-mint text-green-deep">
                                <Check className="size-2.5" aria-hidden="true" />
                              </span>
                              {row.engine}
                            </span>
                          </TableCell>
                          <TableCell className="hidden min-w-[160px] whitespace-normal pr-5 md:table-cell sm:pr-6">
                            <code className="break-words rounded-md bg-surface-muted px-2 py-1 font-mono text-xs leading-5 text-muted-ink">
                              {row.proof}
                            </code>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-4 text-sm text-muted-ink sm:px-6">
                    <span>Every row above is covered by the engine&apos;s test suite.</span>
                    <Link
                      href={site.links.github}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center gap-1 font-medium text-green-deep underline-offset-2 hover:underline"
                    >
                      Read the tests
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </details>
            </Reveal>
          </div>
        </section>

        <section id="api" className="pt-[80px] sm:pt-[104px]">
          <div className="page-container">
            <Reveal className="max-w-[760px]">
              <h2 className="text-h2 font-medium text-ink">
                The API, at a glance.
              </h2>
              <p className="mt-4 max-w-[560px] text-base leading-7 text-muted-ink">
                Write evidence, read progress, or repair totals.
              </p>
            </Reveal>

            <Reveal className="mt-8">
              <ApiTabs />
            </Reveal>

            <Reveal className="mt-8 border-t border-line pt-4">
              <details className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                  <span>What the API does not do</span>
                  <ChevronDown className="size-4 shrink-0 text-subtle-ink transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-5 grid gap-6 sm:grid-cols-3">
                  {boundaries.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-medium text-ink">
                          <Icon className="size-4 text-green-deep" aria-hidden="true" />
                          {item.title}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-muted-ink">{item.copy}</p>
                      </div>
                    );
                  })}
                </div>
              </details>
            </Reveal>
          </div>
        </section>

        <section className="pt-[80px] sm:pt-[104px]">
          <div className="page-container">
            <Reveal>
              <div className="gradient-enterprise rounded-panel border border-line px-5 py-10 sm:px-9 sm:py-12">
                <div className="max-w-[620px]">
                  <h2 className="text-h2 font-medium text-ink">Explore the implementation.</h2>
                  <p className="mt-4 text-base leading-7 text-muted-ink">
                    The engine, APIs, and design decisions are in the repository.
                  </p>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
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
