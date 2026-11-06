import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleCheck,
  Clock3,
  Fingerprint,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";
import { GithubIcon } from "@/components/brand/social-icons";
import { Button } from "@/components/ui/button";
import { sessions } from "@/lib/demo-data";

const highlights = [
  {
    icon: Fingerprint,
    title: "Trace every number",
    copy: "Open a metric and see the exact evidence rows that produced it.",
  },
  {
    icon: ShieldCheck,
    title: "Audit without a script",
    copy: "Snapshot, diff, dry-run, repair and verify from one surface.",
  },
  {
    icon: Users,
    title: "Sessions, not guesses",
    copy: "Watch ranges and the raw event trail sit beside the summary.",
  },
];

function FocusedSessionCard() {
  const session = sessions[0];
  return (
    <div className="overflow-hidden rounded-[24px] border border-line bg-card shadow-deep">
      <div className="flex h-9 items-center gap-2.5 border-b border-line bg-card px-3.5">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((dot) => (
            <span key={dot} className="size-[6px] rounded-full bg-line" />
          ))}
        </div>
        <div className="flex h-6 flex-1 items-center gap-1.5 rounded-md bg-surface-muted px-2.5 text-[8.5px] text-subtle-ink">
          <span className="size-1.5 rounded-full bg-green" />
          app.watchline.dev / sessions / S-8841
        </div>
        <span className="text-[8px] font-medium text-green-deep">Verified</span>
      </div>

      <div className="bg-surface-soft p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#F7C9A8] to-[#B7E3C8] text-[10px] font-bold text-[#3C4A42]">
              {session.initials}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-semibold tracking-[-0.02em] text-ink">{session.viewer}</h3>
                <span className="rounded-full bg-mint px-1.5 py-0.5 text-[6.5px] font-semibold text-green-deep">
                  Verified
                </span>
              </div>
              <div className="mt-0.5 text-[8.5px] text-subtle-ink">
                {session.content} · {session.started}
              </div>
            </div>
          </div>
          <div className="hidden items-center gap-1 rounded-full border border-line bg-card px-2 py-1 text-[7.5px] text-muted-ink sm:flex">
            <MousePointerClick className="size-2.5" />
            Session S-8841
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ["Unique watched", "38:12"],
            ["Completion", "90%"],
            ["Segments", "4"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-line bg-card p-2.5">
              <div className="text-[6.5px] uppercase tracking-[0.07em] text-subtle-ink">{label}</div>
              <div className="mt-0.5 text-[15px] font-semibold tracking-[-0.03em] text-ink">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-2 rounded-xl border border-line bg-card p-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[8px] font-semibold text-ink">
              <Clock3 className="size-3 text-green" />
              Watch range
            </span>
            <span className="text-[7px] text-subtle-ink">4 accepted segments · 38:12 unique</span>
          </div>
          <div className="relative mt-3 flex h-5 overflow-hidden rounded-md bg-surface-soft">
            {[
              [0, 13.6],
              [18.3, 20.7],
              [42.4, 19.7],
              [68.5, 31.5],
            ].map(([left, width], index) => (
              <span
                key={index}
                className="absolute inset-y-1 rounded-[3px] bg-green/75"
                style={{ left: `${left}%`, width: `${width}%` }}
              />
            ))}
            <span className="absolute inset-y-0 left-[59%] w-px bg-amber/40" />
          </div>
          <div className="mt-1.5 flex justify-between text-[6px] text-subtle-ink">
            <span>00:00</span>
            <span>10:30</span>
            <span>21:00</span>
            <span>31:30</span>
            <span>42:18</span>
          </div>
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-[1.25fr_1fr]">
          <div className="overflow-hidden rounded-xl border border-line bg-card">
            <div className="flex items-center justify-between border-b border-line-soft px-3 py-2">
              <span className="text-[8px] font-semibold text-ink">Event trail</span>
              <span className="text-[6px] text-subtle-ink">8 events</span>
            </div>
            <div className="divide-y divide-[#F3F5F3]">
              {session.events.slice(0, 4).map((event, index) => (
                <div key={`${event.time}-${index}`} className="flex items-center gap-2 px-3 py-1.5">
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${
                      event.event === "pause" || event.event === "seeking" ? "bg-amber" : "bg-green"
                    }`}
                  />
                  <span className="w-[38px] shrink-0 text-[6px] tabular text-subtle-ink">{event.time.slice(0, 5)}</span>
                  <span className="w-[46px] shrink-0 font-mono text-[6.5px] text-body">{event.event}</span>
                  <span className="truncate text-[6px] text-subtle-ink">{event.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-mint-deep bg-gradient-to-b from-mint-soft to-card p-3">
            <div className="flex items-center gap-1.5 text-[7.5px] font-semibold text-green-deep">
              <Sparkles className="size-3" />
              Evidence vs. claim
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-card px-2 py-1.5">
              <span className="text-[7px] text-muted-ink">Client claimed</span>
              <span className="text-[9px] font-semibold text-danger-foreground line-through">41:08</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between rounded-lg bg-card px-2 py-1.5">
              <span className="text-[7px] text-muted-ink">Server accepted</span>
              <span className="text-[9px] font-semibold text-green-deep">38:12</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[6.5px] text-green-deep">
              <CircleCheck className="size-2.5" />
              Recomputed from 4 ranges
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardPreview() {
  return (
    <section id="surface" className="pt-[104px] sm:pt-[120px]">
      <div className="page-container">
        <Reveal>
          <div className="relative overflow-hidden rounded-panel border border-line gradient-hero p-5 sm:p-8 lg:p-12">
            <div className="pointer-events-none absolute inset-0 dot-grid opacity-[0.18]" aria-hidden="true" />
            <div className="relative grid items-center gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12">
              <div className="max-w-[470px]">
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-green-deep backdrop-blur">
                  05 / The surface
                </span>
                <h2 className="mt-4 text-h2 font-medium text-ink">
                  A dashboard that
                  <br />
                  shows its work.
                </h2>
                <p className="mt-4 text-[16px] leading-7 text-muted-ink sm:text-[17px]">
                  The surface is not a wall of totals. It is a path from a number to the
                  session, the event, and the exact range that made it true.
                </p>

                <div className="mt-7 space-y-4">
                  {highlights.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="flex items-start gap-3">
                        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[11px] border border-white bg-card/80 text-green-deep shadow-[0_1px_2px_rgba(13,15,13,0.04)]">
                          <Icon className="size-3.5" />
                        </span>
                        <div>
                          <div className="text-[13px] font-semibold text-ink">{item.title}</div>
                          <div className="mt-0.5 text-[12px] leading-5 text-muted-ink">{item.copy}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-7 flex flex-wrap gap-2.5">
                  <Button asChild>
                    <Link href="/architecture">
                      Read the architecture
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href="https://github.com/avesh-pathak/video-analytics-engine" target="_blank" rel="noreferrer">
                      <GithubIcon className="size-4" />
                      View source
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[650px] lg:mx-0">
                <div className="absolute -right-2 -top-4 z-20 hidden items-center gap-2 rounded-2xl border border-line bg-card/90 px-3.5 py-2.5 shadow-soft backdrop-blur sm:flex">
                  <span className="grid size-7 place-items-center rounded-full bg-mint text-green-deep">
                    <ShieldCheck className="size-3.5" />
                  </span>
                  <div>
                    <div className="text-[8px] uppercase tracking-[0.08em] text-subtle-ink">Projection agreement</div>
                    <div className="text-[12px] font-semibold tracking-[-0.02em] text-ink">
                      99.98% <span className="font-normal text-muted-ink">· audited 4m ago</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 sm:-rotate-[0.6deg] sm:transition-transform sm:duration-500 sm:hover:rotate-0">
                  <FocusedSessionCard />
                </div>

                <div className="absolute -bottom-5 -left-3 z-20 hidden items-center gap-2 rounded-2xl border border-line bg-card/90 px-3.5 py-2.5 shadow-soft backdrop-blur sm:flex">
                  <span className="grid size-7 place-items-center rounded-full bg-mint text-green-deep">
                    <Check className="size-3.5" />
                  </span>
                  <div>
                    <div className="text-[8px] uppercase tracking-[0.08em] text-subtle-ink">Repair verified</div>
                    <div className="text-[11px] font-semibold text-ink">3 rows · delta 0.00%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
