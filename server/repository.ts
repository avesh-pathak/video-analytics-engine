/**
 * Repository — every storage operation the system performs.
 *
 * This layer owns two things the rest of the codebase must not get wrong:
 *
 *   1. THE DEDUP INSERT. Segments go in with `ON CONFLICT ... DO NOTHING`
 *      against the partial unique index. The caller is told which ids were
 *      accepted and which were duplicates, and only the accepted ones
 *      contribute to the projection. A duplicate contributes exactly zero.
 *      This is the single most important statement in the system.
 *
 *   2. THE ATOMIC UNIT. A heartbeat writes evidence, updates the session,
 *      updates the projection and enqueues a broker event. All four happen
 *      in one transaction. If any of them fails, none of them happened —
 *      which is what lets the client retry the whole heartbeat safely.
 */

import type { SqliteDatabase } from "./db.js";
import { transaction } from "./db.js";
import type { SQLInputValue } from "node:sqlite";
import { applySegmentsToProgress, emptyProgress, type SubjectProgress } from "../engine/projection.js";
import { computeWatchMetrics, type RawWatchRange } from "../engine/watch-math.js";
import { COMPLETION_THRESHOLD } from "../engine/policy.js";
import type { EvidenceRow, RepairSubject } from "../engine/reconcile.js";

export interface SegmentInput {
  sessionId: string;
  studentId: string;
  subjectType: string;
  subjectId: string;
  scope: string;
  assetId: string;
  startSecond: number;
  endSecond: number;
  playbackRate: number;
  wallClockSeconds: number;
  source: string;
  clientSegmentId: string | null;
  playerInstanceId: string | null;
  clientSequence: number | null;
  segmentStartedAt: string | null;
  segmentEndedAt: string | null;
}

export interface SegmentInsertResult {
  acceptedSegmentIds: string[];
  duplicateSegmentIds: string[];
  inserted: number;
}

export interface WatchSessionRow {
  id: string;
  studentId: string;
  subjectType: string;
  subjectId: string;
  scope: string;
  assetId: string;
  videoDurationSeconds: number;
  startedAt: number;
  endedAt: number | null;
  lastPositionSeconds: number;
  totalVideoSecondsWatched: number;
  uniqueWatchedSeconds: number;
  completionPercentage: number;
  completed: boolean;
  playCount: number;
  pauseCount: number;
  seekCount: number;
  rateChangeCount: number;
}

function rowToSession(row: Record<string, unknown>): WatchSessionRow {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    subjectType: String(row.subject_type),
    subjectId: String(row.subject_id),
    scope: String(row.scope),
    assetId: String(row.asset_id),
    videoDurationSeconds: Number(row.video_duration_seconds ?? 0),
    startedAt: Number(row.started_at),
    endedAt: row.ended_at == null ? null : Number(row.ended_at),
    lastPositionSeconds: Number(row.last_position_seconds ?? 0),
    totalVideoSecondsWatched: Number(row.total_video_seconds_watched ?? 0),
    uniqueWatchedSeconds: Number(row.unique_watched_seconds ?? 0),
    completionPercentage: Number(row.completion_percentage ?? 0),
    completed: Number(row.completed ?? 0) === 1,
    playCount: Number(row.play_count ?? 0),
    pauseCount: Number(row.pause_count ?? 0),
    seekCount: Number(row.seek_count ?? 0),
    rateChangeCount: Number(row.rate_change_count ?? 0),
  };
}

function rowToProgress(row: Record<string, unknown>): SubjectProgress {
  let ranges: Array<{ start: number; end: number }> = [];
  try {
    ranges = JSON.parse(String(row.watched_ranges ?? "[]"));
  } catch {
    ranges = [];
  }
  return {
    studentId: String(row.student_id),
    subjectType: String(row.subject_type),
    subjectId: String(row.subject_id),
    videoDurationSeconds: Number(row.video_duration_seconds ?? 0),
    uniqueContentSeconds: Number(row.unique_content_seconds ?? 0),
    totalContentSeconds: Number(row.total_content_seconds ?? 0),
    engagedWallClockSeconds: Number(row.engaged_wall_clock_seconds ?? 0),
    repeatContentSeconds: Number(row.repeat_content_seconds ?? 0),
    lastPositionSeconds: Number(row.last_position_seconds ?? 0),
    maxPositionSeconds: Number(row.max_position_seconds ?? 0),
    completionPercentage: Number(row.completion_percentage ?? 0),
    completed: Number(row.completed ?? 0) === 1,
    sessionCount: Number(row.session_count ?? 0),
    playCount: Number(row.play_count ?? 0),
    pauseCount: Number(row.pause_count ?? 0),
    seekCount: Number(row.seek_count ?? 0),
    rateChangeCount: Number(row.rate_change_count ?? 0),
    watchedRanges: ranges,
    coverageExact: Number(row.coverage_exact ?? 1) === 1,
    firstStartedAt: Number(row.first_started_at ?? 0),
    lastWatchedAt: Number(row.last_watched_at ?? 0),
  };
}

