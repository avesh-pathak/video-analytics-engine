/**
 * Segment validation — the server's gate on every piece of evidence.
 *
 * Two classes of rejection, and the distinction is the whole point:
 *
 *   PERMANENT  The segment cannot ever be accepted. It is either impossible
 *              (bounds reversed, span longer than the universe) or outside the
 *              physical limits of playback (rate of 12x, or content claimed
 *              beyond the end of the video). Retrying it wastes work, so it is
 *              dropped and the client is told to forget it.
 *
 *   RETRYABLE  The segment is fine, the *batch* was too big. A 200-second
 *              segment is legitimate if the learner watched for 200 seconds;
 *              it is only illegal to send 200 seconds of content in a
 *              120-second budget. The client splits it and resends.
 *
 * Getting this backwards is expensive in both directions: rejecting a
 * legitimate segment loses real watch time, and accepting an impossible one
 * lets a client inflate its own metrics.
 */

import {
  MAX_REQUEST_WATCH_TIME_SECONDS,
  MAX_SEGMENTS_PER_HEARTBEAT,
  MAX_SEGMENT_DURATION_SECONDS,
  MAX_VIDEO_DURATION_SECONDS,
  MIN_PLAYBACK_RATE,
  MAX_PLAYBACK_RATE,
  WATCH_TIME_PLAUSIBILITY_TOLERANCE,
  MIN_PLAUSIBILITY_FLOOR_SECONDS,
  VIDEO_DURATION_BOUNDARY_TOLERANCE_SECONDS,
} from "./policy.js";
import {
  normalizeWatchSegment,
  type NormalizedWatchSegment,
  type WatchSegmentInput,
} from "./watch-math.js";

export type RejectionReason =
  | "max_segments_exceeded"
  | "invalid_bounds"
  | "max_segment_duration_exceeded"
  | "segment_beyond_duration"
  | "invalid_playback_rate"
  | "wall_clock_plausibility"
  | "request_watch_time_exceeded"
  | "max_segment_limit_exceeded";

export interface RejectedSegment {
  clientSegmentId: string | null;
  reason: RejectionReason;
  retryable: boolean;
  detail?: string;
}

export interface SanitizedBatch {
  accepted: NormalizedWatchSegment[];
  rejected: RejectedSegment[];
  totalContentSeconds: number;
  totalWallClockSeconds: number;
}

/**
 * Reason codes that mean "shrink the batch", not "throw the data away".
 *
 * The client uses this list to decide whether to split a segment and resend
 * or to delete it from the outbox permanently.
 */
const RETRYABLE_REASONS: ReadonlySet<RejectionReason> = new Set([
  "request_watch_time_exceeded",
  "max_segment_limit_exceeded",
]);

export function isRetryableRejection(reason: RejectionReason): boolean {
  return RETRYABLE_REASONS.has(reason);
}

/**
 * Validate and normalize a batch of segments.
 *
 * `raw` is the client's array. The result is what may be persisted, plus a
 * per-segment verdict so the client can reconcile its outbox precisely rather
 * than guessing which segments landed.
 */
