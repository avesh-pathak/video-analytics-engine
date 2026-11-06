"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ApiTab = {
  id: string;
  label: string;
  method: "POST" | "GET";
  endpoint: string;
  description: string;
  request: string;
  response: string;
};

const tabs: ApiTab[] = [
  {
    id: "heartbeat",
    label: "Heartbeat",
    method: "POST",
    endpoint: "/api/analytics/heartbeat",
    description:
      "The hot path. Segments are evidence; the server returns a per-segment verdict and its own summary.",
    request: `const res = await fetch("/api/analytics/heartbeat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Idempotency-Key": crypto.randomUUID(),
  },
  body: JSON.stringify({
    sessionId,
    currentTimeSeconds: 134.56,
    eventType: "heartbeat",
    segments: [{
      startSecond: 12.34,
      endSecond: 78.90,
      playbackRate: 1.0,
      clientSegmentId: "0f9c...",
      wallClockSeconds: 66.56,
      segmentStartedAt: "2026-10-22T09:12:03.114Z",
      segmentEndedAt: "2026-10-22T09:13:09.674Z",
    }],
    counts: { play: 1, pause: 0, seek: 0, ratechange: 0 },
  }),
});`,
    response: `{
  "ok": true,
  "segmentsReceived": 3,
  "acceptedSegmentIds": ["a", "b"],
  "duplicateSegmentIds": ["c"],
  "rejectedSegments": [],
  "summary": {
    "videoDurationSeconds": 600,
    "totalWatchedSeconds": 300,
    "uniqueWatchedSeconds": 280,
    "repeatWatchedSeconds": 20,
    "completionPercentage": 46.67
  }
}`,
  },
  {
    id: "read",
    label: "Read",
    method: "GET",
    endpoint: "/api/analytics/read",
    description:
      "The analytics surface. Reads come from the projection — with the canonical recompute and drift beside them.",
    request: `const params = new URLSearchParams({
  studentId: "student-1",
  subjectId: "clip-42",
});

const res = await fetch(
  \`/api/analytics/read?\${params}\`
);

// projection  → fast read
// canonical   → recomputed from evidence
// drift       → the difference between them`,
    response: `{
  "ok": true,
  "projection": {
    "uniqueWatchedSeconds": 1872,
    "totalWatchedSeconds": 2292,
    "completionPercentage": 73.77
  },
  "canonical": {
    "uniqueWatchedSeconds": 1872,
    "totalWatchedSeconds": 2292
  },
  "drift": {
    "uniqueSeconds": 0,
    "totalSeconds": 0,
    "agreement": 1
  }
}`,
  },
  {
    id: "repair",
    label: "Repair",
    method: "POST",
    endpoint: "/api/analytics/admin?op=repair",
    description:
      "The only path allowed to rewrite derived state. Dry-run first, then apply bounded pages, then verify.",
    request: `// 1. inspect the delta — no writes
await fetch("/api/analytics/admin?op=repair", {
  method: "POST",
  body: JSON.stringify({ dryRun: true }),
});

// 2. apply bounded, resumable pages
await fetch("/api/analytics/admin?op=repair", {
  method: "POST",
  body: JSON.stringify({
    dryRun: false,
    apply: true,
    cursor: null,
  }),
});`,
    response: `{
  "ok": true,
  "scanned": 12482,
  "repaired": 3,
  "nextCursor": null,
  "resumable": true,
  "verified": {
    "deltaSeconds": 0,
    "agreement": 0.9998
  }
}`,
  },
];

function highlight(code: string) {
  return code.split("\n").map((line, lineIndex) => {
    if (line.trim().startsWith("//")) {
      return (
        <span key={lineIndex} className="text-white/28">
          {line}
          {"\n"}
        </span>
      );
    }
    const tokens = line.split(
      /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:const|let|await|async|return|true|false|null|new)\b|\b\d+(?:\.\d+)?\b)/g,
    );
    return (
      <span key={lineIndex}>
        {tokens.map((token, tokenIndex) => {
          let className = "text-[#DDE7E0]/65";
          if (token.startsWith('"') || token.startsWith("'")) className = "text-[#F5D7A1]";
          else if (/^(const|let|await|async|return|true|false|null|new)$/.test(token))
            className = "text-[#7BE0A6]";
          else if (/^\d+(?:\.\d+)?$/.test(token)) className = "text-[#A9D8F5]";
          return (
            <span key={tokenIndex} className={className}>
              {token}
            </span>
          );
        })}
        {"\n"}
      </span>
    );
  });
}

function CodePane({
  title,
  code,
  className,
}: {
  title: string;
  code: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-white/30">{title}</span>
        <span className="font-mono text-[8px] text-white/20">JSON</span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[9.5px] leading-[1.9] sm:text-[10px]">
        <code>{highlight(code)}</code>
      </pre>
    </div>
  );
}

export function ApiTabs() {
  const [active, setActive] = React.useState("heartbeat");
  const [copied, setCopied] = React.useState(false);
  const tab = tabs.find((item) => item.id === active) ?? tabs[0];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${tab.method} ${tab.endpoint}\n\n${tab.request}\n\n${tab.response}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
      <div className="flex flex-col justify-between gap-3 border-b border-line-soft p-4 sm:flex-row sm:items-center sm:px-5">
        <Tabs value={active} onValueChange={setActive}>
          <TabsList className="h-auto bg-surface-muted">
            {tabs.map((item) => (
              <TabsTrigger key={item.id} value={item.id} className="gap-1.5 text-[10.5px]">
                <span
                  className={cn(
                    "rounded-full px-1 py-0.5 font-mono text-[7px] font-semibold",
                    item.method === "POST" ? "bg-mint text-green-deep" : "bg-sky-soft/70 text-sky-ink",
                  )}
                >
                  {item.method}
                </span>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 self-start rounded-full border border-line bg-card px-2.5 py-1.5 text-[9px] font-medium text-muted-ink transition hover:bg-mint-soft sm:self-auto"
        >
          {copied ? <Check className="size-3 text-green" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy snippet"}
        </button>
      </div>

      <div className="border-b border-line-soft bg-surface-soft px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-card px-2 py-1 font-mono text-[9px] text-body shadow-[0_0_0_1px_rgba(229,229,229,1)]">
            {tab.method} {tab.endpoint}
          </span>
          <span className="text-[9.5px] text-muted-ink">{tab.description}</span>
        </div>
      </div>

      <div className="grid bg-code text-code-foreground lg:grid-cols-2">
        <CodePane title="Request" code={tab.request} className="border-b border-white/10 lg:border-b-0 lg:border-r" />
        <CodePane title="Response" code={tab.response} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft px-4 py-3 text-[9px] text-subtle-ink sm:px-5">
        <span>At-least-once delivery. Two independent idempotency guards.</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-green" />
          Per-segment verdicts, not a single ok
        </span>
      </div>
    </div>
  );
}
