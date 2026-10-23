/**
 * Session lifecycle.
 *
 * Two routes. `start` opens a session and hands back the server's heartbeat
 * cadence; `end` closes it and reconciles the projection one final time.
 *
 * There is no credential or permission check here, by design. This is a pure
 * analytics engine: the identity fields are dimensions of the evidence, not
 * an identity claim. Trust comes from recomputation — the server never
 * accepts a watched-seconds number from the client, so there is nothing for
 * a credential to protect. Access control, if a product needs it, belongs in
 * the gateway that fronts this engine, not in the measurement path.
 *
 * Both routes are get-or-create / idempotent-by-state rather than
 * idempotent-by-key. Opening a session twice returns the same session with
 * `alreadyOpen: true`. Ending a session twice returns the already-finalized
 * summary without rewriting history. The database enforces the
 * one-open-session invariant with a partial unique index, because an
 * application-level check cannot survive two concurrent requests.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getDb, transaction } from "../../../../server/db.js";
import { applySchema } from "../../../../server/schema.js";
import {
  getOrOpenSession,
  incrementMetric,
  readEvidence,
  readProgress,
  readSession,
  updateSession,
  writeProgress,
} from "../../../../server/repository.js";
import { recomputeProgressFromEvidence } from "../../../../engine/projection.js";
import { subjectScopeKey } from "../../../../engine/idempotency.js";
import {
  MAX_VIDEO_DURATION_SECONDS,
  NETWORK_HEARTBEAT_INTERVAL_MS,
} from "../../../../engine/policy.js";

export const runtime = "nodejs";

const identitySchema = z.object({
  studentId: z.string().min(1),
  subjectType: z.string().min(1),
  subjectId: z.string().min(1),
  assetId: z.string().min(1),
  videoDurationSeconds: z.number().nonnegative().max(MAX_VIDEO_DURATION_SECONDS),
});

export async function POST(request: Request) {
  const db = getDb();
  applySchema(db);

  try {
    const parsed = identitySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }
    const data = parsed.data;

    const scope = subjectScopeKey({
      subjectType: data.subjectType,
      subjectId: data.subjectId,
    });

    const result = transaction((tx) =>
      getOrOpenSession(tx, {
        sessionId: randomUUID(),
        studentId: data.studentId,
        subjectType: data.subjectType,
        subjectId: data.subjectId,
        scope,
        assetId: data.assetId,
        videoDurationSeconds: data.videoDurationSeconds,
      }),
    );

    incrementMetric(db, "session_start");

    return NextResponse.json({
      ok: true,
      sessionId: result.session.id,
      alreadyOpen: result.alreadyOpen,
      progress: readProgress(db, data.studentId, data.subjectType, data.subjectId),
      // The server sets the cadence. The client may accept it, but only
      // within a sane range — a malicious server response must not be able
      // to hammer the client into a request loop.
      networkHeartbeatIntervalMs: NETWORK_HEARTBEAT_INTERVAL_MS,
    });
  } catch (error) {
    incrementMetric(db, "session_start_error");
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * Finalize a session.
 *
 * The finalization recomputes the projection from the raw evidence rather
 * than trusting the accumulated one. This is the last chance to be right,
 * and it is cheap — the evidence for one subject is small.
 */
export async function PUT(request: Request) {
  const db = getDb();
  applySchema(db);

  try {
    const body = (await request.json()) as {
      sessionId?: string;
      currentTimeSeconds?: number;
    };

    if (!body.sessionId) {
      return NextResponse.json(
        { ok: false, error: "sessionId is required." },
        { status: 400 },
      );
    }

    const session = readSession(db, body.sessionId);
    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: "Session not found.",
          code: "SESSION_NOT_FOUND",
          sessionTerminal: true,
          retryable: false,
        },
        { status: 404 },
      );
    }

    if (session.endedAt !== null) {
      // Already finalized. Return the stored summary verbatim — do not
      // rewrite history, and do not error. The client may legitimately send
      // this twice (a `pagehide` and an unmount, for example).
      const progress = readProgress(db, session.studentId, session.subjectType, session.subjectId);
      return NextResponse.json({
        ok: true,
        alreadyEnded: true,
        progress: progress
          ? {
              videoDurationSeconds: progress.videoDurationSeconds,
              totalWatchedSeconds: progress.totalContentSeconds,
              uniqueWatchedSeconds: progress.uniqueContentSeconds,
              repeatWatchedSeconds: progress.repeatContentSeconds,
              completionPercentage: progress.completionPercentage,
              completed: progress.completed,
            }
          : null,
      });
    }

    const now = Date.now();
    const summary = transaction((tx) => {
      // Recompute from evidence. The stored projection is replaced, not
      // adjusted — this is the authoritative pass. Session-level counters
      // (session count, play/pause/seek/rate changes) are not derivable
      // from ranges alone, so they are carried forward from the projection.
      const existing = readProgress(
        tx,
        session.studentId,
        session.subjectType,
        session.subjectId,
      );
      const evidence = readEvidence(
        tx,
        session.studentId,
        session.subjectType,
        session.subjectId,
      );

      const progress = recomputeProgressFromEvidence({
        studentId: session.studentId,
        subjectType: session.subjectType,
        subjectId: session.subjectId,
        videoDurationSeconds: session.videoDurationSeconds,
        ranges: evidence.map((row) => ({
          start: row.startSecond,
          end: row.endSecond,
          wallClockSeconds: row.wallClockSeconds,
        })),
        sessionCount: existing?.sessionCount ?? 0,
        counts: existing
          ? {
              play: existing.playCount,
              pause: existing.pauseCount,
              seek: existing.seekCount,
              rateChange: existing.rateChangeCount,
            }
          : undefined,
        now,
      });

      writeProgress(tx, progress);

      updateSession(tx, {
        sessionId: session.id,
        lastPositionSeconds: body.currentTimeSeconds ?? session.lastPositionSeconds,
        uniqueWatchedSeconds: progress.uniqueContentSeconds,
        completionPercentage: progress.completionPercentage,
        completed: progress.completed,
        endedAt: now,
        now,
      });

      incrementMetric(tx, "session_end");
      return progress;
    });

    return NextResponse.json({
      ok: true,
      alreadyEnded: false,
      progress: {
        videoDurationSeconds: summary.videoDurationSeconds,
        totalWatchedSeconds: summary.totalContentSeconds,
        uniqueWatchedSeconds: summary.uniqueContentSeconds,
        repeatWatchedSeconds: summary.repeatContentSeconds,
        engagedWallClockSeconds: summary.engagedWallClockSeconds,
        completionPercentage: summary.completionPercentage,
        completed: summary.completed,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
