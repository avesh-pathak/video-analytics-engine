import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";

const steps = [
  { title: "Playback events", copy: "Client ranges + durable outbox" },
  { title: "Server validation", copy: "Check bounds + remove duplicates" },
  { title: "Evidence + totals", copy: "Saved together in one transaction" },
  { title: "Read & repair", copy: "Query totals, audit, rebuild" },
];

export function ArchitectureOverview() {
  return (
    <section id="product" className="pt-24 sm:pt-32">
      <div id="architecture" className="page-container">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-20">
          <h2 className="max-w-[520px] text-h2 font-medium text-ink">A watch-time engine<br className="hidden sm:block" /> Not just a counter</h2>
          <div className="max-w-[560px] space-y-4 text-base leading-7 text-muted-ink">
            <p>Watchline turns playback events into reliable watch-time metrics. It tracks which parts of a video were watched, how much was rewatched, and how long someone spent watching.</p>
            <p>The client collects evidence. The server computes the numbers, handles retries, and keeps a log so every total can be audited or rebuilt.</p>
            <p className="text-sm">It works alongside your video player. This site demonstrates the UI; the repository contains the engine and APIs.</p>
          </div>
        </div>
        <h3 className="mt-10 text-base font-medium text-ink">How the pieces connect</h3>
        <ol aria-label="Watchline architecture flow" className="mt-5 grid grid-cols-1 gap-6 rounded-2xl bg-surface-soft p-6 md:grid-cols-4 md:gap-10 md:p-8">
          {steps.map((step, index) => (
            <li key={step.title} className="relative min-w-0">
              <h4 className="text-base font-medium text-ink">{step.title}</h4>
              <p className="mt-2 max-w-[240px] text-sm leading-6 text-muted-ink">{step.copy}</p>
              {index < steps.length - 1 ? <>
                <ArrowRight className="absolute -right-7 top-1 hidden size-4 text-green md:block" aria-hidden="true" />
                <ArrowDown className="mt-5 size-4 text-green md:hidden" aria-hidden="true" />
              </> : null}
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-[760px] text-sm leading-6 text-muted-ink">An optional broker handles event delivery after the write. It never decides whether watch time counts.</p>
        <Link href="/architecture" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-green-deep underline-offset-4 hover:underline">
          See how it works <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div>
            <h3 className="text-2xl font-medium tracking-tight text-ink">Built for imperfect playback.</h3>
            <dl className="mt-6 space-y-6">
              <div>
                <dt className="text-base font-medium text-ink">Go offline. Resume later.</dt>
                <dd className="mt-1 max-w-[520px] text-sm leading-6 text-muted-ink">A durable client outbox queues playback evidence for delivery. Request and segment keys keep retries from adding extra credit.</dd>
              </div>
              <div>
                <dt className="text-base font-medium text-ink">Rewatch without inflating completion.</dt>
                <dd className="mt-1 max-w-[520px] text-sm leading-6 text-muted-ink">The server merges overlapping ranges. A repeat counts toward total watched, not as new content watched.</dd>
              </div>
              <div>
                <dt className="text-base font-medium text-ink">Check a number. Rebuild if needed.</dt>
                <dd className="mt-1 max-w-[520px] text-sm leading-6 text-muted-ink">The append-only log keeps the evidence behind every total. Audit for drift, preview a repair, then apply and verify it.</dd>
              </div>
            </dl>
          </div>
          <figure className="self-start rounded-2xl border border-line bg-card p-6 sm:p-8">
            <figcaption className="text-base font-medium text-ink">A rewatch, made visible.</figcaption>
            <p className="mt-2 text-sm leading-6 text-muted-ink">Watch 0–20s, then 10–30s of a 60-second video.</p>
            <div className="mt-7 space-y-5" aria-hidden="true">
              {[
                { label: "First watch", start: 0, width: 100 / 3, color: "bg-green" },
                { label: "Watch again", start: 100 / 6, width: 100 / 3, color: "bg-teal" },
                { label: "Unique watched", start: 0, width: 50, color: "bg-green-deep" },
              ].map((row) => (
                <div key={row.label}>
                  <span className="text-xs text-muted-ink">{row.label}</span>
                  <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-surface-soft">
                    <span className={`absolute inset-y-0 rounded-full ${row.color}`} style={{ left: `${row.start}%`, width: `${row.width}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <dl className="mt-7 grid grid-cols-3 gap-3 border-t border-line pt-5">
              {[["Total", "40s"], ["Unique", "30s"], ["Rewatch", "10s"]].map(([label, value]) => (
                <div key={label}><dt className="text-xs text-muted-ink">{label}</dt><dd className="mt-1 text-2xl font-medium tabular-nums text-ink">{value}</dd></div>
              ))}
            </dl>
            <p className="mt-5 text-xs leading-5 text-muted-ink">Illustrative example · 50% completion, not 67%.</p>
          </figure>
        </div>
      </div>
    </section>
  );
}
