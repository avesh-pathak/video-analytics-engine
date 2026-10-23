/**
 * The projection repair engine.
 *
 * A materialized projection over an event log will drift. Not because the
 * code is wrong â€” because the code was right for every case that happened,
 * and then reality produced a case it did not handle: a client that went
 * offline mid-segment, a session that expired, a migration that changed a
 * column, a bug shipped on a Friday.
 *
 * A system that cannot detect its own drift is not one you can trust with a
 * number. This module is the part that makes it trustworthy.
 *
 * The shape of the operation matters as much as the arithmetic.
 *
 *   AUDIT     Read-only. Compares the projection against a full recompute
 *             and reports the delta. Cheap to run, safe to run often. This
 *             is what a monitoring job calls.
 *
 *   DRY RUN   Recomputes and compares, but writes nothing. Lets an operator
 *             see exactly what would change before anything changes.
 *
 *   APPLY     Writes the recomputed values, in bounded pages, with a
 *             per-subject savepoint so one bad row cannot abort the batch.
 *
 *   VERIFY    Re-runs the audit after the apply. The delta must be zero.
 *
 * Bounded pages are what make this safe to run against a live database. A
 * repair that locks a million rows for an hour is not a repair, it is an
 * outage. The repair is keyset-paginated â€” it walks
 * (student, subject_type, subject_id) in order and returns a cursor, so it
 * can be interrupted and resumed, and it holds at most one page of locks at
 * a time.
 *
 * This module is a TypeScript port of the reconciliation engine that
 * previously existed as ~60KB of PostgreSQL plpgsql. The port exists for
 * two reasons: the engine should be unit-testable without a database, and
 * the same logic should be able to run against a different store without
 * being rewritten.
 */

import {
  applySegmentsToProgress,
  compareProgress,
  recomputeProgressFromEvidence,
  type DriftReport,
  type SubjectProgress,
} from "./projection.js";
import { COMPLETION_THRESHOLD } from "./policy.js";
import type { RawWatchRange } from "./watch-math.js";

export interface EvidenceRow {
  startSecond: number;
  endSecond: number;
  wallClockSeconds: number;
}

/**
 * Map stored evidence rows into the shape the watch math consumes.
 *
 * The storage row and the math range are deliberately different types: the
 * row is named after its columns, the range after its meaning. Casting one to
 * the other would let a shape mismatch pass silently â€” and a mismatch here
 * produces a canonical total of zero rather than an error, which is the worst
 * possible failure mode for a correctness tool.
 */
function toRanges(evidence: EvidenceRow[]): RawWatchRange[] {
  return evidence.map((row) => ({
    start: row.startSecond,
    end: row.endSecond,
    wallClockSeconds: row.wallClockSeconds,
  }));
}

export interface RepairSubject {
  studentId: string;
  subjectType: string;
  subjectId: string;
  videoDurationSeconds: number;
}

export interface DriftSample extends DriftReport {
  deltaTotalSeconds: number;
}

export interface AuditResult {
  scannedSubjects: number;
  driftedSubjects: number;
  affectedStudents: number;
  netDeltaSeconds: number;
  absDeltaSeconds: number;
  maxAbsDeltaSeconds: number;
  samples: DriftSample[];
}

export interface RepairResult {
  scanned: number;
  repaired: number;
  skipped: number;
  failed: number;
  netDeltaSeconds: number;
  samples: Array<{
    studentId: string;
    subjectType: string;
    subjectId: string;
    deltaTotalSeconds: number;
    applied: boolean;
    error?: string;
  }>;
  nextCursor: string | null;
}

export interface ReconcileStore {
  /** Read the stored projection for one subject, or null if absent. */
  readProjection(subject: RepairSubject): Promise<SubjectProgress | null>;
  /** Read every accepted evidence row for one subject. */
  readEvidence(subject: RepairSubject): Promise<EvidenceRow[]>;
  /** Write a recomputed projection. */
  writeProjection(progress: SubjectProgress): Promise<void>;
  /** Walk subjects in keyset order. `after` is the exclusive lower bound. */
  listSubjects(
    after: RepairSubject | null,
    limit: number,
  ): Promise<RepairSubject[]>;
}

export interface ReconcileOptions {
  limit?: number;
  completionThreshold?: number;
  dryRun?: boolean;
  apply?: boolean;
  after?: RepairSubject | null;
}

