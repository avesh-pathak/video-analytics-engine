/**
 * Schema — idempotent DDL, applied at boot.
 *
 * There is no `migrations/` directory in this project, and that is a
 * deliberate design decision rather than an omission.
 *
 * A migration system exists to evolve a schema that already holds data
 * across deployments. This schema does not hold data that predates it: the
 * database file is created on first boot from this script, and the only
 * evolution path that matters is "add a column" — which `ALTER TABLE ...
 * ADD COLUMN IF NOT EXISTS` covers without a version table.
 *
 * The trade is deliberate. A migration ledger is real infrastructure with
 * real failure modes: a half-applied migration, a ledger that disagrees with
 * reality, a new contributor who has to learn the tool before they can run
 * the app. For a schema this small, a single idempotent script at boot is
 * strictly less machinery and cannot get out of sync.
 *
 * If the schema ever needs a real migration, this file is where the
 * evolution goes.
 */

import type { SqliteDatabase } from "./db.js";

export function applySchema(db: SqliteDatabase): void {
  db.exec(`
    -- ── Evidence: the append-only log ───────────────────────────────────
    -- Every interval the client claimed, with the wall-clock time it
    -- claims to have spent. Immutable. Never updated. Never deleted.
    CREATE TABLE IF NOT EXISTS watch_segments (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id        TEXT    NOT NULL,
      student_id        TEXT    NOT NULL,
      subject_type      TEXT    NOT NULL,
      subject_id        TEXT    NOT NULL,
      scope             TEXT    NOT NULL,
      asset_id          TEXT    NOT NULL,
      start_second      REAL    NOT NULL,
      end_second        REAL    NOT NULL,
      playback_rate     REAL    NOT NULL DEFAULT 1.0,
      wall_clock_seconds REAL   NOT NULL DEFAULT 0.0,
      source            TEXT    NOT NULL DEFAULT 'play',
      client_segment_id TEXT,
      player_instance_id TEXT,
      client_sequence   INTEGER,
      segment_started_at TEXT,
      segment_ended_at   TEXT,
      dedupe_excluded   INTEGER NOT NULL DEFAULT 0,
      created_at        INTEGER NOT NULL
    );

    -- The dedup guarantee. Partial, because rows marked as duplicates are
    -- preserved for audit but must not block a legitimate re-insert, and
    -- because rows without an identity cannot be deduped at all.
    --
    -- The scope key is session-independent by design: a client that was
    -- offline long enough for its session to expire replays its segments
    -- under a NEW session id, and the dedup must still collapse them.
    CREATE UNIQUE INDEX IF NOT EXISTS uq_seg_client_segment_identity
      ON watch_segments (student_id, scope, client_segment_id)
      WHERE client_segment_id IS NOT NULL AND dedupe_excluded = 0;

    CREATE INDEX IF NOT EXISTS idx_seg_subject
      ON watch_segments (student_id, subject_type, subject_id, created_at);

    CREATE INDEX IF NOT EXISTS idx_seg_session
      ON watch_segments (session_id, created_at);

    -- ── Projection: the mutable answer ─────────────────────────────────
    -- One row per (student, subject). Rebuildable from watch_segments.
    CREATE TABLE IF NOT EXISTS subject_progress (
      student_id               TEXT NOT NULL,
      subject_type             TEXT NOT NULL,
      subject_id               TEXT NOT NULL,
      video_duration_seconds   REAL NOT NULL DEFAULT 0.0,
      unique_content_seconds   REAL NOT NULL DEFAULT 0.0,
      total_content_seconds    REAL NOT NULL DEFAULT 0.0,
      engaged_wall_clock_seconds REAL NOT NULL DEFAULT 0.0,
      repeat_content_seconds   REAL NOT NULL DEFAULT 0.0,
      last_position_seconds    REAL NOT NULL DEFAULT 0.0,
      max_position_seconds     REAL NOT NULL DEFAULT 0.0,
      completion_percentage    REAL NOT NULL DEFAULT 0.0,
      completed                INTEGER NOT NULL DEFAULT 0,
      session_count            INTEGER NOT NULL DEFAULT 0,
      play_count               INTEGER NOT NULL DEFAULT 0,
      pause_count              INTEGER NOT NULL DEFAULT 0,
      seek_count               INTEGER NOT NULL DEFAULT 0,
      rate_change_count        INTEGER NOT NULL DEFAULT 0,
      watched_ranges           TEXT NOT NULL DEFAULT '[]',
      coverage_exact           INTEGER NOT NULL DEFAULT 1,
      first_started_at         INTEGER NOT NULL,
      last_watched_at          INTEGER NOT NULL,
      PRIMARY KEY (student_id, subject_type, subject_id)
    );

    CREATE INDEX IF NOT EXISTS idx_progress_last_watched
      ON subject_progress (student_id, last_watched_at DESC);

    -- ── Sessions ────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS watch_sessions (
      id                TEXT PRIMARY KEY,
      student_id        TEXT NOT NULL,
      subject_type      TEXT NOT NULL,
      subject_id        TEXT NOT NULL,
      scope             TEXT NOT NULL,
      asset_id          TEXT NOT NULL,
      video_duration_seconds REAL NOT NULL DEFAULT 0.0,
      started_at        INTEGER NOT NULL,
      ended_at          INTEGER,
      last_position_seconds REAL NOT NULL DEFAULT 0.0,
      total_video_seconds_watched REAL NOT NULL DEFAULT 0.0,
      unique_watched_seconds   REAL NOT NULL DEFAULT 0.0,
      completion_percentage   REAL NOT NULL DEFAULT 0.0,
      completed         INTEGER NOT NULL DEFAULT 0,
      play_count        INTEGER NOT NULL DEFAULT 0,
      pause_count       INTEGER NOT NULL DEFAULT 0,
      seek_count        INTEGER NOT NULL DEFAULT 0,
      rate_change_count INTEGER NOT NULL DEFAULT 0,
      created_at        INTEGER NOT NULL,
      updated_at        INTEGER NOT NULL
    );

    -- One open session per (student, subject). Enforced by the index rather
    -- than by application logic, because two concurrent requests can both
    -- pass an application-level check.
    CREATE UNIQUE INDEX IF NOT EXISTS uq_session_one_open
      ON watch_sessions (student_id, scope)
      WHERE ended_at IS NULL;

    -- ── Request-level idempotency ──────────────────────────────────────
    -- The first layer of dedup. Short-lived: it covers near-simultaneous
    -- retries of the same HTTP request, not a replay under a new session.
    CREATE TABLE IF NOT EXISTS request_claims (
      idempotency_key TEXT PRIMARY KEY,
      session_id      TEXT,
      created_at      INTEGER NOT NULL,
      expires_at      INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_request_claims_expiry
      ON request_claims (expires_at);

    -- ── Outbox: the transactional hand-off to the broker ───────────────
    -- Written in the SAME transaction as the evidence. A relay reads it and
    -- publishes to the broker. This is what avoids the dual-write problem:
    -- the evidence and the intent to publish it commit together or not at
    -- all.
    CREATE TABLE IF NOT EXISTS outbox (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      topic         TEXT NOT NULL,
      event_key     TEXT NOT NULL,
      payload       TEXT NOT NULL,
      created_at    INTEGER NOT NULL,
      published_at  INTEGER,
      attempts      INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_outbox_unpublished
      ON outbox (published_at, id);

    -- ── Observability counters ─────────────────────────────────────────
    -- Aggregated, not per-request. A counter table written on every
    -- heartbeat would be a second write on the hot path, and would contend
    -- with the evidence write for the same lock.
    CREATE TABLE IF NOT EXISTS metric_counters (
      bucket_start INTEGER NOT NULL,
      name         TEXT NOT NULL,
      count        INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (bucket_start, name)
    );
  `);
}

/**
 * Subjects, for the keyset pagination the repair engine uses.
 *
 * The ordering is the important part: it must be a total order over the
 * subject identity so that a cursor can resume exactly where the previous
 * page stopped. Ordering by (student, type, id) is stable and total.
 */
export const SUBJECT_PAGE_SQL = `
  SELECT student_id, subject_type, subject_id, video_duration_seconds
  FROM subject_progress
  WHERE
    (student_id, subject_type, subject_id) > (?, ?, ?)
  ORDER BY student_id, subject_type, subject_id
  LIMIT ?
`;
