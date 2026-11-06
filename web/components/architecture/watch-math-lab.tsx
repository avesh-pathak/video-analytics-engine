"use client";

import * as React from "react";
import { Check, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

const duration = 40;

const rangeOptions = [
  { id: "a", label: "Range A", from: 0, to: 10, color: "var(--chart-1)" },
  { id: "b", label: "Range B", from: 8, to: 20, color: "var(--chart-2)" },
  { id: "c", label: "Range C", from: 12, to: 25, color: "var(--chart-3)" },
  { id: "d", label: "Range D", from: 30, to: 36, color: "var(--chart-4)" },
];

function mergeRanges(ranges: { from: number; to: number }[]) {
  const sorted = [...ranges].sort((a, b) => a.from - b.from);
  const merged: { from: number; to: number }[] = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (last && range.from <= last.to) {
      last.to = Math.max(last.to, range.to);
    } else {
      merged.push({ ...range });
    }
  }
  return merged;
}

export function WatchMathLab() {
  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(rangeOptions.map((range) => range.id)),
  );

  const chosen = rangeOptions.filter((range) => selected.has(range.id));
  const total = chosen.reduce((sum, range) => sum + (range.to - range.from), 0);
  const union = mergeRanges(chosen);
  const unique = union.reduce((sum, range) => sum + (range.to - range.from), 0);
  const repeat = total - unique;
  const completion = (unique / duration) * 100;
  const allSelected = selected.size === rangeOptions.length;

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-card text-card-foreground">
      <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
        <div className="min-w-0">
          <h3 className="text-lg font-medium tracking-[-0.02em] text-ink">
            See how watch time adds up
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-ink">
            Toggle ranges from a 40-second watch.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSelected(new Set(rangeOptions.map((range) => range.id)))}
          disabled={allSelected}
          aria-label="Reset all ranges"
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-ink transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted-ink"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>

      <div className="px-5 pb-4">
        <div className="space-y-0.5">
          {rangeOptions.map((range) => {
            const active = selected.has(range.id);
            const seconds = range.to - range.from;

            return (
              <button
                key={range.id}
                type="button"
                onClick={() => toggle(range.id)}
                aria-pressed={active}
                className="-mx-2 grid min-h-12 w-[calc(100%+1rem)] grid-cols-[128px_minmax(0,1fr)] items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[160px_minmax(0,1fr)]"
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "grid size-4 shrink-0 place-items-center rounded-full border transition-colors",
                      active ? "border-transparent" : "border-line bg-card",
                    )}
                    style={active ? { backgroundColor: range.color } : undefined}
                  >
                    {active ? <Check className="size-2.5 text-white" strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block text-sm font-medium transition-colors",
                        active ? "text-ink" : "text-muted-ink",
                      )}
                    >
                      {range.label}
                    </span>
                    <span className="mt-0.5 block text-xs tabular-nums text-subtle-ink">
                      {range.from}–{range.to}s
                    </span>
                  </span>
                </span>

                <span className="relative block h-6" aria-hidden="true">
                  <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line/70" />
                  <span
                    className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full transition-opacity duration-200"
                    style={{
                      left: `${(range.from / duration) * 100}%`,
                      width: `${(seconds / duration) * 100}%`,
                      backgroundColor: range.color,
                      opacity: active ? 1 : 0.16,
                    }}
                  />
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 border-t border-line/70 pt-4">
          <div className="grid grid-cols-[128px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
            <div>
              <span className="block text-sm font-medium text-green-deep">
                Unique watched
              </span>
              <span className="mt-1 block text-2xl font-medium leading-none tracking-[-0.02em] text-green-deep tabular-nums">
                {unique}s
              </span>
              <span className="mt-0.5 block text-xs text-muted-ink">
                {chosen.length === 0
                  ? "No ranges selected"
                  : `${union.length} watched ${union.length === 1 ? "range" : "ranges"}`}
              </span>
            </div>

            <div className="relative h-2.5 overflow-hidden rounded-full bg-muted/70">
              {union.map((range) => (
                <span
                  key={`${range.from}-${range.to}`}
                  className="absolute inset-y-0 rounded-[2px] bg-green transition-[left,width] duration-300 ease-soft"
                  style={{
                    left: `${(range.from / duration) * 100}%`,
                    width: `${((range.to - range.from) / duration) * 100}%`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-[128px_minmax(0,1fr)] gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
            <div />
            <div className="flex justify-between text-xs tabular-nums text-subtle-ink">
              {[0, 10, 20, 30, 40].map((tick) => (
                <span key={tick}>{tick}s</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <dl
        className="mx-5 grid grid-cols-2 gap-x-5 gap-y-5 border-t border-line/70 py-4 sm:grid-cols-4"
        aria-live="polite"
        aria-atomic="true"
      >
        {[
          { label: "Total watched", value: `${total}s`, accent: false },
          { label: "Unique watched", value: `${unique}s`, accent: true },
          { label: "Rewatch", value: `${repeat}s`, accent: false },
          { label: "Completion", value: `${completion.toFixed(1)}%`, accent: false },
        ].map((metric) => (
          <div key={metric.label} className="min-w-0">
            <dt
              className={cn(
                "text-xs font-medium",
                metric.accent ? "text-green-deep" : "text-subtle-ink",
              )}
            >
              {metric.label}
            </dt>
            <dd
              className={cn(
                "mt-1.5 text-2xl font-medium leading-none tracking-[-0.02em] tabular-nums",
                metric.accent ? "text-green-deep" : "text-ink",
              )}
            >
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="border-t border-line/70 px-5 py-3 text-sm leading-6 text-muted-ink">
        Overlapping seconds count once. Pauses are excluded.
      </div>
    </div>
  );
}
