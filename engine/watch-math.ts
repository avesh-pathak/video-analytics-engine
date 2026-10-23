/**
 * Server-authoritative watch math.
 *
 * This is the heart of the system and the reason the client is never trusted.
 *
 * The client sends *evidence*: a set of intervals it claims to have played,
 * plus the wall-clock time it claims to have spent. It does **not** send a
 * "watched seconds" number. This module turns that evidence into the numbers
 * every downstream surface reports, and it is the only place those numbers are
 * produced.
 *
 * Four quantities, four different meanings:
 *
 *   totalWatched      Σ (end - start) over all segments. A rewatch counts twice.
 *   uniqueWatched     |union of all intervals|, clipped to the video length.
 *                      A rewatch counts once.
 *   repeatWatched     totalWatched - uniqueWatched.
 *   engagedWallClock  Σ wall-clock evidence. Paused, hidden and buffering
 *                      stretches never become segments, so they are never
 *                      counted here. This is the number that reflects how long
 *                      the learner was actually present.
 *
 * The union is what makes the system interesting. Summing per-session unique
 * totals — a very natural implementation — double-counts any range watched in
 * two sessions, which is exactly what happens when a learner resumes a video
 * across days. The projection layer exists to avoid that mistake; see
 * `projection.ts`.
 */

// ─── Types ──────────────────────────────────────────────────────────────

export interface Range {
  start: number;
  end: number;
}

export interface RawWatchRange {
  start: number;
  end: number;
  /** Real time spent on this segment, as measured by the client clock. */
  wallClockSeconds?: number | null;
}

export interface WatchMetrics {
  /** Union of watched ranges across all sessions. Replays never double-count. */
  uniqueWatched: number;
  /** Sum of every segment length, including repeats. */
  totalWatched: number;
  /** totalWatched - uniqueWatched */
  repeatWatched: number;
  /** Real time while playback actively progressed. */
  engagedWallClock: number;
}

export interface WatchSegmentInput {
  startSecond: number;
  endSecond: number;
  playbackRate?: number;
  source?: string;
  clientSegmentId?: string;
  playerInstanceId?: string;
  clientSequence?: number;
  wallClockSeconds?: number;
  segmentStartedAt?: string;
  segmentEndedAt?: string;
}

export interface NormalizedWatchSegment {
  startSecond: number;
  endSecond: number;
  playbackRate: number;
  source: string;
  clientSegmentId: string | null;
  playerInstanceId: string | null;
  clientSequence: number | null;
  wallClockSeconds: number;
  segmentStartedAt: string | null;
  segmentEndedAt: string | null;
}

export interface VideoProgressSummary {
  videoDurationSeconds: number;
  totalWatchedSeconds: number;
  uniqueWatchedSeconds: number;
  repeatWatchedSeconds: number;
  completionPercentage: number;
  completed: boolean;
}

// ─── Interval arithmetic ────────────────────────────────────────────────

/**
 * Merge overlapping or adjacent intervals into a set of disjoint intervals.
 *
 * Sorting by start and folding forward is O(n log n) and produces the minimal
 * disjoint cover, which is what "how much of the video did they actually
 * watch" has to mean.
 */
export function mergeRanges(ranges: Range[]): Range[] {
  if (!ranges || ranges.length === 0) return [];

  const valid = ranges
    .reduce((acc, r) => {
      if (r && typeof r.start === "number" && typeof r.end === "number" && r.start <= r.end) {
        acc.push({ start: r.start, end: r.end });
      }
      return acc;
    }, [] as Range[])
    .sort((a, b) => a.start - b.start);

  if (valid.length === 0) return [];

  const merged: Range[] = [valid[0]];
  for (let i = 1; i < valid.length; i++) {
    const last = merged[merged.length - 1];
    const curr = valid[i];
    if (curr.start <= last.end) {
      last.end = Math.max(last.end, curr.end);
    } else {
      merged.push(curr);
    }
  }
  return merged;
}

/** Total length of a set of disjoint intervals. */
export function sumRanges(ranges: Range[]): number {
  if (!ranges || ranges.length === 0) return 0;
  const total = ranges.reduce((acc, r) => acc + Math.max(0, r.end - r.start), 0);
  return Number(total.toFixed(2));
}

// ─── The core computation ───────────────────────────────────────────────

/**
 * Compute the four watch metrics from raw segment evidence.
 *
 * `videoDurationSeconds` is the *authoritative* duration, resolved server-side
 * from the media registry — never from the client. When it is unknown the raw
 * union is preserved rather than zeroed, because "we do not know how long the
 * video is" and "they watched nothing" are different facts and collapsing
 * them loses data.
 */
export function computeWatchMetrics(
  ranges: RawWatchRange[],
  videoDurationSeconds: number,
): WatchMetrics {
  let total = 0;
  let wallClock = 0;
  const validRanges: Range[] = [];

  for (const row of ranges ?? []) {
    const start = Number(row?.start ?? 0);
    const end = Number(row?.end ?? 0);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
    validRanges.push({ start, end });
    total += end - start;
    wallClock += Math.max(0, Number(row.wallClockSeconds ?? 0));
  }

  const uniqueRaw = sumRanges(mergeRanges(validRanges));
  const duration = Number(videoDurationSeconds);
  const unique =
    Number.isFinite(duration) && duration > 0 ? Math.min(uniqueRaw, duration) : uniqueRaw;

  return {
    uniqueWatched: Number(Math.max(0, unique).toFixed(2)),
    totalWatched: Number(Math.max(0, total).toFixed(2)),
    repeatWatched: Number(Math.max(0, total - unique).toFixed(2)),
    engagedWallClock: Number(Math.max(0, wallClock).toFixed(2)),
  };
}