function progressToRow(progress: SubjectProgress): Record<string, SQLInputValue> {
  return {
    student_id: progress.studentId,
    subject_type: progress.subjectType,
    subject_id: progress.subjectId,
    video_duration_seconds: progress.videoDurationSeconds,
    unique_content_seconds: progress.uniqueContentSeconds,
    total_content_seconds: progress.totalContentSeconds,
    engaged_wall_clock_seconds: progress.engagedWallClockSeconds,
    repeat_content_seconds: progress.repeatContentSeconds,
    last_position_seconds: progress.lastPositionSeconds,
    max_position_seconds: progress.maxPositionSeconds,
    completion_percentage: progress.completionPercentage,
    completed: progress.completed ? 1 : 0,
    session_count: progress.sessionCount,
    play_count: progress.playCount,
    pause_count: progress.pauseCount,
    seek_count: progress.seekCount,
    rate_change_count: progress.rateChangeCount,
    watched_ranges: JSON.stringify(progress.watchedRanges),
    coverage_exact: progress.coverageExact ? 1 : 0,
    first_started_at: progress.firstStartedAt,
    last_watched_at: progress.lastWatchedAt,
  };
}

// ── Segments ────────────────────────────────────────────────────────────

/**
 * Insert evidence, deduplicated.
 *
 * The `ON CONFLICT` clause names the partial index explicitly, including its
 * predicate. SQLite requires the conflict target to match a unique index
 * exactly; omitting the predicate makes the statement fail to prepare, and
 * silently falling back to per-row inserts would destroy the guarantee this
 * whole system rests on.
 */
export function insertSegments(
  db: SqliteDatabase,
  segments: SegmentInput[],
): SegmentInsertResult {
  const acceptedSegmentIds: string[] = [];
  const duplicateSegmentIds: string[] = [];
  let inserted = 0;

  const statement = db.prepare(`
    INSERT INTO watch_segments (
      session_id, student_id, subject_type, subject_id, scope, asset_id,
      start_second, end_second, playback_rate, wall_clock_seconds, source,
      client_segment_id, player_instance_id, client_sequence,
      segment_started_at, segment_ended_at, dedupe_excluded, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    ON CONFLICT (student_id, scope, client_segment_id)
      WHERE client_segment_id IS NOT NULL AND dedupe_excluded = 0
    DO NOTHING
  `);

  const now = Date.now();
  for (const segment of segments) {
    const result = statement.run(
      segment.sessionId,
      segment.studentId,
      segment.subjectType,
      segment.subjectId,
      segment.scope,
      segment.assetId,
      segment.startSecond,
      segment.endSecond,
      segment.playbackRate,
      segment.wallClockSeconds,
      segment.source,
      segment.clientSegmentId,
      segment.playerInstanceId,
      segment.clientSequence,
      segment.segmentStartedAt,
      segment.segmentEndedAt,
      now,
    );

    if (Number(result.changes) > 0) {
      inserted += 1;
      if (segment.clientSegmentId) acceptedSegmentIds.push(segment.clientSegmentId);
    } else {
      // A duplicate. It is preserved in the table for audit and excluded from
      // every calculation. It contributes exactly nothing to the totals.
      if (segment.clientSegmentId) duplicateSegmentIds.push(segment.clientSegmentId);
    }
  }

  return { acceptedSegmentIds, duplicateSegmentIds, inserted };
}

// ── Projection ──────────────────────────────────────────────────────────

export function readProgress(
  db: SqliteDatabase,
  studentId: string,
  subjectType: string,
  subjectId: string,
): SubjectProgress | null {
  const row = db
    .prepare(
      `SELECT * FROM subject_progress
       WHERE student_id = ? AND subject_type = ? AND subject_id = ?`,
    )
    .get(studentId, subjectType, subjectId);
  return row ? rowToProgress(row as Record<string, unknown>) : null;
}