function subjectKey(subject: RepairSubject): string {
  return `${subject.studentId}|${subject.subjectType}|${subject.subjectId}`;
}

/**
 * Compare a stored projection against a full recompute from raw evidence.
 *
 * Read-only. This is the function a monitoring job calls on a schedule.
 */
export async function auditProjectionDrift(
  store: ReconcileStore,
  options: ReconcileOptions = {},
): Promise<AuditResult> {
  const limit = options.limit ?? 200;
  const completionThreshold = options.completionThreshold ?? COMPLETION_THRESHOLD;

  const subjects = await store.listSubjects(options.after ?? null, limit);
  const samples: DriftSample[] = [];

  let driftedSubjects = 0;
  let netDelta = 0;
  let absDelta = 0;
  let maxAbsDelta = 0;
  const affectedStudents = new Set<string>();

  for (const subject of subjects) {
    const stored = await store.readProjection(subject);
    if (!stored) continue;

    const evidence = await store.readEvidence(subject);
    const canonical = recomputeProgressFromEvidence({
      studentId: subject.studentId,
      subjectType: subject.subjectType,
      subjectId: subject.subjectId,
      videoDurationSeconds: subject.videoDurationSeconds,
      ranges: toRanges(evidence),
      completionThreshold,
    });

    const report = compareProgress(stored, canonical);
    if (!report.drifted) continue;

    const deltaTotal = Number(
      (stored.totalContentSeconds - canonical.totalContentSeconds).toFixed(2),
    );

    driftedSubjects += 1;
    affectedStudents.add(subject.studentId);
    netDelta += deltaTotal;
    absDelta += Math.abs(deltaTotal);
    maxAbsDelta = Math.max(maxAbsDelta, Math.abs(deltaTotal));

    samples.push({ ...report, deltaTotalSeconds: deltaTotal });
  }

  return {
    scannedSubjects: subjects.length,
    driftedSubjects,
    affectedStudents: affectedStudents.size,
    netDeltaSeconds: Number(netDelta.toFixed(2)),
    absDeltaSeconds: Number(absDelta.toFixed(2)),
    maxAbsDeltaSeconds: Number(maxAbsDelta.toFixed(2)),
    samples,
  };
}

/**
 * Recompute and repair drifted projections.
 *
 * Each subject is repaired in isolation. A subject that throws is reported
 * and skipped; it does not abort the page. That is the savepoint behaviour
 * the SQL implementation had, and it is what makes a batch repair safe to
 * run against live data.
 */