export function sanitizeSegments(
  raw: WatchSegmentInput[],
  videoDurationSeconds: number,
): SanitizedBatch {
  const accepted: NormalizedWatchSegment[] = [];
  const rejected: RejectedSegment[] = [];

  if (!Array.isArray(raw)) {
    return { accepted, rejected, totalContentSeconds: 0, totalWallClockSeconds: 0 };
  }

  // When more arrive than the batch allows, keep the most recent ones. The
  // older ones are behind in the queue anyway and will arrive in a later
  // batch, so nothing is lost.
  let candidates = raw;
  if (raw.length > MAX_SEGMENTS_PER_HEARTBEAT) {
    candidates = raw.slice(-MAX_SEGMENTS_PER_HEARTBEAT);
    for (const seg of raw.slice(0, raw.length - MAX_SEGMENTS_PER_HEARTBEAT)) {
      rejected.push({
        clientSegmentId: seg?.clientSegmentId ?? null,
        reason: "max_segments_exceeded",
        retryable: false,
        detail: `batch exceeded ${MAX_SEGMENTS_PER_HEARTBEAT} segments`,
      });
    }
  }

  let totalContentSeconds = 0;
  let totalWallClockSeconds = 0;

  for (const rawSeg of candidates) {
    const seg = normalizeWatchSegment(rawSeg);
    const clientSegmentId = seg.clientSegmentId ?? null;
    const span = seg.endSecond - seg.startSecond;

    // 1. Structural validity.
    if (!Number.isFinite(seg.startSecond) || !Number.isFinite(seg.endSecond) || span <= 0) {
      rejected.push({
        clientSegmentId,
        reason: "invalid_bounds",
        retryable: false,
        detail: "endSecond must be greater than startSecond",
      });
      continue;
    }

    // 2. Absolute video bounds.
    if (
      seg.startSecond > MAX_VIDEO_DURATION_SECONDS ||
      seg.endSecond > MAX_VIDEO_DURATION_SECONDS
    ) {
      rejected.push({
        clientSegmentId,
        reason: "segment_beyond_duration",
        retryable: false,
        detail: `beyond the ${MAX_VIDEO_DURATION_SECONDS}s maximum video duration`,
      });
      continue;
    }

    // 3. Duration-relative bounds. The server's duration is authoritative;
    //    the client's is a hint and is never consulted.
    if (
      videoDurationSeconds > 0 &&
      seg.endSecond > videoDurationSeconds + VIDEO_DURATION_BOUNDARY_TOLERANCE_SECONDS
    ) {
      rejected.push({
        clientSegmentId,
        reason: "segment_beyond_duration",
        retryable: false,
        detail: `beyond authoritative duration ${videoDurationSeconds}s`,
      });
      continue;
    }

    // 4. A single segment may not span more than 4 hours.
    if (span > MAX_SEGMENT_DURATION_SECONDS) {
      rejected.push({
        clientSegmentId,
        reason: "max_segment_duration_exceeded",
        retryable: false,
        detail: `span ${span}s exceeds ${MAX_SEGMENT_DURATION_SECONDS}s`,
      });
      continue;
    }

    // 5. Playback rate must be physically possible.
    if (seg.playbackRate < MIN_PLAYBACK_RATE || seg.playbackRate > MAX_PLAYBACK_RATE) {
      rejected.push({
        clientSegmentId,
        reason: "invalid_playback_rate",
        retryable: false,
        detail: `rate ${seg.playbackRate} outside [${MIN_PLAYBACK_RATE}, ${MAX_PLAYBACK_RATE}]`,
      });
      continue;
    }

    // 6. Plausibility. Content cannot exceed wall-clock time by more than the
    //    tolerance, adjusted for playback rate. A segment claiming 60 seconds
    //    of content while only 10 seconds of real time passed is a lie.
    const allowed = Math.max(
      MIN_PLAUSIBILITY_FLOOR_SECONDS,
      seg.wallClockSeconds * seg.playbackRate * WATCH_TIME_PLAUSIBILITY_TOLERANCE,
    );
    if (span > allowed) {
      rejected.push({
        clientSegmentId,
        reason: "wall_clock_plausibility",
        retryable: false,
        detail: `content ${span}s exceeds ${allowed.toFixed(2)}s allowed by wall clock`,
      });
      continue;
    }

    // 7. Batch budget. A single segment over the request budget is retryable
    //    — the client splits it. The cumulative budget is also retryable.
    if (span > MAX_REQUEST_WATCH_TIME_SECONDS) {
      rejected.push({
        clientSegmentId,
        reason: "max_segment_limit_exceeded",
        retryable: true,
        detail: `segment ${span}s exceeds the ${MAX_REQUEST_WATCH_TIME_SECONDS}s request budget`,
      });
      continue;
    }
    if (totalContentSeconds + span > MAX_REQUEST_WATCH_TIME_SECONDS) {
      rejected.push({
        clientSegmentId,
        reason: "request_watch_time_exceeded",
        retryable: true,
        detail: `batch budget of ${MAX_REQUEST_WATCH_TIME_SECONDS}s exhausted`,
      });
      continue;
    }

    totalContentSeconds += span;
    totalWallClockSeconds += seg.wallClockSeconds;
    accepted.push(seg);
  }

  return {
    accepted,
    rejected,
    totalContentSeconds: Number(totalContentSeconds.toFixed(2)),
    totalWallClockSeconds: Number(totalWallClockSeconds.toFixed(2)),
  };
}

/**
 * Split a segment that is too large for one request into deterministic
 * children.
 *
 * Deterministic is the important word. The children get ids derived from the
 * parent's id, so a client that retries a split produces byte-identical ids
 * and the dedup index collapses the duplicates. A random id here would turn
 * every retry into fresh evidence and inflate the totals.
 */
export function splitOversizedSegment(
  segment: WatchSegmentInput,
  maxSpan: number = MAX_REQUEST_WATCH_TIME_SECONDS,
): NormalizedWatchSegment[] {
  const seg = normalizeWatchSegment(segment);
  const span = seg.endSecond - seg.startSecond;
  if (span <= maxSpan) return [seg];

  const childCount = Math.ceil(span / maxSpan);
  const children: NormalizedWatchSegment[] = [];

  for (let i = 0; i < childCount; i++) {
    const start = Number((seg.startSecond + i * maxSpan).toFixed(2));
    const end = Number(Math.min(seg.endSecond, start + maxSpan).toFixed(2));
    const childSpan = end - start;
    if (childSpan <= 0) continue;

    children.push({
      ...seg,
      startSecond: start,
      endSecond: end,
      wallClockSeconds: Number(((seg.wallClockSeconds * childSpan) / span).toFixed(2)),
      clientSegmentId: `${seg.clientSegmentId ?? "seg"}_s${i}`,
      clientSequence: (seg.clientSequence ?? 0) * 1000 + i,
    });
  }

  return children;
}
