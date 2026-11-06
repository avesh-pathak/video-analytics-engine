"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Copy, Sparkles } from "lucide-react";

import { GithubIcon } from "@/components/brand/social-icons";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

const snippet = `const res = await fetch("/api/analytics/heartbeat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Idempotency-Key": crypto.randomUUID(),
  },
  body: JSON.stringify({ identity, segments }),
});

// { accepted: 3, duplicate: 0, rejected: 0 }
// server computed — never client-supplied.`;

export function FinalCta() {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section id="cta" className="pt-[104px] sm:pt-[120px]">
      <div className="page-container">
        <div className="relative overflow-hidden rounded-panel border border-line bg-card px-5 py-9 shadow-card sm:px-9 sm:py-12 lg:px-14 lg:py-14">
          <div className="relative grid items-center gap-9 lg:grid-cols-[1fr_1.02fr] lg:gap-14">
            <div className="max-w-[520px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-green-deep backdrop-blur">
                <Sparkles className="size-3" />
                Make it defensible
              </span>
              <h2 className="mt-4 text-h2 font-medium text-ink">
                Your next report
                <br />
                can survive a question.
              </h2>
              <p className="mt-4 text-[16px] leading-7 text-muted-ink sm:text-[17px]">
                Read the architecture to see exactly how the engine earns the number.
                The code is open, and every invariant is test-covered.
              </p>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <Button asChild>
                  <Link href="/architecture">
                    Read the architecture
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={site.links.github} target="_blank" rel="noreferrer">
                    <GithubIcon className="size-4" />
                    View source
                  </Link>
                </Button>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10.5px] text-muted-ink">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3 text-green" />
                  No sign-up
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3 text-green" />
                  Deterministic demo data
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3 text-green" />
                  Powered by the real engine
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-[24px] border border-line bg-card shadow-card">
                <div className="flex h-10 items-center gap-2.5 border-b border-line bg-surface-soft px-4">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((dot) => (
                      <span key={dot} className="size-1.5 rounded-full bg-line" />
                    ))}
                  </div>
                  <span className="font-mono text-[9px] text-subtle-ink">quickstart.ts</span>
                  <button
                    type="button"
                    onClick={copy}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 text-[8.5px] font-medium text-muted-ink transition hover:border-green-bright/40 hover:bg-mint-soft hover:text-ink"
                  >
                    {copied ? <Check className="size-2.5 text-sky-ink" /> : <Copy className="size-2.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="overflow-x-auto bg-card p-4 font-mono text-[9.5px] leading-[1.95] text-body sm:p-5 sm:text-[10.5px]">
                  <code>
                    <span className="text-sky-ink">const</span> res ={" "}
                    <span className="text-sky-ink">await</span> fetch(
                    <span className="text-[#9A6800]">&quot;/api/analytics/heartbeat&quot;</span>, {"{"}
                    {"\n"}  method: <span className="text-[#9A6800]">&quot;POST&quot;</span>,
                    {"\n"}  headers: {"{"}
                    {"\n"}    <span className="text-[#9A6800]">&quot;Idempotency-Key&quot;</span>: crypto.randomUUID(),
                    {"\n"}  {"}"},
                    {"\n"}  body: JSON.stringify({"{"} identity, segments {"}"}),
                    {"\n"}{"}"});
                    {"\n\n"}
                    <span className="text-subtle-ink">{"// { accepted: 3, duplicate: 0, rejected: 0 }"}</span>
                    {"\n"}
                    <span className="text-subtle-ink">{"// server computed — never client-supplied."}</span>
                  </code>
                </pre>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface-soft px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[8px] text-muted-ink">
                    <span className="size-1.5 rounded-full bg-sky" />
                    watch_segments · 1 accepted
                  </span>
                  <Link
                    href={site.links.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[8.5px] font-semibold text-sky-ink hover:underline"
                  >
                    <GithubIcon className="size-3" />
                    View on GitHub
                    <ArrowUpRight className="size-2.5" />
                  </Link>
                </div>
              </div>
              <div className="absolute -bottom-3 right-4 hidden items-center gap-2 rounded-full border border-line bg-card/90 px-3 py-1.5 text-[9px] font-medium text-muted-ink shadow-soft backdrop-blur sm:inline-flex">
                <span className="size-1.5 rounded-full bg-sky" />
                Idempotent by default
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