export function writeProgress(db: SqliteDatabase, progress: SubjectProgress): void {
  const values = progressToRow(progress);
  db.prepare(
    `INSERT INTO subject_progress (
       student_id, subject_type, subject_id, video_duration_seconds,
       unique_content_seconds, total_content_seconds, engaged_wall_clock_seconds,
       repeat_content_seconds, last_position_seconds, max_position_seconds,
       completion_percentage, completed, session_count, play_count, pause_count,
       seek_count, rate_change_count, watched_ranges, coverage_exact,
       first_started_at, last_watched_at
     ) VALUES (
       @student_id, @subject_type, @subject_id, @video_duration_seconds,
       @unique_content_seconds, @total_content_seconds, @engaged_wall_clock_seconds,
       @repeat_content_seconds, @last_position_seconds, @max_position_seconds,
       @completion_percentage, @completed, @session_count, @play_count, @pause_count,
       @seek_count, @rate_change_count, @watched_ranges, @coverage_exact,
       @first_started_at, @last_watched_at
     )
     ON CONFLICT (student_id, subject_type, subject_id) DO UPDATE SET
       video_duration_seconds = @video_duration_seconds,
       unique_content_seconds = @unique_content_seconds,
       total_content_seconds = @total_content_seconds,
       engaged_wall_clock_seconds = @engaged_wall_clock_seconds,
       repeat_content_seconds = @repeat_content_seconds,
       last_position_seconds = @last_position_seconds,
       max_position_seconds = @max_position_seconds,
       completion_percentage = @completion_percentage,
       completed = @completed,
       session_count = @session_count,
       play_count = @play_count,
       pause_count = @pause_count,
       seek_count = @seek_count,
       rate_change_count = @rate_change_count,
       watched_ranges = @watched_ranges,
       coverage_exact = @coverage_exact,
       last_watched_at = @last_watched_at`,
  ).run(values);
}

/**
 * Fold newly accepted segments into the projection.
 *
 * Only the segments that were actually inserted contribute. A duplicate
 * changes nothing.
 */
export function applyAcceptedSegments(
  db: SqliteDatabase,
  input: {
    studentId: string;
    subjectType: string;
    subjectId: string;
    videoDurationSeconds: number;
    segments: SegmentInput[];
    now?: number;
  },
): SubjectProgress {
  const existing =
    readProgress(db, input.studentId, input.subjectType, input.subjectId) ??
    emptyProgress({
      studentId: input.studentId,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      videoDurationSeconds: input.videoDurationSeconds,
      now: input.now,
    });

  const ranges: RawWatchRange[] = input.segments.map((s) => ({
    start: s.startSecond,
    end: s.endSecond,
    wallClockSeconds: s.wallClockSeconds,
  }));

  const updated = applySegmentsToProgress(existing, ranges, {
    completionThreshold: COMPLETION_THRESHOLD,
    now: input.now,
  });

  writeProgress(db, updated);
  return updated;
}

// ── Evidence reads (for the repair engine) ──────────────────────────────

export function readEvidence(
  db: SqliteDatabase,
  studentId: string,
  subjectType: string,
  subjectId: string,
): EvidenceRow[] {
  const rows = db
    .prepare(
      `SELECT start_second, end_second, wall_clock_seconds
       FROM watch_segments
       WHERE student_id = ? AND subject_type = ? AND subject_id = ?
         AND end_second > start_second
         AND dedupe_excluded = 0
       ORDER BY start_second ASC, end_second ASC`,
    )
    .all(studentId, subjectType, subjectId) as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    startSecond: Number(r.start_second),
    endSecond: Number(r.end_second),
    wallClockSeconds: Number(r.wall_clock_seconds ?? 0),
  }));
}

/** Keyset pagination over subjects. Stable and resumable. */
export function listSubjects(
  db: SqliteDatabase,
  after: RepairSubject | null,
  limit: number,
): RepairSubject[] {
  const sql = `
    SELECT student_id, subject_type, subject_id, video_duration_seconds
    FROM subject_progress
    ${
      after
        ? "WHERE (student_id, subject_type, subject_id) > (?, ?, ?)"
        : ""
    }
    ORDER BY student_id, subject_type, subject_id
    LIMIT ?
  `;

  const rows = after
    ? (db.prepare(sql).all(after.studentId, after.subjectType, after.subjectId, limit) as Array<
        Record<string, unknown>
      >)
    : (db.prepare(sql).all(limit) as Array<Record<string, unknown>>);

  return rows.map((r) => ({
    studentId: String(r.student_id),
    subjectType: String(r.subject_type),
    subjectId: String(r.subject_id),
    videoDurationSeconds: Number(r.video_duration_seconds ?? 0),
  }));
}

// ── Sessions ────────────────────────────────────────────────────────────

export function readSession(db: SqliteDatabase, id: string): WatchSessionRow | null {
  const row = db.prepare(`SELECT * FROM watch_sessions WHERE id = ?`).get(id);
  return row ? rowToSession(row as Record<string, unknown>) : null;
}

