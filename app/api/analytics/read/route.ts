/**
 * Read path — the analytics surface.
 *
 * Every number this route returns is derived from the projection, and the
 * projection is derived from the evidence. The route itself computes
 * nothing it cannot justify.
 *
 * Two different "watch time" numbers exist and they mean different things.
 * Conflating them is the most common way an analytics product ends up
 * lying to its users:
 *
 *   engagedWallClockSeconds  Real time the learner spent with playback
 *                            running. This is the number that answers "how
 *                            long did they study?".
 *
 *   uniqueContentSeconds     How much of the video's content they saw, once.
 *                            A video watched at 2x for 30 minutes covers
 *                            60 minutes of content but is 30 minutes of
 *                            study.
 *
 * Reporting one under the label of the other is how "learned 40 hours this
 * week" ends up meaning something different from what the learner did.
 */

import { NextResponse } from "next/server";
import { getDb } from "../../../../server/db.js";
import { applySchema } from "../../../../server/schema.js";
import { readEvidence, readMetrics, readProgress } from "../../../../server/repository.js";
import { computeWatchMetrics } from "../../../../engine/watch-math.js";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const db = getDb();
  applySchema(db);

  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId");
    const subjectType = url.searchParams.get("subjectType") ?? "local_video";
    const subjectId = url.searchParams.get("subjectId");

    if (!studentId) {
      return NextResponse.json(
        { ok: false, error: "studentId is required." },
        { status: 400 },
      );
    }

    if (subjectId) {
      const progress = readProgress(db, studentId, subjectType, subjectId);
      if (!progress) {
        return NextResponse.json({ ok: true, progress: null });
      }

      // Recompute from evidence on demand. The projection is a cache; this
      // is the truth. The comparison between them is what the drift audit
      // reports, and surfacing it here means a discrepancy is visible
      // without an admin tool.
      const evidence = readEvidence(db, studentId, subjectType, subjectId);
      const canonical = computeWatchMetrics(
        evidence.map((e) => ({
          start: e.startSecond,
          end: e.endSecond,
          wallClockSeconds: e.wallClockSeconds,
        })),
        progress.videoDurationSeconds,
      );

      return NextResponse.json({
        ok: true,
        progress: {
          studentId: progress.studentId,
          subjectType: progress.subjectType,
          subjectId: progress.subjectId,
          videoDurationSeconds: progress.videoDurationSeconds,
          totalWatchedSeconds: progress.totalContentSeconds,
          uniqueWatchedSeconds: progress.uniqueContentSeconds,
          repeatWatchedSeconds: progress.repeatContentSeconds,
          engagedWallClockSeconds: progress.engagedWallClockSeconds,
          completionPercentage: progress.completionPercentage,
          completed: progress.completed,
          lastPositionSeconds: progress.lastPositionSeconds,
          maxPositionSeconds: progress.maxPositionSeconds,
          sessionCount: progress.sessionCount,
          watchedRanges: progress.watchedRanges,
          coverageExact: progress.coverageExact,
        },
        canonical: {
          uniqueWatched: canonical.uniqueWatched,
          totalWatched: canonical.totalWatched,
          engagedWallClock: canonical.engagedWallClock,
        },
        drift: {
          uniqueDelta: Number(
            (progress.uniqueContentSeconds - canonical.uniqueWatched).toFixed(2),
          ),
          totalDelta: Number(
            (progress.totalContentSeconds - canonical.totalWatched).toFixed(2),
          ),
          wallClockDelta: Number(
            (progress.engagedWallClockSeconds - canonical.engagedWallClock).toFixed(2),
          ),
        },
      });
    }

    // All subjects for one student.
    const rows = db
      .prepare(
        `SELECT * FROM subject_progress WHERE student_id = ? ORDER BY last_watched_at DESC`,
      )
      .all(studentId) as Array<Record<string, unknown>>;

    return NextResponse.json({
      ok: true,
      subjects: rows.map((row) => ({
        subjectType: row.subject_type,
        subjectId: row.subject_id,
        videoDurationSeconds: row.video_duration_seconds,
        totalWatchedSeconds: row.total_content_seconds,
        uniqueWatchedSeconds: row.unique_content_seconds,
        engagedWallClockSeconds: row.engaged_wall_clock_seconds,
        completionPercentage: row.completion_percentage,
        completed: Number(row.completed) === 1,
      })),
      metrics: readMetrics(db),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
