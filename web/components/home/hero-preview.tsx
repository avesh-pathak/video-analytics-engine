"use client";

import * as React from "react";
import {
  Activity,
  BarChart3,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  LayoutDashboard,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { contentRows, sessions } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export type PreviewTab = "overview" | "sessions" | "quality" | "content";

const miniNav = [
  { icon: LayoutDashboard, label: "Overview" },
  { icon: Play, label: "Sessions" },
  { icon: Video, label: "Content" },
  { icon: ShieldCheck, label: "Quality" },
];

function smoothPath(values: number[], width: number, height: number, pad = 4) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const points = values.map((value, i) => ({
    x: pad + (i / Math.max(values.length - 1, 1)) * (width - pad * 2),
    y: pad + (1 - (value - min) / range) * (height - pad * 2),
  }));
  const line = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = points[i - 1];
    const cx = (prev.x + point.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${point.y}, ${point.x} ${point.y}`;
  }, "");
  return {
    line,
    area: `${line} L ${width - pad} ${height} L ${pad} ${height} Z`,
    points,
  };
}

function MiniArea({
  values,
  className,
  id,
  stroke = "var(--chart-1)",
  fill = "var(--chart-1)",
  height = 116,
}: {
  values: number[];
  className?: string;
  id: string;
  stroke?: string;
  fill?: string;
  height?: number;
}) {
  const width = 520;
  const { area, line, points } = smoothPath(values, width, height, 5);
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-full w-full overflow-visible", className)}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.22" />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.2, 0.45, 0.7].map((p) => (
        <line
          key={p}
          x1="0"
          x2={width}
          y1={height * p}
          y2={height * p}
          stroke="var(--border)"
          strokeWidth="1"
          strokeDasharray="3 6"
        />
      ))}
      <path d={area} fill={`url(#${id}-fill)`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx={last.x} cy={last.y} r="4.5" fill="#fff" stroke={stroke} strokeWidth="2.4" />
    </svg>
  );
}

const spark = [22, 26, 24, 31, 29, 34, 33, 38, 36, 43, 41, 47, 45, 52];

function OverviewPreview() {
  const chart = [18, 23, 21, 27, 25, 31, 28, 34, 32, 38, 36, 41, 39, 45, 43, 49, 47, 54, 51, 58];
  return (
    <div className="flex h-full min-h-[440px] bg-surface-soft">
      <aside className="hidden w-[156px] shrink-0 flex-col border-r border-line bg-surface-soft p-3 md:flex">
        <div className="mb-5 flex items-center gap-2">
          <LogoMark className="h-3.5 w-4 text-ink" />
          <span className="text-[10px] font-semibold tracking-[-0.03em] text-ink">Watchline</span>
        </div>
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-card px-2 py-2">
          <span className="grid size-5 place-items-center rounded-md bg-mint text-[7px] font-bold text-green-deep">
            NL
          </span>
          <div className="min-w-0">
            <div className="truncate text-[8px] font-semibold text-ink">Northlight Academy</div>
            <div className="text-[6.5px] text-subtle-ink">Pro workspace</div>
          </div>
        </div>
        <div className="space-y-0.5">
          {miniNav.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[8.5px]",
                  index === 0 ? "bg-mint font-semibold text-green-deep" : "text-muted-ink",
                )}
              >
                <Icon className="size-[11px]" />
                {item.label}
              </div>
            );
          })}
        </div>
        <div className="mt-auto rounded-xl border border-mint-deep bg-card p-2.5">
          <div className="flex items-center gap-1.5 text-[7.5px] font-semibold text-green-deep">
            <span className="size-1.5 rounded-full bg-green" />
            Engine healthy
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-mint">
            <div className="h-full w-[96%] rounded-full bg-green" />
          </div>
          <div className="mt-1.5 flex justify-between text-[6px] text-subtle-ink">
            <span>Outbox</span>
            <span>0 rows</span>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 overflow-hidden p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[12px] font-semibold tracking-[-0.02em] text-ink">Overview</div>
            <div className="mt-0.5 text-[7.5px] text-subtle-ink">Tuesday, 5 November · updated 4m ago</div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="grid size-6 place-items-center rounded-full border border-line bg-card text-subtle-ink">
              <Search className="size-3" />
            </span>
            <span className="hidden items-center gap-1 rounded-full border border-line bg-card px-2 py-1 text-[7.5px] font-medium text-muted-ink sm:inline-flex">
              Last 30 days
              <ChevronRight className="size-2.5" />
            </span>
            <span className="grid size-6 place-items-center rounded-full bg-gradient-to-br from-[#F7C9A8] to-[#B7E3C8] text-[7px] font-bold text-[#3C4A42]">
              AP
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
          {[
            { label: "Unique watch", value: "12,482h", delta: "+18.4%" },
            { label: "Completion", value: "68.4%", delta: "+4.2pt" },
            { label: "Drift", value: "0.02%", delta: "healthy" },
          ].map((metric) => (
            <div key={metric.label} className="rounded-lg border border-line bg-card p-2 sm:rounded-xl sm:p-2.5">
              <div className="truncate text-[6.5px] font-medium uppercase tracking-[0.06em] text-subtle-ink sm:text-[7px]">
                {metric.label}
              </div>
              <div className="mt-1 text-[12px] font-semibold tracking-[-0.035em] text-ink sm:text-[15px]">
                {metric.value}
              </div>
              <div className="mt-0.5 text-[6.5px] font-semibold text-green sm:text-[7px]">{metric.delta}</div>
            </div>
          ))}
        </div>

        <div className="mt-2 rounded-xl border border-line bg-card p-2.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[8px] font-semibold text-ink">Watch time</div>
              <div className="text-[6.5px] text-subtle-ink">Unique vs. repeat · hours</div>
            </div>
            <div className="flex items-center gap-2 text-[6px] text-subtle-ink">
              <span className="inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-green" />
                Unique
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-sky-soft ring-1 ring-[#A9DCE9]" />
                Repeat
              </span>
            </div>
          </div>
          <div className="mt-1.5 h-[92px] sm:h-[106px]">
            <MiniArea values={chart} id="hero-mini-area" height={106} />
          </div>
          <div className="mt-1 flex justify-between text-[5.5px] text-subtle-ink">
            <span>Oct 7</span>
            <span>Oct 14</span>
            <span>Oct 21</span>
            <span>Oct 28</span>
            <span>Nov 5</span>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-[1.35fr_1fr] gap-2">
          <div className="rounded-xl border border-line bg-card p-2.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[8px] font-semibold text-ink">Top content</span>
              <span className="text-[6.5px] text-subtle-ink">Unique hours</span>
            </div>
            <div className="space-y-1.5">
              {contentRows.slice(0, 3).map((row, index) => (
                <div key={row.id} className="flex items-center gap-2">
                  <span className="text-[6px] tabular text-subtle-ink">0{index + 1}</span>
                  <span
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-md text-white",
                      row.tone === "mint" && "bg-gradient-to-br from-[#30A66D] to-[#16BFA6]",
                      row.tone === "sky" && "bg-gradient-to-br from-[#62C6DF] to-[#009CD0]",
                      row.tone === "graphite" && "bg-gradient-to-br from-[#3A4248] to-[#141A22]",
                    )}
                  >
                    <Play className="size-2 fill-white" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[7.5px] font-medium text-body">{row.title}</span>
                  <span className="text-[7px] tabular text-muted-ink">{row.uniqueHours.toLocaleString()}h</span>
                  <span className="w-1.5 rounded-full bg-mint-deep">
                    <span className="block size-1.5 rounded-full bg-green" />
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-mint-deep bg-mint-soft p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-semibold text-green-deep">Projection health</span>
              <ShieldCheck className="size-3 text-green" />
            </div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-[22px] font-semibold leading-none tracking-[-0.04em] text-ink">99.98%</span>
              <span className="mb-0.5 rounded-full bg-card px-1.5 py-0.5 text-[5.5px] font-semibold text-green-deep">
                0.02% drift
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-card">
              <div className="h-full w-[99%] rounded-full bg-green" />
            </div>
            <div className="mt-2 flex items-center gap-1 text-[6.5px] text-green-deep">
              <CircleCheck className="size-2.5" />
              Last audit passed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionsPreview() {
  return (
    <div className="h-full min-h-[440px] overflow-hidden bg-surface-soft p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold tracking-[-0.02em] text-ink">Sessions</div>
          <div className="mt-0.5 text-[7.5px] text-subtle-ink">Evidence, event by event</div>
        </div>
        <span className="rounded-full border border-line bg-card px-2 py-1 text-[7.5px] font-medium text-muted-ink">
          Last 24 hours
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: "Sessions", value: "2,941", icon: Users },
          { label: "Verified", value: "99.4%", icon: ShieldCheck },
          { label: "Median watch", value: "18:42", icon: Clock3 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-line bg-card p-2.5">
            <div className="flex items-center justify-between text-[6.5px] uppercase tracking-[0.06em] text-subtle-ink">
              {label}
              <Icon className="size-2.5" />
            </div>
            <div className="mt-1 text-[15px] font-semibold tracking-[-0.03em] text-ink">{value}</div>
          </div>
        ))}
      </div>
      <div className="mt-2.5 overflow-hidden rounded-xl border border-line bg-card">
        <div className="grid grid-cols-[1fr_52px_50px] gap-2 border-b border-line px-3 py-2 text-[6px] font-semibold uppercase tracking-[0.08em] text-subtle-ink sm:grid-cols-[1fr_70px_70px_56px]">
          <span>Viewer / content</span>
          <span className="hidden sm:block">Watch range</span>
          <span>Watched</span>
          <span>Status</span>
        </div>
        <div className="divide-y divide-border">
          {sessions.slice(0, 5).map((session) => (
            <div
              key={session.id}
              className="grid grid-cols-[1fr_52px_50px] items-center gap-2 px-3 py-2 sm:grid-cols-[1fr_70px_70px_56px]"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#F7C9A8] to-[#B7E3C8] text-[6px] font-bold text-[#3C4A42]">
                  {session.initials}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[7.5px] font-semibold text-ink">{session.viewer}</div>
                  <div className="truncate text-[6px] text-subtle-ink">{session.content}</div>
                </div>
              </div>
              <div className="hidden items-center gap-[2px] sm:flex">
                {Array.from({ length: 18 }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-2.5 flex-1 rounded-[1px]",
                      i > 2 && i < 9 ? "bg-green/75" : i > 11 && i < 16 ? "bg-green/45" : "bg-surface-strong",
                    )}
                  />
                ))}
              </div>
              <div className="text-[7px] tabular text-muted-ink">{session.watched}</div>
              <div>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[5.5px] font-semibold",
                    session.status === "Verified" && "bg-mint text-green-deep",
                    session.status === "Repaired" && "bg-warning text-warning-foreground",
                    session.status === "Deduped" && "bg-sky-soft/60 text-sky-ink",
                  )}
                >
                  {session.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2.5 grid grid-cols-[1.4fr_1fr] gap-2">
        <div className="rounded-xl border border-line bg-card p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-semibold text-ink">Watch ranges · S-8841</span>
            <span className="text-[6px] text-green-deep">4 segments</span>
          </div>
          <div className="mt-3 flex h-5 gap-1 rounded-md bg-surface-muted p-1">
            {[26, 8, 34, 24].map((width, index) => (
              <span
                key={index}
                style={{ width: `${width}%` }}
                className={cn("h-full rounded-[3px]", index === 1 ? "bg-green/40" : "bg-green/80")}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[5.5px] text-subtle-ink">
            <span>00:00</span>
            <span>42:18</span>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-code-border bg-code p-2.5 text-code-foreground">
          <div className="flex items-center gap-1 text-[6.5px] text-white/55">
            <Activity className="size-2.5 text-[#7BE0A6]" />
            Server summary
          </div>
          <div className="text-[15px] font-semibold tracking-[-0.03em]">38:12</div>
          <div className="text-[6px] text-white/45">client claimed 41:08</div>
        </div>
      </div>
    </div>
  );
}

function ContentPreview() {
  return (
    <div className="h-full min-h-[440px] overflow-hidden bg-surface-soft p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold tracking-[-0.02em] text-ink">Content performance</div>
          <div className="mt-0.5 text-[7.5px] text-subtle-ink">128 titles · 30 day window</div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2 py-1 text-[7px] font-semibold text-green-deep">
          <BarChart3 className="size-2.5" />
          Unique watch
        </span>
      </div>
      <div className="mt-3 grid grid-cols-[1.05fr_1fr] gap-2">
        <div className="rounded-xl border border-line bg-card p-2.5">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-[#30A66D] to-[#16BFA6] text-white">
              <Play className="size-3 fill-white" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-[8.5px] font-semibold text-ink">Designing for trust</div>
              <div className="text-[6.5px] text-subtle-ink">Course · 42:18</div>
            </div>
          </div>
          <div className="mt-3 flex items-end gap-3">
            <div>
              <div className="text-[6px] uppercase tracking-[0.06em] text-subtle-ink">Unique</div>
              <div className="text-[15px] font-semibold tracking-[-0.03em] text-ink">3,284h</div>
            </div>
            <div className="mb-0.5 rounded-full bg-mint px-1.5 py-0.5 text-[6px] font-semibold text-green-deep">
              +12.4%
            </div>
          </div>
          <div className="mt-2 h-12">
            <MiniArea values={spark} id="content-hero-spark" height={48} stroke="var(--chart-3)" fill="var(--chart-3)" />
          </div>
        </div>
        <div className="rounded-xl border border-line bg-card p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-semibold text-ink">Completion by chapter</span>
            <span className="text-[6px] text-subtle-ink">avg 68%</span>
          </div>
          <div className="mt-2 space-y-2">
            {[
              ["Opening", 96],
              ["Framing", 88],
              ["Evidence", 74],
              ["Repair", 51],
              ["Close", 69],
            ].map(([label, value]) => (
              <div key={label as string}>
                <div className="flex justify-between text-[6px] text-subtle-ink">
                  <span>{label}</span>
                  <span className="tabular">{value}%</span>
                </div>
                <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-surface-strong">
                  <div className="h-full rounded-full bg-green" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 overflow-hidden rounded-xl border border-line bg-card">
        <div className="grid grid-cols-[1fr_52px_52px] border-b border-line px-2.5 py-1.5 text-[5.5px] font-semibold uppercase tracking-[0.08em] text-subtle-ink sm:grid-cols-[1fr_58px_58px_54px]">
          <span>Title</span>
          <span>Unique</span>
          <span className="hidden sm:block">Completion</span>
          <span>Rewatch</span>
        </div>
        {contentRows.slice(1, 6).map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[1fr_52px_52px] items-center gap-1 border-b border-line-soft px-2.5 py-1.5 last:border-0 sm:grid-cols-[1fr_58px_58px_54px]"
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                className={cn(
                  "size-4 shrink-0 rounded",
                  row.tone === "mint" && "bg-gradient-to-br from-[#A9E9C9] to-[#30A66D]",
                  row.tone === "sky" && "bg-gradient-to-br from-[#CDEAF2] to-[#62C6DF]",
                  row.tone === "lilac" && "bg-gradient-to-br from-[#E7E0FA] to-[#CFC1F2]",
                  row.tone === "sand" && "bg-gradient-to-br from-[#F7E3C6] to-[#D9B37A]",
                  row.tone === "graphite" && "bg-gradient-to-br from-[#48505A] to-[#141A22]",
                )}
              />
              <span className="truncate text-[7px] font-medium text-body">{row.title}</span>
            </div>
            <span className="text-[6.5px] tabular text-muted-ink">{row.uniqueHours.toLocaleString()}h</span>
            <span className="hidden text-[6.5px] tabular text-muted-ink sm:block">{row.completion}%</span>
            <span
              className={cn(
                "text-[6.5px] font-semibold tabular",
                row.trend >= 0 ? "text-green" : "text-danger",
              )}
            >
              {row.trend >= 0 ? "+" : ""}
              {row.trend}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QualityPreview() {
  return (
    <div className="h-full min-h-[440px] overflow-hidden bg-surface-soft p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold tracking-[-0.02em] text-ink">Data quality</div>
          <div className="mt-0.5 text-[7.5px] text-subtle-ink">Audit, repair, verify. All observable.</div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-green-bright/20 bg-mint px-2 py-1 text-[7px] font-semibold text-green-deep">
          <ShieldCheck className="size-2.5" />
          Last audit passed
        </span>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_1.1fr] gap-2">
        <div className="rounded-xl border border-line bg-card p-3">
          <div className="text-[7px] uppercase tracking-[0.08em] text-subtle-ink">Projection agreement</div>
          <div className="mt-1 text-[32px] font-semibold leading-none tracking-[-0.05em] text-ink">99.98%</div>
          <div className="mt-1 text-[7px] text-muted-ink">2s delta across 12,482h watched</div>
          <div className="relative mx-auto mt-4 grid size-[92px] place-items-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--muted)" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="var(--chart-1)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${99.98 * 2.639} 263.9`}
              />
            </svg>
            <div className="text-center">
              <div className="text-[13px] font-semibold text-green-deep">0.02%</div>
              <div className="text-[5.5px] text-subtle-ink">drift</div>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          {[
            ["Unique index integrity", "0 conflicts"],
            ["Duplicate attempts", "1,284 blocked"],
            ["Orphaned projections", "0 found"],
            ["Outbox backlog", "0 rows"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-lg border border-line bg-card px-2.5 py-2"
            >
              <span className="flex items-center gap-1.5 text-[7px] text-muted-ink">
                <Check className="size-2.5 text-green" />
                {label}
              </span>
              <span className="text-[7px] font-semibold text-ink">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 rounded-xl border border-line bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[8px] font-semibold text-ink">Latest audit</span>
          <span className="text-[6.5px] text-subtle-ink">today, 10:38 · 3.1s</span>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-5">
          {[
            ["Snapshot", "done"],
            ["Recompute", "done"],
            ["Diff", "2s"],
            ["Repair", "3 rows"],
            ["Verify", "0.00%"],
          ].map(([label, detail], index) => (
            <div key={label} className="relative">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "grid size-3.5 place-items-center rounded-full",
                    index === 2 ? "bg-warning text-warning-foreground" : "bg-success text-success-foreground",
                  )}
                >
                  {index === 2 ? <Sparkles className="size-2" /> : <Check className="size-2" />}
                </span>
                <span className="text-[6.5px] font-semibold text-ink">{label}</span>
              </div>
              <div className="mt-0.5 pl-5 text-[5.5px] text-subtle-ink">{detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeroPreview({ tab }: { tab: PreviewTab }) {
  if (tab === "sessions") return <SessionsPreview />;
  if (tab === "quality") return <QualityPreview />;
  if (tab === "content") return <ContentPreview />;
  return <OverviewPreview />;
}
