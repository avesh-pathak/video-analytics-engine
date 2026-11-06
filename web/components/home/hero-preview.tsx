"use client";

import { Check, ShieldCheck } from "lucide-react";

import { contentRows, sessions } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export type PreviewTab = "overview" | "sessions" | "quality" | "content";

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
  };
}

function MiniArea({ values, id }: { values: number[]; id: string }) {
  const width = 520;
  const height = 120;
  const { area, line } = smoothPath(values, width, height, 6);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.33, 0.66].map((p) => (
        <line
          key={p}
          x1="0"
          x2={width}
          y1={height * p}
          y2={height * p}
          stroke="var(--border)"
          strokeWidth="1"
          strokeDasharray="3 7"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <path d={area} fill={`url(#${id}-fill)`} />
      <path
        d={line}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function PreviewHeader({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="shrink-0">
      <h2 className="text-[16px] font-semibold leading-5 tracking-[-0.02em] text-ink">{title}</h2>
      <p className="mt-0.5 text-[12px] leading-4 text-muted-ink">{detail}</p>
    </div>
  );
}

function toneClass(tone: (typeof contentRows)[number]["tone"]) {
  if (tone === "mint") return "bg-chart-1";
  if (tone === "sky") return "bg-chart-3";
  if (tone === "lilac") return "bg-chart-4";
  if (tone === "sand") return "bg-chart-5";
  return "bg-ink";
}

function statusDot(status: (typeof sessions)[number]["status"]) {
  if (status === "Repaired") return "bg-amber";
  if (status === "Deduped") return "bg-teal";
  return "bg-green";
}

const chart = [18, 23, 21, 27, 25, 31, 28, 34, 32, 38, 36, 41, 39, 45, 43, 49, 47, 54, 51, 58];

function OverviewPreview() {
  return (
    <div className="flex h-full flex-col bg-surface-soft p-3 sm:p-4">
      <PreviewHeader title="Overview" detail="Last 30 days" />

      <section className="mt-3 flex min-h-0 flex-1 flex-col rounded-xl border border-line bg-card p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] leading-4 text-muted-ink">Unique watch time</p>
            <p className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.04em] text-ink sm:text-[34px]">
              12,482
              <span className="ml-0.5 text-[16px] font-medium text-muted-ink">h</span>
            </p>
          </div>
          <p className="shrink-0 text-[12px] font-semibold tabular text-green-deep">+18.4%</p>
        </div>

        <div className="mt-2 min-h-0 flex-1">
          <MiniArea values={chart} id="overview-watch" />
        </div>

        <div className="mt-2 flex justify-between text-[12px] tabular text-subtle-ink">
          <span>Oct 7</span>
          <span>Oct 21</span>
          <span>Nov 5</span>
        </div>
      </section>

      <section className="mt-3 shrink-0">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[12px] font-semibold leading-4 text-ink">Top content</h3>
          <span className="text-[12px] leading-4 text-subtle-ink">Unique hours</span>
        </div>
        <ul className="mt-1">
          {contentRows.slice(0, 3).map((row) => (
            <li
              key={row.id}
              className="flex items-center gap-2.5 border-b border-line-soft py-2.5 last:border-0"
            >
              <span className={cn("size-6 shrink-0 rounded-md", toneClass(row.tone))} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-body">{row.title}</span>
              <span className="shrink-0 text-[13px] tabular text-muted-ink">
                {row.uniqueHours.toLocaleString()}h
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SessionsPreview() {
  return (
    <div className="flex h-full flex-col bg-surface-soft p-3 sm:p-4">
      <PreviewHeader title="Sessions" detail="Today · 2,941 sessions" />

      <section className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-line bg-card">
        <div className="flex shrink-0 items-center justify-between border-b border-line px-3 py-2.5 text-[12px] leading-4 text-subtle-ink sm:px-4">
          <span>Viewer</span>
          <span>Watched</span>
        </div>
        <ul className="flex min-h-0 flex-1 flex-col divide-y divide-border">
          {sessions.slice(0, 5).map((session) => (
            <li
              key={session.id}
              className="flex min-h-0 flex-1 items-center justify-between gap-3 px-3 sm:px-4"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-muted text-[12px] font-semibold text-muted-ink">
                  {session.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold leading-4 text-ink">{session.viewer}</p>
                  <p className="mt-0.5 truncate text-[12px] leading-4 text-muted-ink">{session.content}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[13px] font-medium leading-4 tabular text-body">{session.watched}</p>
                <p className="mt-0.5 flex items-center justify-end gap-1.5 text-[12px] leading-4 text-muted-ink">
                  <span className={cn("size-1.5 rounded-full", statusDot(session.status))} aria-hidden="true" />
                  {session.status}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ContentPreview() {
  return (
    <div className="flex h-full flex-col bg-surface-soft p-3 sm:p-4">
      <PreviewHeader title="Content" detail="128 titles · last 30 days" />

      <section className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-line bg-card">
        <ul className="flex min-h-0 flex-1 flex-col divide-y divide-border">
          {contentRows.slice(0, 5).map((row) => (
            <li
              key={row.id}
              className="flex min-h-0 flex-1 items-center justify-between gap-3 px-3 sm:px-4"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn("hidden size-6 shrink-0 rounded-md sm:block", toneClass(row.tone))}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold leading-4 text-ink">{row.title}</p>
                  <p className="mt-0.5 truncate text-[12px] leading-4 text-muted-ink">
                    {row.type} · {row.completion}% complete
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-[13px] font-medium tabular text-body">
                {row.uniqueHours.toLocaleString()}h
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const checks: [string, string][] = [
  ["Unique index", "0 conflicts"],
  ["Duplicate attempts", "1,284 blocked"],
  ["Orphaned projections", "0 found"],
  ["Outbox backlog", "0 rows"],
];

function QualityPreview() {
  return (
    <div className="flex h-full flex-col bg-surface-soft p-3 sm:p-4">
      <PreviewHeader title="Quality" detail="Last audit today, 10:38 · passed" />

      <section className="mt-3 shrink-0 rounded-xl border border-line bg-card p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[12px] leading-4 text-muted-ink">Projection agreement</p>
          <ShieldCheck className="size-4 shrink-0 text-green" aria-hidden="true" />
        </div>
        <p className="mt-1 text-[32px] font-semibold leading-none tracking-[-0.04em] text-ink">99.98%</p>
        <p className="mt-1 text-[12px] leading-4 text-muted-ink">0.02% drift</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full w-[99.98%] rounded-full bg-green" />
        </div>
      </section>

      <ul className="mt-3 flex min-h-0 flex-1 flex-col divide-y divide-border">
        {checks.map(([label, value]) => (
          <li key={label} className="flex min-h-0 flex-1 items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-[13px] text-body">
              <Check className="size-4 shrink-0 text-green" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </span>
            <span className="shrink-0 text-[13px] font-medium text-ink">{value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HeroPreview({ tab }: { tab: PreviewTab }) {
  if (tab === "sessions") return <SessionsPreview />;
  if (tab === "quality") return <QualityPreview />;
  if (tab === "content") return <ContentPreview />;
  return <OverviewPreview />;
}
