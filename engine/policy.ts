/**
 * Playback policy and validation bounds.
 *
 * This module is the single source of truth for every numeric limit the system
 * enforces. It is intentionally pure — no framework, no I/O — so the browser
 * tracker, the API layer, and the SQL-facing validator all import the *same*
 * numbers. A limit that exists in two places eventually exists in two places
 * with two different values, and the disagreement shows up as a metric that is
 * occasionally off by one heartbeat.
 *
 * The distinction that matters:
 *   - "batch limits"   bound a single request  (how much may arrive at once)
 *   - "plausibility"   bounds a single segment  (is this claim physically possible)
 *
 * A segment that exceeds a plausibility bound is a lie. A request that exceeds a
 * batch limit is merely large, and the client is allowed to drain it in pieces.
 */

// ─── Playback-rate bounds ───────────────────────────────────────────────
export const MIN_PLAYBACK_RATE = 0.5;
export const MAX_PLAYBACK_RATE = 4.0;

// ─── Batch / plausibility limits ────────────────────────────────────────
export const MAX_SEGMENTS_PER_HEARTBEAT = 50;
export const MAX_REQUEST_WATCH_TIME_SECONDS = 120;
export const MAX_SEGMENT_DURATION_SECONDS = 4 * 60 * 60;
export const WATCH_TIME_PLAUSIBILITY_TOLERANCE = 1.35;
export const MIN_PLAUSIBILITY_FLOOR_SECONDS = 2;
export const VIDEO_DURATION_BOUNDARY_TOLERANCE_SECONDS = 1;

// ─── Transport / scheduler / outbox constraints ─────────────────────────
export const MAX_DRAIN_CHUNKS_PER_CYCLE = 5;
export const CONTENT_BUDGET_SAFETY_MARGIN_SECONDS = 10;
/** Active segment content cap: the batch budget minus a safety margin. */
export const ACTIVE_SEGMENT_MAX_CONTENT_SECONDS =
  MAX_REQUEST_WATCH_TIME_SECONDS - CONTENT_BUDGET_SAFETY_MARGIN_SECONDS; // 110s

// ─── Session lifecycle ──────────────────────────────────────────────────
export const MAX_SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000;
export const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000;

// ─── Heartbeat cadence ──────────────────────────────────────────────────
/** Local durable checkpoint — bounds crash loss. Never touches the network. */
export const LOCAL_CHECKPOINT_INTERVAL_MS = 5_000;
/** Network heartbeat — batched upload to the API. */
export const NETWORK_HEARTBEAT_INTERVAL_MS = 30_000;
/** Minimum gap between event-driven heartbeats, to absorb event storms. */
export const HEARTBEAT_EVENT_MIN_MS = 3_000;
/** Server-controlled cadence range the client is allowed to accept. */
export const MIN_NETWORK_HEARTBEAT_INTERVAL_MS = 10_000;
export const MAX_NETWORK_HEARTBEAT_INTERVAL_MS = 120_000;

// ─── Completion semantics ───────────────────────────────────────────────
export const COMPLETION_THRESHOLD = 0.66;
export const COMPLETION_PERCENTAGE_THRESHOLD = 66;

// ─── Video / idempotency caps ───────────────────────────────────────────
export const MAX_VIDEO_DURATION_SECONDS = 24 * 60 * 60;
export const IDEMPOTENCY_TTL_MS = 60_000;

/**
 * The canonical policy object shipped to the storage layer with every write.
 *
 * The server attaches this; the browser must never supply or override it.
 * TypeScript decides what the limits are; the validator below checks that the
 * object was not tampered with before it is applied.
 */
export interface HeartbeatRpcPolicy {
  maxSessionLifetimeSeconds: number;
  inactivityTimeoutSeconds: number;
  maxSegmentsPerHeartbeat: number;
  maxRequestWatchTimeSeconds: number;
  maxSegmentDurationSeconds: number;
  minPlaybackRate: number;
  maxPlaybackRate: number;
  watchTimePlausibilityTolerance: number;
  completionThreshold: number;
  minimumPlausibilityFloorSeconds: number;
  videoDurationBoundaryToleranceSeconds: number;
}

export function buildHeartbeatRpcPolicy(): HeartbeatRpcPolicy {
  return {
    maxSessionLifetimeSeconds: MAX_SESSION_LIFETIME_MS / 1000,
    inactivityTimeoutSeconds: INACTIVITY_TIMEOUT_MS / 1000,
    maxSegmentsPerHeartbeat: MAX_SEGMENTS_PER_HEARTBEAT,
    maxRequestWatchTimeSeconds: MAX_REQUEST_WATCH_TIME_SECONDS,
    maxSegmentDurationSeconds: MAX_SEGMENT_DURATION_SECONDS,
    minPlaybackRate: MIN_PLAYBACK_RATE,
    maxPlaybackRate: MAX_PLAYBACK_RATE,
    watchTimePlausibilityTolerance: WATCH_TIME_PLAUSIBILITY_TOLERANCE,
    completionThreshold: COMPLETION_THRESHOLD,
    minimumPlausibilityFloorSeconds: MIN_PLAUSIBILITY_FLOOR_SECONDS,
    videoDurationBoundaryToleranceSeconds: VIDEO_DURATION_BOUNDARY_TOLERANCE_SECONDS,
  };
}

export function isValidPlaybackRate(rate: unknown): rate is number {
  return (
    typeof rate === "number" &&
    Number.isFinite(rate) &&
    rate >= MIN_PLAYBACK_RATE &&
    rate <= MAX_PLAYBACK_RATE
  );
}

export function sanitizePlaybackRate(rate: unknown, fallback = 1.0): number {
  return isValidPlaybackRate(rate) ? rate : fallback;
}