// ─── Segment normalization and validation ───────────────────────────────

/**
 * Coerce a raw segment into a well-formed one. Reversed bounds are swapped
 * rather than rejected: a reversed interval is a client bug, not an attack,
 * and dropping the evidence loses real watch time.
 */
export function normalizeWatchSegment(segment: WatchSegmentInput): NormalizedWatchSegment {
  let s = Math.max(0, Number(segment.startSecond) || 0);
  let e = Math.max(0, Number(segment.endSecond) || 0);

  if (s > e) {
    const temp = s;
    s = e;
    e = temp;
  }

  return {
    startSecond: Number(s.toFixed(2)),
    endSecond: Number(e.toFixed(2)),
    playbackRate: Number(segment.playbackRate) || 1.0,
    source: segment.source || "play",
    clientSegmentId: segment.clientSegmentId ?? null,
    playerInstanceId: segment.playerInstanceId ?? null,
    clientSequence: segment.clientSequence ?? null,
    wallClockSeconds: segment.wallClockSeconds ?? (e - s),
    segmentStartedAt: segment.segmentStartedAt ?? null,
    segmentEndedAt: segment.segmentEndedAt ?? null,
  };
}

/**
 * Physical validity of a segment, independent of any request budget.
 *
 * A segment is impossible if it runs backwards, past the end of the video, or
 * spans more wall-clock time than the universe allows.
 */
export function validateWatchSegment(
  segment: NormalizedWatchSegment,
  videoDurationSeconds: number,
): boolean {
  if (isNaN(segment.startSecond) || isNaN(segment.endSecond)) return false;
  if (segment.endSecond <= segment.startSecond) return false;

  if (videoDurationSeconds > 0 && segment.endSecond > videoDurationSeconds + 1.0) {
    return false;
  }

  // 12 hours is the widest plausible single continuous chunk.
  if (segment.endSecond - segment.startSecond > 43200) return false;

  return true;
}

// ─── Summary helpers ────────────────────────────────────────────────────

export function calculateTotalWatchedSeconds(segments: NormalizedWatchSegment[]): number {
  if (!segments || segments.length === 0) return 0;
  const total = segments.reduce((acc, s) => acc + Math.max(0, s.endSecond - s.startSecond), 0);
  return Number(total.toFixed(2));
}

export function calculateUniqueWatchedSeconds(segments: NormalizedWatchSegment[]): number {
  if (!segments || segments.length === 0) return 0;
  const merged = mergeRanges(segments.map((s) => ({ start: s.startSecond, end: s.endSecond })));
  return sumRanges(merged);
}

export function calculateRepeatWatchedSeconds(segments: NormalizedWatchSegment[]): number {
  return Number(
    Math.max(0, calculateTotalWatchedSeconds(segments) - calculateUniqueWatchedSeconds(segments)).toFixed(2),
  );
}

export function calculateCompletionPercentage(
  uniqueWatchedSeconds: number,
  durationSeconds: number,
): number {
  if (durationSeconds <= 0 || uniqueWatchedSeconds <= 0) return 0;
  const pct = (uniqueWatchedSeconds / durationSeconds) * 100;
  return Number(Math.min(100, Math.max(0, pct)).toFixed(2));
}

/**
 * Full progress summary for one subject.
 *
 * Note the threshold: completion is a *ratio of unique content*, so rewinding
 * a section ten times does not move it. A learner who watches the last 10% of
 * a video on repeat is not 100% complete, and this function will not let them
 * claim otherwise.
 */
export function calculateProgressSummary(
  segments: WatchSegmentInput[],
  videoDurationSeconds: number,
  completionThreshold = 0.66,
): VideoProgressSummary {
  const duration = Math.max(0, videoDurationSeconds);

  const validSegments = (segments || []).reduce((acc, s) => {
    const normalized = normalizeWatchSegment(s);
    if (validateWatchSegment(normalized, duration)) acc.push(normalized);
    return acc;
  }, [] as NormalizedWatchSegment[]);

  const totalWatchedSeconds = calculateTotalWatchedSeconds(validSegments);
  const uniqueWatchedSeconds = calculateUniqueWatchedSeconds(validSegments);
  const completionPercentage = calculateCompletionPercentage(uniqueWatchedSeconds, duration);

  return {
    videoDurationSeconds: Number(duration.toFixed(2)),
    totalWatchedSeconds,
    uniqueWatchedSeconds,
    repeatWatchedSeconds: Number(Math.max(0, totalWatchedSeconds - uniqueWatchedSeconds).toFixed(2)),
    completionPercentage,
    completed: duration > 0 && uniqueWatchedSeconds / duration >= completionThreshold,
  };
}

/**
 * Render the merged coverage as a sparse bitmap — one byte per second of
 * video, `1` where watched.
 *
 * The projection stores ranges, but the UI wants a picture. This is the
 * cheapest faithful way to draw one: the coverage strip on the scrubber is
 * literally this array.
 */
export function renderCoverageBitmap(
  ranges: RawWatchRange[],
  videoDurationSeconds: number,
): Uint8Array {
  const duration = Math.max(0, Math.floor(videoDurationSeconds));
  if (duration === 0) return new Uint8Array(0);

  const bitmap = new Uint8Array(duration);
  for (const row of ranges ?? []) {
    const start = Math.max(0, Math.floor(Number(row?.start ?? 0)));
    const end = Math.min(duration, Math.ceil(Number(row?.end ?? 0)));
    for (let i = start; i < end; i++) bitmap[i] = 1;
  }
  return bitmap;
}
