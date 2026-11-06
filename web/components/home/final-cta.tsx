"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

const snippet = `const res = await fetch("/api/analytics/heartbeat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Idempotency-Key": crypto.randomUUID(),
  },
  body: JSON.stringify({ identity, segments }),
});`;

export function FinalCta() {
  const [copied, setCopied] = React.useState(false);
  const [copyFailed, setCopyFailed] = React.useState(false);
  const resetTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopyFailed(false);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
  };

  return (
    <section id="cta" className="pt-24 sm:pt-32">
      <div className="page-container">
        <div className="rounded-panel bg-surface-soft px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-20">
            <div className="min-w-0">
              <h2 className="max-w-[540px] text-h2 font-medium text-ink">Follow the evidence.</h2>
              <p className="mt-4 max-w-[400px] text-base leading-7 text-muted-ink">Explore the architecture, then read the code behind it.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/architecture">Read the architecture <ArrowRight className="size-4" aria-hidden="true" /></Link>
                </Button>
                <Link href={site.links.github} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-green-deep underline-offset-4 hover:underline">View source</Link>
              </div>
            </div>
            <details className="group min-w-0 border-y border-line lg:mt-1">
              <summary className="cursor-pointer py-5 text-base font-medium text-ink">See a heartbeat request</summary>
              <div className="min-w-0 pb-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-ink">quickstart.ts</span>
                  <button type="button" onClick={copy} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-green-deep hover:bg-accent">
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copied ? "Copied" : "Copy code"}
                  </button>
                </div>
                <pre tabIndex={0} aria-label="Heartbeat request code; scroll horizontally to read" className="max-w-full overflow-x-auto overscroll-x-contain rounded-xl bg-card p-4 font-mono text-xs leading-6 text-body"><code>{snippet}</code></pre>
                <p role="status" className="mt-3 text-xs leading-5 text-muted-ink">{copyFailed ? "Copy unavailable. Select the code to copy it manually." : copied ? "Code copied to clipboard." : "Example request · not sent from this demo."}</p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}
