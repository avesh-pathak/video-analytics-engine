#!/usr/bin/env node
/**
 * The diagram sources, and the renderer that turns them into PNGs.
 *
 * The four diagrams in this file are the source of truth for the README's
 * visuals. Each is rendered to `docs/diagrams/<name>.png` with headless
 * Chrome, and the README pastes the resulting image — never a rendered page.
 *
 * Usage: node scripts/render-diagrams.mjs
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const ROOT = path.resolve(process.cwd());
const OUT_DIR = path.join(ROOT, "docs", "diagrams");
const TMP_DIR = path.join(os.tmpdir(), "vae-diagrams");

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(process.env.LOCALAPPDATA ?? "", "Google", "Chrome", "Application", "chrome.exe"),
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const chrome = CHROME_CANDIDATES.find((p) => p && fs.existsSync(p));
if (!chrome) {
  console.error("No Chrome or Edge found. Cannot render diagrams.");
  process.exit(1);
}

const diagrams = [
  {
    name: "01-system-architecture",
    mermaid: `flowchart TD
  V["Local video file<br/>never uploaded"] --> SM["Segment machine<br/>10 player events"]
  SM --> OB["Durable outbox<br/>IndexedDB + mirror"]
  OB -->|"POST heartbeat + Idempotency-Key"| API["API<br/>parse, sanitize, BEGIN IMMEDIATE"]
  API -->|"evidence"| SEG["watch_segments<br/>append-only evidence"]
  API -->|"upsert"| PROJ["subject_progress<br/>materialized projection"]
  API -->|"same transaction"| OUT["outbox row<br/>transactional hand-off"]
  SEG -.->|"full recompute<br/>audit and repair"| PROJ
  OUT -->|"relay"| TOPIC["topic video.segments<br/>partitioned by subject scope"]
  TOPIC --> GROUP["consumer group<br/>va-projector"]
  GROUP -->|"upsert"| PROJ
  PROJ -->|"GET read"| UI["Analytics surface"]`,
  },
  {
    name: "02-idempotency-two-layers",
    mermaid: `sequenceDiagram
  participant C as Client
  participant A as API
  participant D as Store

  Note over C: 300 segments queued<br/>while offline for 1 hour
  C->>A: POST heartbeat (Idempotency-Key K1)
  A->>D: CLAIM K1
  D-->>A: claimed
  A->>D: BEGIN IMMEDIATE
  A->>D: INSERT segments ON CONFLICT DO NOTHING
  Note over D: unique index on<br/>(student, scope, client_segment_id)<br/>scope is session-independent
  D-->>A: accepted=280 duplicate=20
  A->>D: COMMIT
  A-->>C: acceptedSegmentIds, duplicateSegmentIds

  Note over C: session ended while offline.<br/>Replay arrives under a NEW session id.
  C->>A: POST heartbeat (Idempotency-Key K2, new session)
  A->>D: CLAIM K2
  D-->>A: claimed (K2 is new)
  A->>D: INSERT same 300 segments
  D-->>A: duplicate=280 accepted=0
  Note over D: segment identity collapses the replay<br/>even though the request key differs
  A-->>C: duplicateSegmentIds = all 280`,
  },
  {
    name: "03-evidence-projection-repair",
    mermaid: `flowchart TD
  SEG["watch_segments<br/>append-only evidence<br/>never updated, never deleted"]
  PROJ["subject_progress<br/>mutable projection<br/>rebuildable from the log"]

  SEG -->|"incremental<br/>on every heartbeat"| PROJ
  SEG -->|"full recompute<br/>repair and rebuild"| PROJ

  CMP{"Compare the<br/>two paths"}
  PROJ --> CMP
  RECOMPUTE["recompute from<br/>raw evidence"] --> CMP
  CMP -->|"delta = 0"| OK["Projection is correct"]
  CMP -->|"delta != 0"| DRIFT["Drift detected"]
  DRIFT --> AUDIT["Audit - read only,<br/>safe to run on a schedule"]
  AUDIT --> DRY["Dry run - show what<br/>would change"]
  DRY --> APPLY["Bounded apply<br/>keyset paged, per-subject savepoint"]
  APPLY --> VERIFY["Verify - re-audit,<br/>delta must now be 0"]
  VERIFY --> OK`,
  },
  {
    name: "04-client-segment-machine",
    mermaid: `stateDiagram-v2
  [*] --> IDLE
  IDLE --> PLAY_REQUESTED : play
  PLAY_REQUESTED --> PLAYING : playing
  PLAYING --> PAUSED : pause
  PLAYING --> SEEKING : seeking
  SEEKING --> PLAY_REQUESTED : seeked
  SEEKING --> PAUSED : seeked while paused
  PLAYING --> BUFFERING : waiting or stalled
  BUFFERING --> PLAY_REQUESTED : playing
  PLAYING --> SUSPENDED : tab hidden
  SUSPENDED --> PLAY_REQUESTED : tab visible
  PLAYING --> ENDED : ended
  PAUSED --> PLAY_REQUESTED : play
  ENDED --> [*]

  note right of PLAYING
    A segment is open.
    It closes on pause, seek,
    buffering, rate change,
    tab hide, end, rewind,
    or at 110 seconds of content.
  end note`,
  },
];

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TMP_DIR, { recursive: true });

/**
 * Render the diagram page and measure how tall it actually is.
 *
 * Mermaid lays out asynchronously, so the height is not known until the SVG
 * exists. The page reports it by writing it into a data attribute, and
 * --dump-dom gives us the post-layout DOM to read it back from. Guessing a
 * fixed height cuts diagrams off; measuring them does not.
 */