/**
 * Get the open session for a subject, or open a new one.
 *
 * The partial unique index `uq_session_one_open` guarantees at most one open
 * session per (student, scope). The insert therefore races safely: two
 * concurrent starts produce one winner and one conflict, and the loser
 * re-reads the winner's session. Application-level "check then insert"
 * cannot make that guarantee, because two requests can both pass the check.
 */
export function getOrOpenSession(
  db: SqliteDatabase,
  input: {
    sessionId: string;
    studentId: string;
    subjectType: string;
    subjectId: string;
    scope: string;
    assetId: string;
    videoDurationSeconds: number;
    now?: number;
  },
): { session: WatchSessionRow; alreadyOpen: boolean } {
  const now = input.now ?? Date.now();

  const existing = db
    .prepare(
      `SELECT * FROM watch_sessions
       WHERE student_id = ? AND scope = ? AND ended_at IS NULL`,
    )
    .get(input.studentId, input.scope) as Record<string, unknown> | undefined;

  if (existing) {
    return { session: rowToSession(existing), alreadyOpen: true };
  }

  try {
    db.prepare(
      `INSERT INTO watch_sessions (
         id, student_id, subject_type, subject_id, scope, asset_id,
         video_duration_seconds, started_at, ended_at, last_position_seconds,
         total_video_seconds_watched, unique_watched_seconds, completion_percentage,
         completed, play_count, pause_count, seek_count, rate_change_count,
         created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?)`,
    ).run(
      input.sessionId,
      input.studentId,
      input.subjectType,
      input.subjectId,
      input.scope,
      input.assetId,
      input.videoDurationSeconds,
      now,
      now,
      now,
    );
  } catch (error) {
    // Unique violation: another request opened the session concurrently.
    const winner = db
      .prepare(
        `SELECT * FROM watch_sessions
         WHERE student_id = ? AND scope = ? AND ended_at IS NULL`,
      )
      .get(input.studentId, input.scope) as Record<string, unknown> | undefined;
    if (winner) return { session: rowToSession(winner), alreadyOpen: true };
    throw error;
  }

  return {
    session: rowToSession(
      db.prepare(`SELECT * FROM watch_sessions WHERE id = ?`).get(input.sessionId) as Record<
        string,
        unknown
      >,
    ),
    alreadyOpen: false,
  };
}

export function updateSession(
  db: SqliteDatabase,
  input: {
    sessionId: string;
    lastPositionSeconds?: number;
    totalVideoSecondsWatched?: number;
    uniqueWatchedSeconds?: number;
    completionPercentage?: number;
    completed?: boolean;
    counts?: { play: number; pause: number; seek: number; rateChange: number };
    endedAt?: number | null;
    now?: number;
  },
): void {
  const now = input.now ?? Date.now();
  const current = readSession(db, input.sessionId);
  if (!current) return;

  db.prepare(
    `UPDATE watch_sessions SET
       last_position_seconds = ?,
       total_video_seconds_watched = ?,
       unique_watched_seconds = ?,
       completion_percentage = ?,
       completed = ?,
       play_count = ?, pause_count = ?, seek_count = ?, rate_change_count = ?,
       ended_at = COALESCE(?, ended_at),
       updated_at = ?
     WHERE id = ?`,
  ).run(
    input.lastPositionSeconds ?? current.lastPositionSeconds,
    input.totalVideoSecondsWatched ?? current.totalVideoSecondsWatched,
    input.uniqueWatchedSeconds ?? current.uniqueWatchedSeconds,
    input.completionPercentage ?? current.completionPercentage,
    (input.completed ?? current.completed) ? 1 : 0,
    input.counts?.play ?? current.playCount,
    input.counts?.pause ?? current.pauseCount,
    input.counts?.seek ?? current.seekCount,
    input.counts?.rateChange ?? current.rateChangeCount,
    input.endedAt === undefined ? null : input.endedAt,
    now,
    input.sessionId,
  );
}

/**
 * Close sessions that have been abandoned.
 *
 * A session is stale if it has been open longer than the maximum lifetime,
 * or if no activity has arrived within the inactivity window. A client that
 * goes offline mid-session leaves one of these behind, and without a sweeper
 * they accumulate forever.
 */
export function closeStaleSessions(
  db: SqliteDatabase,
  now: number,
  maxLifetimeMs: number,
  inactivityMs: number,
): number {
  const result = db
    .prepare(
      `UPDATE watch_sessions
       SET ended_at = ?, updated_at = ?
       WHERE ended_at IS NULL
         AND ( ? - started_at > ? OR ? - updated_at > ? )`,
    )
    .run(now, now, now, maxLifetimeMs, now, inactivityMs);
  return Number(result.changes ?? 0);
}

