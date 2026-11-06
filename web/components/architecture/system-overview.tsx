import Link from "next/link";
import {
  ArrowDown,
  BarChart3,
  Database,
  Play,
  RefreshCcw,
  Server,
  ShieldCheck,
} from "lucide-react";

import { MermaidDiagram } from "@/components/architecture/mermaid-diagram";
import { site } from "@/lib/site";

// Adapted from README.md §3 and scripts/render-diagrams.mjs. The solid path
// reflects today's routes; the relay is shown separately, not as a booted worker.
const systemDiagram = `flowchart TB
  subgraph browser["Browser · evidence collection"]
    SM["Segment machine"] --> OB["Durable outbox · IndexedDB + mirror"]
  end
  OB -->|"POST heartbeat + Idempotency-Key"| API["Next.js route · parse, resolve, claim, sanitize"]
  subgraph store["SQLite · heartbeat write unit"]
    SEG["watch_segments · evidence"]
    SESSION["watch_sessions · context"]
    PROJ["subject_progress · merged coverage"]
    OUT["outbox · intent to publish"]
  end
  API --> SEG
  API --> SESSION
  API --> PROJ
  API --> OUT
  PROJ --> READ["GET read · list and progress"]
  SEG -->|"subject-detail canonical comparison"| READ
  SEG --> REPAIR["Admin · audit, dry run, repair, verify"]
  REPAIR -->|"recompute derived state"| PROJ
  OUT -.->|"when relay is started"| RELAY["Outbox relay"]
  RELAY -.-> BROKER["MemoryBroker or KafkaBroker"]`;

const layers = [
  {
    name: "Framework-free engine",
    path: "engine/",
    description: "TypeScript modules own segment state, validation policy, range arithmetic, projection updates and reconciliation. They do not import Next.js or a database driver.",
    files: "watch-math.ts · sanitize.ts · projection.ts · reconcile.ts",
  },
  {
    name: "Storage and delivery",
    path: "server/",
    description: "Node’s built-in SQLite driver stores evidence, sessions, request claims, projections and outbox rows. Repository functions own the SQL; broker adapters share one delivery interface.",
    files: "db.ts · schema.ts · repository.ts · broker.ts",
  },
  {
    name: "HTTP boundary",
    path: "app/api/analytics/",
    description: "Next.js route handlers validate requests with Zod, resolve server-owned session context and call the engine through the repository. Session, heartbeat, read and admin routes have separate responsibilities.",
    files: "session/route.ts · heartbeat/route.ts · read/route.ts · admin/route.ts",
  },
];

function MobileSystemFlow() {
  const steps = [
    {
      icon: Play,
      label: "Browser",
      detail: "Segment machine → durable outbox",
    },
    {
      icon: Server,
      label: "Heartbeat API",
      detail: "Parse · resolve · claim · sanitize",
    },
    {
      icon: Database,
      label: "SQLite write unit",
      detail: "Evidence · session · projection · outbox",
    },
    {
      icon: BarChart3,
      label: "Read",
      detail: "Projection + canonical comparison",
    },
    {
      icon: ShieldCheck,
      label: "Repair",
      detail: "Audit → dry run → bounded apply → verify",
    },
  ];

  return (
    <div aria-label="Simplified architecture flow for small screens" role="img">
      <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        <RefreshCcw className="size-3" />
        Engine flow
      </div>
      <div className="space-y-0">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.label}>
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-[10px] border border-border bg-card text-primary">
                  <Icon className="size-3.5" />
                </span>
                <div>
                  <div className="text-[11px] font-semibold text-foreground">{step.label}</div>
                  <div className="mt-0.5 text-[9px] leading-4 text-muted-foreground">{step.detail}</div>
                </div>
              </div>
              {index < steps.length - 1 ? (
                <div className="flex justify-center py-1">
                  <ArrowDown className="size-3 text-muted-foreground/60" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SystemOverview() {
  return (
    <section id="system" className="pt-[104px] sm:pt-[120px]">
      <div className="page-container">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <h2 className="text-h2 font-medium text-foreground">How the engine is built.</h2>
          <div className="text-base leading-7 text-muted-foreground">
            <p>
              One Next.js application wraps a framework-free TypeScript engine and a local
              SQLite store. The browser supplies intervals, the server decides what counts,
              and the database keeps both the evidence and the derived answer.
            </p>
            <p className="mt-3">
              Playback and access control stay outside the engine. No video is uploaded,
              and identity fields describe evidence—not permission to watch it.
            </p>
          </div>
        </div>

        <MermaidDiagram
          source={systemDiagram}
          label="Video analytics engine: browser evidence flows through the heartbeat route into SQLite; reads and repairs use separate paths."
          caption="Solid arrows show the implemented request and repair paths. Dashed arrows show the available relay path; the current routes do not bootstrap a relay or background projector."
          mobileFallback={<MobileSystemFlow />}
        />

        <div className="mt-10 divide-y divide-border">
          {layers.map((layer) => (
            <article key={layer.path} className="grid gap-3 py-6 first:pt-0 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div>
                <h3 className="text-lg font-medium text-foreground">{layer.name}</h3>
                <Link href={`${site.links.github}/tree/main/${layer.path}`} target="_blank" rel="noreferrer" className="mt-1 inline-block font-mono text-xs text-primary underline-offset-4 hover:underline">
                  {layer.path}
                </Link>
              </div>
              <div>
                <p className="text-sm leading-6 text-muted-foreground">{layer.description}</p>
                <p className="mt-2 break-words font-mono text-xs leading-6 text-muted-foreground">{layer.files}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-6 grid gap-6 border-t border-border pt-6 text-sm leading-6 text-muted-foreground md:grid-cols-3">
          <p><strong className="font-medium text-foreground">Write.</strong> Heartbeats insert accepted evidence, update the session and projection, then queue an outbox event before returning a per-segment verdict.</p>
          <p><strong className="font-medium text-foreground">Read.</strong> Student listings use the projection. A subject-detail read also recomputes raw evidence and returns canonical totals with drift deltas.</p>
          <p><strong className="font-medium text-foreground">Repair.</strong> Admin operations compare stored progress with a full recomputation. Repairs are opt-in, keyset-paged and resumable by cursor.</p>
        </div>
      </div>
    </section>
  );
}
