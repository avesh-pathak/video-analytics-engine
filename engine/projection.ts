/**
 * The projection.
 *
 * The system stores two kinds of data and they are not interchangeable:
 *
 *   EVIDENCE   `watch_segments` — an append-only log of every interval the
 *              client claimed, with the wall-clock time it claims to have
 *              spent. Immutable. Never updated. Never deleted.
 *
 *   PROJECTION `subject_progress` — one row per (student, subject) holding
 *              the current answer to "how much of this did they watch?".
 *              Mutable. Rebuildable.
 *
 * Keeping them apart is what makes the system trustworthy. The evidence is
 * the truth; the projection is a cache of an answer derived from it. A cache
 * can be wrong. The repair engine in `reconcile.ts` exists precisely
 * because the projection *will* drift, and because a system that cannot
 * detect and fix its own drift is not one you can trust with a number.
 *
 * The incremental update path and the full rebuild path must agree. That is
 * not a hope — it is asserted by the test suite, and the repair engine
 * compares the two on demand.
 *
 * THE TRAP THIS DESIGN AVOIDS
 *
 * The naive projection is "add the new segment's length to the stored total".
 * That is wrong the moment the learner rewatches anything, because the
 * stored `unique` figure has to be the size of the *union* of all ranges,
 * and a union cannot be updated by addition. The projection therefore keeps
 * the merged ranges themselves, not just their length, and derives the
 * length from them.
 *
 * The other trap is summing per-session unique totals instead of unioning
 * across sessions. A range watched on Monday and again on Tuesday is one
 * range, not two. `computeWatchMetrics` unions everything at once, and the
 * projection stores the merged set so that it can.
 */

import { computeWatchMetrics, mergeRanges, sumRanges, type RawWatchRange, type Range } from "./watch-math.js";

export interface SubjectProgress {
  studentId: string;
  subjectType: string;
  subjectId: string;
  videoDurationSeconds: number;
  uniqueContentSeconds: number;
  totalContentSeconds: number;
  engagedWallClockSeconds: number;
  repeatContentSeconds: number;
  lastPositionSeconds: number;
  maxPositionSeconds: number;
  completionPercentage: number;
  completed: boolean;
  sessionCount: number;
  playCount: number;
  pauseCount: number;
  seekCount: number;
  rateChangeCount: number;
  /** The merged coverage. This is what makes the projection correct. */
  watchedRanges: Range[];
  /**
   * False when the stored coverage is known to be incomplete — historical
   * data written before coverage was tracked exactly.
   *
   * When false, the projection must never shrink: the true coverage is at
   * least what is stored, so an update takes the maximum rather than the
   * new value.
   */
  coverageExact: boolean;
  firstStartedAt: number;
  lastWatchedAt: number;
}

/** A projection row with no evidence behind it yet. */
export function emptyProgress(input: {
  studentId: string;
  subjectType: string;
  subjectId: string;
  videoDurationSeconds: number;
  now?: number;
}): SubjectProgress {
  const now = input.now ?? Date.now();
  return {
    studentId: input.studentId,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    videoDurationSeconds: input.videoDurationSeconds,
    uniqueContentSeconds: 0,
    totalContentSeconds: 0,
    engagedWallClockSeconds: 0,
    repeatContentSeconds: 0,
    lastPositionSeconds: 0,
    maxPositionSeconds: 0,
    completionPercentage: 0,
    completed: false,
    sessionCount: 0,
    playCount: 0,
    pauseCount: 0,
    seekCount: 0,
    rateChangeCount: 0,
    watchedRanges: [],
    coverageExact: true,
    firstStartedAt: now,
    lastWatchedAt: now,
  };
}

/**
 * Fold a batch of newly-accepted segments into an existing projection.
 *
 * This is the *incremental* path — the hot path, called on every heartbeat.
 * It must be exactly equivalent to a full recompute from all evidence.
 *
 * The equivalence is not obvious and it is worth stating why it holds:
 *
 *   - `totalContentSeconds`  is a plain sum, so adding is correct.
 *   - `engagedWallClockSeconds` is a plain sum, so adding is correct.
 *   - `uniqueContentSeconds` is the length of a union. It is maintained by
 *     unioning the *stored ranges* with the *new ranges* and re-measuring,
 *     never by adding the new unique length to the old one.
 *   - `coverageExact = false` forces `max(stored, computed)` on the unique
 *     figure, because incomplete historical coverage can only be an
 *     under-count — it can never be an over-count.
 */