function buildHtml(diagram, measure) {
  return `<!doctype html>
<html><head><meta charset="utf-8">
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<style>
  body { margin: 0; padding: 28px; background: #ffffff; font-family: Inter, system-ui, sans-serif; }
  .mermaid { display: flex; justify-content: center; }
</style></head>
<body data-height="0"><pre class="mermaid">
${diagram.mermaid}
</pre>
<script>
  mermaid.initialize({
    startOnLoad: true, theme: "neutral", securityLevel: "loose",
    flowchart: { curve: "basis", htmlLabels: true },
    sequence: { curve: "basis", htmlLabels: true },
    state: { htmlLabels: true },
    themeVariables: {
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      primaryColor: "#f5f5f4", primaryTextColor: "#172033",
      primaryBorderColor: "#94a3b8", lineColor: "#64748b",
      secondaryColor: "#ecfdf5", tertiaryColor: "#fff7ed"
    }
  });
  ${measure ? `
  window.addEventListener("load", () => {
    setTimeout(() => {
      const svg = document.querySelector(".mermaid svg");
      const h = svg ? Math.ceil(svg.getBoundingClientRect().height) + 60 : 800;
      document.body.setAttribute("data-height", String(h));
    }, 1500);
  });` : ""}
</script></body></html>`;
}

for (const diagram of diagrams) {
  const htmlPath = path.join(TMP_DIR, `${diagram.name}.html`);
  const pngPath = path.join(OUT_DIR, `${diagram.name}.png`);

  // Pass 1 — measure.
  fs.writeFileSync(htmlPath, buildHtml(diagram, true), "utf8");
  let height = 900;
  try {
    const dom = execFileSync(
      chrome,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--window-size=1400,1200",
        "--virtual-time-budget=8000",
        "--dump-dom",
        `file:///${htmlPath.replace(/\\/g, "/")}`,
      ],
      { encoding: "utf8", timeout: 60_000, stdio: ["ignore", "pipe", "ignore"] },
    );
    const match = dom.match(/data-height="(\d+)"/);
    if (match) height = Number(match[1]);
  } catch (error) {
    console.error(`  measure failed for ${diagram.name}: ${error.message}`);
  }

  // Pass 2 — screenshot at the measured height.
  fs.writeFileSync(htmlPath, buildHtml(diagram, false), "utf8");
  try {
    execFileSync(
      chrome,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=2",
        `--window-size=1400,${height}`,
        "--virtual-time-budget=8000",
        `--screenshot=${pngPath}`,
        `file:///${htmlPath.replace(/\\/g, "/")}`,
      ],
      { stdio: "ignore", timeout: 60_000 },
    );
    const size = fs.existsSync(pngPath) ? fs.statSync(pngPath).size : 0;
    console.log(`ok   ${diagram.name}.png  ${height}px  ${(size / 1024).toFixed(1)} KB`);
  } catch (error) {
    console.error(`FAIL ${diagram.name}: ${error.message}`);
  }
}

console.log(`\nWrote diagrams to ${OUT_DIR}`);