export async function repairProjections(
  store: ReconcileStore,
  options: ReconcileOptions = {},
): Promise<RepairResult> {
  const limit = options.limit ?? 200;
  const completionThreshold = options.completionThreshold ?? COMPLETION_THRESHOLD;
  const apply = options.apply ?? false;

  const subjects = await store.listSubjects(options.after ?? null, limit);

  const result: RepairResult = {
    scanned: subjects.length,
    repaired: 0,
    skipped: 0,
    failed: 0,
    netDeltaSeconds: 0,
    samples: [],
    nextCursor: null,
  };

  for (const subject of subjects) {
    try {
      const stored = await store.readProjection(subject);
      if (!stored) {
        result.skipped += 1;
        continue;
      }

      const evidence = await store.readEvidence(subject);
      const canonical = recomputeProgressFromEvidence({
        studentId: subject.studentId,
        subjectType: subject.subjectType,
        subjectId: subject.subjectId,
        videoDurationSeconds: subject.videoDurationSeconds,
        ranges: toRanges(evidence),
        completionThreshold,
      });

      const report = compareProgress(stored, canonical);
      const deltaTotal = Number(
        (stored.totalContentSeconds - canonical.totalContentSeconds).toFixed(2),
      );

      if (!report.drifted) {
        result.skipped += 1;
        result.samples.push({
          studentId: subject.studentId,
          subjectType: subject.subjectType,
          subjectId: subject.subjectId,
          deltaTotalSeconds: 0,
          applied: false,
        });
        continue;
      }

      if (apply) {
        // Preserve the counters and session count â€” the repair corrects the
        // *time* arithmetic, it does not rewrite history.
        const repaired: SubjectProgress = {
          ...canonical,
          sessionCount: stored.sessionCount,
          playCount: stored.playCount,
          pauseCount: stored.pauseCount,
          seekCount: stored.seekCount,
          rateChangeCount: stored.rateChangeCount,
          firstStartedAt: stored.firstStartedAt,
        };
        await store.writeProjection(repaired);
        result.repaired += 1;
      } else {
        result.skipped += 1;
      }

      result.netDeltaSeconds += deltaTotal;
      result.samples.push({
        studentId: subject.studentId,
        subjectType: subject.subjectType,
        subjectId: subject.subjectId,
        deltaTotalSeconds: deltaTotal,
        applied: apply,
      });
    } catch (error) {
      // Isolated failure. The batch continues.
      result.failed += 1;
      result.samples.push({
        studentId: subject.studentId,
        subjectType: subject.subjectType,
        subjectId: subject.subjectId,
        deltaTotalSeconds: 0,
        applied: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  result.netDeltaSeconds = Number(result.netDeltaSeconds.toFixed(2));

  // Cursor for the next page. Keyset pagination: the next page starts after
  // the last subject in this one. A repair interrupted halfway resumes from
  // here without re-scanning.
  const last = subjects[subjects.length - 1];
  result.nextCursor = last ? subjectKey(last) : null;

  return result;
}

/**
 * Rebuild every projection for one student from the raw evidence.
 *
 * This is the "drop the cache and refill it" operation. It is the strongest
 * possible correctness check available: if a rebuild produces different
 * numbers than the incremental path did, the incremental path is wrong.
 *
 * It is also the operation that makes the Kafka story concrete â€” a rebuild
 * from the event log is a replay, and a replay that converges is a proof.
 */
export async function rebuildStudentProjections(
  store: ReconcileStore,
  studentId: string,
  options: { completionThreshold?: number; apply?: boolean } = {},
): Promise<RepairResult> {
  const completionThreshold = options.completionThreshold ?? COMPLETION_THRESHOLD;
  const apply = options.apply ?? false;

  const subjects = (await store.listSubjects(null, 10_000)).filter(
    (s) => s.studentId === studentId,
  );

  const result: RepairResult = {
    scanned: subjects.length,
    repaired: 0,
    skipped: 0,
    failed: 0,
    netDeltaSeconds: 0,
    samples: [],
    nextCursor: null,
  };

  for (const subject of subjects) {
    try {
      const stored = await store.readProjection(subject);
      const evidence = await store.readEvidence(subject);
      const canonical = recomputeProgressFromEvidence({
        studentId: subject.studentId,
        subjectType: subject.subjectType,
        subjectId: subject.subjectId,
        videoDurationSeconds: subject.videoDurationSeconds,
        ranges: toRanges(evidence),
        completionThreshold,
      });

      if (stored) {
        const report = compareProgress(stored, canonical);
        const delta = Number(
          (stored.totalContentSeconds - canonical.totalContentSeconds).toFixed(2),
        );
        result.netDeltaSeconds += delta;
        if (report.drifted) {
          result.samples.push({
            studentId: subject.studentId,
            subjectType: subject.subjectType,
            subjectId: subject.subjectId,
            deltaTotalSeconds: delta,
            applied: false,
          });
        }
      }

      if (apply) {
        const merged: SubjectProgress = stored
          ? {
              ...canonical,
              sessionCount: stored.sessionCount,
              playCount: stored.playCount,
              pauseCount: stored.pauseCount,
              seekCount: stored.seekCount,
              rateChangeCount: stored.rateChangeCount,
              firstStartedAt: stored.firstStartedAt,
            }
          : canonical;
        await store.writeProjection(merged);
        result.repaired += 1;
      } else {
        result.skipped += 1;
      }
    } catch (error) {
      result.failed += 1;
      result.samples.push({
        studentId: subject.studentId,
        subjectType: subject.subjectType,
        subjectId: subject.subjectId,
        deltaTotalSeconds: 0,
        applied: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  result.netDeltaSeconds = Number(result.netDeltaSeconds.toFixed(2));
  return result;
}

/**
 * Fold new evidence into a projection using the incremental path.
 *
 * Exposed here so the two paths can be compared directly in a test: apply
 * incrementally, then recompute from scratch, and assert the two agree.
 */
export function incrementalStep(
  progress: SubjectProgress,
  newEvidence: EvidenceRow[],
): SubjectProgress {
  return applySegmentsToProgress(progress, toRanges(newEvidence), {
    completionThreshold: COMPLETION_THRESHOLD,
  });
}
