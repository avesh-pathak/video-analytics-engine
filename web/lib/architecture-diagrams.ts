// The README's nodes and connections, laid out horizontally for the web reader.
// Original sources: scripts/render-diagrams.mjs.
export const systemDiagram = `flowchart LR
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
  PROJ -->|"GET read"| UI["Analytics surface"]`;

export const idempotencyDiagram = `sequenceDiagram
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
  A-->>C: duplicateSegmentIds = all 280`;

export const repairDiagram = `flowchart LR
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
  VERIFY --> OK`;

export const clientDiagram = `stateDiagram-v2
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
  end note`;
