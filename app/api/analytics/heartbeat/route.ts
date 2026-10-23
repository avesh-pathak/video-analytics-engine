/**
 * Heartbeat — the hot path.
 *
 * Every segment of watch-time enters the system here. This is a pure
 * analytics engine: there is no credential and no permission check. The
 * session is the server-owned context; it fixes the student, the subject,
 * the asset and the authoritative duration once, at open. A heartbeat
 * carries evidence and nothing that can redefine who or what it is about.
 *
 * The order of the stages is the design:
 *
 *   1. PARSE        Reject malformed input before doing any work.
 *   2. RESOLVE      Load the session; identity and duration come from it.
 *   3. CLAIM        Take the request-level idempotency claim.
 *   4. SANITIZE     Check every segment against the physical policy.
 *   5. WRITE        One transaction: evidence, session, projection, outbox.
 *
 * The claim sits after parsing and session resolution, and before the write.
 * If the claim were taken before parsing, a malformed request would consume
 * the key, and the client's corrected retry would be answered with "already
 * applied" — a cheerful success for a request that never happened. The
 * client would then drop the evidence, and the watch time would be lost with
 * no error anywhere.
 *
 * The response tells the client exactly what happened to each segment:
 * accepted, duplicate, or rejected with a reason and a retryability flag.
 * The client reconciles its outbox against that verdict. It never decides
 * for itself that a write landed.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, transaction } from "../../../../server/db.js";
import { applySchema } from "../../../../server/schema.js";
import {
  applyAcceptedSegments,
  claimRequestKey,
  enqueueEvent,
  incrementMetric,
  insertSegments,
  readSession,
  releaseRequestKey,
  updateSession,
  type SegmentInput,
} from "../../../../server/repository.js";
import { sanitizeSegments } from "../../../../engine/sanitize.js";
import { computeWatchMetrics } from "../../../../engine/watch-math.js";
import {
  IDEMPOTENCY_TTL_MS,
  MAX_SEGMENTS_PER_HEARTBEAT,
  MAX_VIDEO_DURATION_SECONDS,
  MIN_PLAYBACK_RATE,
  MAX_PLAYBACK_RATE,
} from "../../../../engine/policy.js";

export const runtime = "nodejs";

const segmentSchema = z.object({
  startSecond: z.number().nonnegative().max(MAX_VIDEO_DURATION_SECONDS + 1),
  endSecond: z.number().nonnegative().max(MAX_VIDEO_DURATION_SECONDS + 1),
  playbackRate: z.number().min(MIN_PLAYBACK_RATE).max(MAX_PLAYBACK_RATE).optional(),
  source: z.string().min(1).max(40).optional(),
  clientSegmentId: z.string().min(1).max(128).optional(),
  playerInstanceId: z.string().max(128).optional(),
  clientSequence: z.number().int().nonnegative().optional(),
  wallClockSeconds: z.number().nonnegative().optional(),
  segmentStartedAt: z.string().optional(),
  segmentEndedAt: z.string().optional(),
});

const heartbeatSchema = z.object({
  sessionId: z.string().min(1),
  currentTimeSeconds: z.number().nonnegative().max(MAX_VIDEO_DURATION_SECONDS),
  eventType: z
    .enum([
      "heartbeat",
      "play",
      "pause",
      "seek",
      "seeked",
      "ratechange",
      "ended",
      "session_close",
      "visibility_hidden",
      "pagehide",
      "resume",
    ])
    .optional(),
  segments: z.array(segmentSchema).max(MAX_SEGMENTS_PER_HEARTBEAT).default([]),
  counts: z
    .object({
      play: z.number().int().nonnegative().optional(),
      pause: z.number().int().nonnegative().optional(),
      seek: z.number().int().nonnegative().optional(),
      ratechange: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const db = getDb();
  applySchema(db);

  const idempotencyKey = request.headers.get("Idempotency-Key");
  let claimed = false;

  try {
    // ── 1. Parse ────────────────────────────────────────────────────
    const parsed = heartbeatSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }
    const data = parsed.data;

    // ── 2. Resolve the server-owned session context ─────────────────
    const session = readSession(db, data.sessionId);
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
      return NextResponse.json(
        {
          ok: false,
          error: "Session already ended.",
          code: "SESSION_ENDED",
          sessionTerminal: true,
          retryable: false,
        },
        { status: 409 },
      );
    }

    // No evidence and nothing to record: do not consume the claim.
    if (data.segments.length === 0) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "no-segments",
        sessionId: session.id,
        eventType: data.eventType ?? null,
        segmentsReceived: 0,
        acceptedSegmentIds: [],
        duplicateSegmentIds: [],
        rejectedSegments: [],
        summary: null,
      });
    }

    // ── 3. Claim (request-level dedup, before the write) ────────────
    if (idempotencyKey) {
      const outcome = claimRequestKey(
        db,
        idempotencyKey,
        session.id,
        Date.now() + IDEMPOTENCY_TTL_MS,
      );
      if (outcome === "conflict") {
        incrementMetric(db, "heartbeat_deduplicated");
        return NextResponse.json({
          ok: true,
          deduplicated: true,
          sessionId: session.id,
          eventType: data.eventType ?? null,
          segmentsReceived: 0,
          acceptedSegmentIds: [],
          duplicateSegmentIds: data.segments
            .map((s) => s.clientSegmentId)
            .filter((id): id is string => typeof id === "string" && id.length > 0),
          rejectedSegments: [],
          summary: null,
        });
      }
      claimed = true;
    }

    // ── 4. Sanitize against the authoritative duration ──────────────
    const batch = sanitizeSegments(data.segments, session.videoDurationSeconds);

    // ── 5. Write ────────────────────────────────────────────────────
    const now = Date.now();
    const segmentInputs: SegmentInput[] = batch.accepted.map((s) => ({
      sessionId: session.id,
      studentId: session.studentId,
      subjectType: session.subjectType,
      subjectId: session.subjectId,
      scope: session.scope,
      assetId: session.assetId,
      startSecond: s.startSecond,
      endSecond: s.endSecond,
      playbackRate: s.playbackRate ?? 1,
      wallClockSeconds: s.wallClockSeconds ?? s.endSecond - s.startSecond,
      source: s.source ?? "play",
      clientSegmentId: s.clientSegmentId ?? null,
      playerInstanceId: s.playerInstanceId ?? null,
      clientSequence: s.clientSequence ?? null,
      segmentStartedAt: s.segmentStartedAt ?? null,
      segmentEndedAt: s.segmentEndedAt ?? null,
    }));

    const result = transaction((tx) => {
      const inserted = insertSegments(tx, segmentInputs);

      // Only segments that were actually inserted move the projection.
      const acceptedSet = new Set(inserted.acceptedSegmentIds);
      const contributed = segmentInputs.filter(
        (s) => s.clientSegmentId && acceptedSet.has(s.clientSegmentId),
      );

      const progress = applyAcceptedSegments(tx, {
        studentId: session.studentId,
        subjectType: session.subjectType,
        subjectId: session.subjectId,
        videoDurationSeconds: session.videoDurationSeconds,
        segments: contributed,
        now,
      });

      const sessionMetrics = computeWatchMetrics(
        contributed.map((s) => ({
          start: s.startSecond,
          end: s.endSecond,
          wallClockSeconds: s.wallClockSeconds,
        })),
        session.videoDurationSeconds,
      );

      updateSession(tx, {
        sessionId: session.id,
        lastPositionSeconds: data.currentTimeSeconds,
        totalVideoSecondsWatched:
          session.totalVideoSecondsWatched + sessionMetrics.totalWatched,
        uniqueWatchedSeconds: progress.uniqueContentSeconds,
        completionPercentage: progress.completionPercentage,
        completed: progress.completed,
        counts: {
          play: data.counts?.play ?? 0,
          pause: data.counts?.pause ?? 0,
          seek: data.counts?.seek ?? 0,
          rateChange: data.counts?.ratechange ?? 0,
        },
        now,
      });

      // The outbox row is written in the SAME transaction as the evidence.
      // The event and the fact it describes commit together or not at all.
      enqueueEvent(tx, {
        topic: "video.segments",
        eventKey: session.scope,
        payload: {
          sessionId: session.id,
          studentId: session.studentId,
          subjectType: session.subjectType,
          subjectId: session.subjectId,
          assetId: session.assetId,
          inserted: inserted.inserted,
          duplicates: inserted.duplicateSegmentIds.length,
          rejected: batch.rejected.length,
          uniqueContentSeconds: progress.uniqueContentSeconds,
          totalContentSeconds: progress.totalContentSeconds,
          engagedWallClockSeconds: progress.engagedWallClockSeconds,
          completionPercentage: progress.completionPercentage,
          completed: progress.completed,
        },
        now,
      });

      incrementMetric(tx, "heartbeat_attempt");
      incrementMetric(tx, `segments_inserted_${inserted.inserted > 0 ? "some" : "none"}`);
      incrementMetric(tx, `segments_duplicate_${inserted.duplicateSegmentIds.length}`);

      return { inserted, progress };
    });

    return NextResponse.json({
      ok: true,
      sessionId: session.id,
      eventType: data.eventType ?? null,
      segmentsReceived: batch.accepted.length + batch.rejected.length,
      acceptedSegmentIds: result.inserted.acceptedSegmentIds,
      duplicateSegmentIds: result.inserted.duplicateSegmentIds,
      rejectedSegments: batch.rejected,
      summary: {
        videoDurationSeconds: result.progress.videoDurationSeconds,
        totalWatchedSeconds: result.progress.totalContentSeconds,
        uniqueWatchedSeconds: result.progress.uniqueContentSeconds,
        repeatWatchedSeconds: result.progress.repeatContentSeconds,
        engagedWallClockSeconds: result.progress.engagedWallClockSeconds,
        completionPercentage: result.progress.completionPercentage,
        completed: result.progress.completed,
      },
    });
  } catch (error) {
    // Release the claim so a genuine retry is not suppressed for the TTL.
    if (claimed && idempotencyKey) {
      try {
        releaseRequestKey(db, idempotencyKey);
      } catch {
        // Best effort. The TTL bounds the damage.
      }
    }
    incrementMetric(db, "heartbeat_error_processing");
    return NextResponse.json(
      {
        ok: false,
        stage: "HEARTBEAT_PROCESSING_FAILED",
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