export function applySegmentsToProgress(
  progress: SubjectProgress,
  newSegments: RawWatchRange[],
  options: { completionThreshold?: number; now?: number } = {},
): SubjectProgress {
  const completionThreshold = options.completionThreshold ?? 0.66;
  const now = options.now ?? Date.now();

  if (!newSegments.length) return progress;

  const valid = newSegments.filter((s) => Number.isFinite(s.start) && Number.isFinite(s.end) && s.end > s.start);
  if (!valid.length) return progress;

  const merged = mergeRanges([...progress.watchedRanges, ...valid.map((s) => ({ start: s.start, end: s.end }))]);
  const uniqueRaw = sumRanges(merged);

  const duration = progress.videoDurationSeconds;
  const unique =
    duration > 0 ? Math.min(uniqueRaw, duration) : uniqueRaw;

  const batchMetrics = computeWatchMetrics(valid, duration);
  const total = progress.totalContentSeconds + batchMetrics.totalWatched;
  const wall = progress.engagedWallClockSeconds + batchMetrics.engagedWallClock;

  const maxPosition = Math.max(
    progress.maxPositionSeconds,
    ...valid.map((s) => s.end),
  );
  const lastPosition = valid[valid.length - 1].end;

  // An incomplete historical coverage can only under-count.
  const uniqueFinal = progress.coverageExact
    ? unique
    : Math.max(unique, progress.uniqueContentSeconds);

  const completionPercentage =
    duration > 0 ? Number(Math.min(100, (uniqueFinal / duration) * 100).toFixed(2)) : 0;

  return {
    ...progress,
    watchedRanges: merged,
    uniqueContentSeconds: Number(uniqueFinal.toFixed(2)),
    totalContentSeconds: Number(total.toFixed(2)),
    engagedWallClockSeconds: Number(wall.toFixed(2)),
    repeatContentSeconds: Number(Math.max(0, total - uniqueFinal).toFixed(2)),
    lastPositionSeconds: lastPosition,
    maxPositionSeconds: maxPosition,
    completionPercentage,
    completed: duration > 0 && uniqueFinal / duration >= completionThreshold,
    lastWatchedAt: now,
  };
}

/**
 * Recompute a projection from scratch.
 *
 * This is the *authoritative* path. It is what the repair engine runs, and
 * what a full rebuild from the event log runs. If the incremental path ever
 * disagrees with this, the incremental path is wrong — not this one.
 */
export function recomputeProgressFromEvidence(
  input: {
    studentId: string;
    subjectType: string;
    subjectId: string;
    videoDurationSeconds: number;
    ranges: RawWatchRange[];
    sessionCount?: number;
    counts?: { play: number; pause: number; seek: number; rateChange: number };
    completionThreshold?: number;
    now?: number;
  },
): SubjectProgress {
  const completionThreshold = input.completionThreshold ?? 0.66;
  const now = input.now ?? Date.now();

  const metrics = computeWatchMetrics(input.ranges, input.videoDurationSeconds);
  const merged = mergeRanges(
    input.ranges
      .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end) && r.end > r.start)
      .map((r) => ({ start: r.start, end: r.end })),
  );

  const duration = input.videoDurationSeconds;
  const completionPercentage =
    duration > 0 ? Number(Math.min(100, (metrics.uniqueWatched / duration) * 100).toFixed(2)) : 0;

  const base = emptyProgress({
    studentId: input.studentId,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    videoDurationSeconds: duration,
    now,
  });

  return {
    ...base,
    uniqueContentSeconds: metrics.uniqueWatched,
    totalContentSeconds: metrics.totalWatched,
    engagedWallClockSeconds: metrics.engagedWallClock,
    repeatContentSeconds: metrics.repeatWatched,
    watchedRanges: merged,
    lastPositionSeconds: input.ranges.length
      ? input.ranges[input.ranges.length - 1].end
      : 0,
    maxPositionSeconds: input.ranges.length
      ? Math.max(...input.ranges.map((r) => r.end))
      : 0,
    completionPercentage,
    completed: duration > 0 && metrics.uniqueWatched / duration >= completionThreshold,
    sessionCount: input.sessionCount ?? 0,
    playCount: input.counts?.play ?? 0,
    pauseCount: input.counts?.pause ?? 0,
    seekCount: input.counts?.seek ?? 0,
    rateChangeCount: input.counts?.rateChange ?? 0,
  };
}

/** The set of fields a drift comparison is allowed to look at. */
export interface DriftDelta {
  field: keyof SubjectProgress;
  projection: number | boolean;
  canonical: number | boolean;
  delta: number;
}

export interface DriftReport {
  studentId: string;
  subjectType: string;
  subjectId: string;
  drifted: boolean;
  deltas: DriftDelta[];
}

const COMPARED_FIELDS: Array<keyof SubjectProgress> = [
  "uniqueContentSeconds",
  "totalContentSeconds",
  "engagedWallClockSeconds",
  "repeatContentSeconds",
  "completionPercentage",
];

/**
 * Compare an incremental projection against a full recompute.
 *
 * The tolerance is two hundredths of a second. Floating-point rounding on
 * repeated addition can drift a fraction of a cent over thousands of
 * updates, and a tolerance of exactly zero would report drift that does not
 * exist. Two hundredths is far below anything a user would notice and far
 * above the rounding noise.
 */
export function compareProgress(
  projection: SubjectProgress,
  canonical: SubjectProgress,
  tolerance = 0.02,
): DriftReport {
  const deltas: DriftDelta[] = [];

  for (const field of COMPARED_FIELDS) {
    const a = Number(projection[field] ?? 0);
    const b = Number(canonical[field] ?? 0);
    const delta = Number((a - b).toFixed(2));
    if (Math.abs(delta) > tolerance) {
      deltas.push({ field, projection: a, canonical: b, delta });
    }
  }

  return {
    studentId: projection.studentId,
    subjectType: projection.subjectType,
    subjectId: projection.subjectId,
    drifted: deltas.length > 0,
    deltas,
  };
}