// ── Request claims ──────────────────────────────────────────────────────

export function claimRequestKey(
  db: SqliteDatabase,
  key: string,
  sessionId: string,
  expiresAt: number,
): "inserted" | "conflict" {
  try {
    db.prepare(
      `INSERT INTO request_claims (idempotency_key, session_id, created_at, expires_at)
       VALUES (?, ?, ?, ?)`,
    ).run(key, sessionId, Date.now(), expiresAt);
    return "inserted";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("UNIQUE") || message.includes("constraint")) return "conflict";
    throw error;
  }
}

export function releaseRequestKey(db: SqliteDatabase, key: string): void {
  db.prepare(`DELETE FROM request_claims WHERE idempotency_key = ?`).run(key);
}

export function purgeExpiredClaims(db: SqliteDatabase, now: number): number {
  const result = db.prepare(`DELETE FROM request_claims WHERE expires_at < ?`).run(now);
  return Number(result.changes ?? 0);
}

// ── Outbox ──────────────────────────────────────────────────────────────

/**
 * Enqueue a broker event inside the caller's transaction.
 *
 * This is the transactional outbox. The event is written in the same
 * transaction as the evidence it describes, so the two commit together. A
 * relay then reads unpublished rows and publishes them. If the process dies
 * between the commit and the publish, the row is still there and the event
 * goes out on the next pass.
 */
export function enqueueEvent(
  db: SqliteDatabase,
  input: { topic: string; eventKey: string; payload: unknown; now?: number },
): void {
  db.prepare(
    `INSERT INTO outbox (topic, event_key, payload, created_at, published_at, attempts)
     VALUES (?, ?, ?, ?, NULL, 0)`,
  ).run(input.topic, input.eventKey, JSON.stringify(input.payload), input.now ?? Date.now());
}

export function drainOutbox(
  db: SqliteDatabase,
  limit = 100,
): Array<{ id: number; topic: string; eventKey: string; payload: string }> {
  const rows = db
    .prepare(
      `SELECT id, topic, event_key, payload FROM outbox
       WHERE published_at IS NULL ORDER BY id ASC LIMIT ?`,
    )
    .all(limit) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: Number(row.id),
    topic: String(row.topic),
    eventKey: String(row.event_key),
    payload: String(row.payload),
  }));
}

export function markOutboxPublished(db: SqliteDatabase, id: number, now = Date.now()): void {
  db.prepare(`UPDATE outbox SET published_at = ?, attempts = attempts + 1 WHERE id = ?`).run(
    now,
    id,
  );
}

// ── Metrics ─────────────────────────────────────────────────────────────

export function incrementMetric(db: SqliteDatabase, name: string, delta = 1): void {
  const bucket = Math.floor(Date.now() / 3_600_000) * 3_600_000;
  db.prepare(
    `INSERT INTO metric_counters (bucket_start, name, count) VALUES (?, ?, ?)
     ON CONFLICT (bucket_start, name) DO UPDATE SET count = count + excluded.count`,
  ).run(bucket, name, delta);
}

export function readMetrics(db: SqliteDatabase): Array<{ name: string; count: number }> {
  const rows = db
    .prepare(
      `SELECT name, SUM(count) AS count FROM metric_counters
       WHERE bucket_start >= ? GROUP BY name ORDER BY name`,
    )
    .all(Math.floor(Date.now() / 3_600_000) * 3_600_000 - 86_400_000) as Array<
    Record<string, unknown>
  >;

  return rows.map((row) => ({
    name: String(row.name),
    count: Number(row.count ?? 0),
  }));
}

// ── The reconcile store adapter ─────────────────────────────────────────

/**
 * Adapter that lets the framework-free repair engine run against SQLite.
 *
 * The engine knows nothing about SQL. It knows how to audit a projection,
 * how to repair it, and how to page through subjects. This adapter supplies
 * the four primitives it needs.
 */
export function createReconcileStore(db: SqliteDatabase) {
  return {
    async readProjection(subject: RepairSubject) {
      return readProgress(db, subject.studentId, subject.subjectType, subject.subjectId);
    },
    async readEvidence(subject: RepairSubject) {
      return readEvidence(db, subject.studentId, subject.subjectType, subject.subjectId);
    },
    async writeProjection(progress: SubjectProgress) {
      writeProgress(db, progress);
    },
    async listSubjects(after: RepairSubject | null, limit: number) {
      return listSubjects(db, after, limit);
    },
  };
}

export { transaction };
export { computeWatchMetrics };
