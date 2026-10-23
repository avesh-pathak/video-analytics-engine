import { describe, expect, it } from "vitest";
import {
  applySegmentsToProgress,
  compareProgress,
  emptyProgress,
  recomputeProgressFromEvidence,
} from "../engine/projection.js";
import {
  auditProjectionDrift,
  repairProjections,
  type ReconcileStore,
} from "../engine/reconcile.js";

function baseProgress() {
  return emptyProgress({
    studentId: "s1",
    subjectType: "local_video",
    subjectId: "v1",
    videoDurationSeconds: 600,
    now: 1_000,
  });
}

describe("projection", () => {
  it("incremental path equals the authoritative recompute", () => {
    const evidence = [
      { start: 0, end: 30, wallClockSeconds: 30 },
      { start: 30, end: 60, wallClockSeconds: 30 },
      { start: 0, end: 15, wallClockSeconds: 15 },
    ];

    let progress = baseProgress();
    for (const segment of evidence) {
      progress = applySegmentsToProgress(progress, [segment]);
    }

    const canonical = recomputeProgressFromEvidence({
      studentId: "s1",
      subjectType: "local_video",
      subjectId: "v1",
      videoDurationSeconds: 600,
      ranges: evidence,
    });

    expect(progress.uniqueContentSeconds).toBe(canonical.uniqueContentSeconds);
    expect(progress.totalContentSeconds).toBe(canonical.totalContentSeconds);
    expect(progress.engagedWallClockSeconds).toBe(canonical.engagedWallClockSeconds);
    expect(progress.completionPercentage).toBe(canonical.completionPercentage);
  });

  it("does not double-count a rewatch", () => {
    let progress = baseProgress();
    progress = applySegmentsToProgress(progress, [{ start: 0, end: 30 }]);
    progress = applySegmentsToProgress(progress, [{ start: 0, end: 30 }]);

    expect(progress.uniqueContentSeconds).toBe(30);
    expect(progress.totalContentSeconds).toBe(60);
    expect(progress.repeatContentSeconds).toBe(30);
  });

  it("unions across sessions rather than summing them", () => {
    // The same range watched on two different days.
    const canonical = recomputeProgressFromEvidence({
      studentId: "s1",
      subjectType: "local_video",
      subjectId: "v1",
      videoDurationSeconds: 600,
      ranges: [
        { start: 0, end: 30 },
        { start: 0, end: 30 },
      ],
    });

    expect(canonical.uniqueContentSeconds).toBe(30);
    expect(canonical.totalContentSeconds).toBe(60);
  });

  it("never shrinks the unique figure when coverage is incomplete", () => {
    let progress = { ...baseProgress(), coverageExact: false, uniqueContentSeconds: 100 };
    progress = applySegmentsToProgress(progress, [{ start: 0, end: 10 }]);
    expect(progress.uniqueContentSeconds).toBe(100);
  });
});

describe("compareProgress", () => {
  it("reports no drift for identical projections", () => {
    const a = baseProgress();
    expect(compareProgress(a, { ...a }).drifted).toBe(false);
  });

  it("reports drift when the totals disagree", () => {
    const a = baseProgress();
    const b = { ...a, totalContentSeconds: 50 };
    const report = compareProgress(a, b);
    expect(report.drifted).toBe(true);
    expect(report.deltas[0].field).toBe("totalContentSeconds");
  });
});

/**
 * An in-memory reconcile store, so the repair engine can be exercised
 * without a database. The engine itself knows nothing about SQL.
 */
function memoryStore(seed: {
  projection?: ReturnType<typeof baseProgress>;
  evidence?: Array<{ startSecond: number; endSecond: number; wallClockSeconds: number }>;
}) {
  const progress = seed.projection ?? baseProgress();
  const evidence = seed.evidence ?? [];

  const store: ReconcileStore = {
    async readProjection() {
      return progress;
    },
    async readEvidence() {
      return evidence;
    },
    async writeProjection(next) {
      Object.assign(progress, next);
    },
    async listSubjects() {
      return [
        {
          studentId: "s1",
          subjectType: "local_video",
          subjectId: "v1",
          videoDurationSeconds: 600,
        },
      ];
    },
  };

  return { store, progress };
}

describe("reconcile", () => {
  it("audits a drifted projection", async () => {
    const drifted = { ...baseProgress(), totalContentSeconds: 999 };
    const { store } = memoryStore({
      projection: drifted,
      evidence: [{ startSecond: 0, endSecond: 30, wallClockSeconds: 30 }],
    });

    const report = await auditProjectionDrift(store);
    expect(report.driftedSubjects).toBe(1);
    expect(report.netDeltaSeconds).toBe(969);
  });

  it("reports no drift when the projection is correct", async () => {
    const correct = recomputeProgressFromEvidence({
      studentId: "s1",
      subjectType: "local_video",
      subjectId: "v1",
      videoDurationSeconds: 600,
      ranges: [{ start: 0, end: 30, wallClockSeconds: 30 }],
    });
    const { store } = memoryStore({
      projection: correct,
      evidence: [{ startSecond: 0, endSecond: 30, wallClockSeconds: 30 }],
    });

    const report = await auditProjectionDrift(store);
    expect(report.driftedSubjects).toBe(0);
  });

  it("a dry run does not write", async () => {
    const drifted = { ...baseProgress(), totalContentSeconds: 999 };
    const { store } = memoryStore({
      projection: drifted,
      evidence: [{ startSecond: 0, endSecond: 30, wallClockSeconds: 30 }],
    });

    const result = await repairProjections(store, { apply: false });
    expect(result.repaired).toBe(0);
    expect(result.netDeltaSeconds).toBe(969);
  });

  it("an apply repairs the projection", async () => {
    const drifted = { ...baseProgress(), totalContentSeconds: 999 };
    const { store } = memoryStore({
      projection: drifted,
      evidence: [{ startSecond: 0, endSecond: 30, wallClockSeconds: 30 }],
    });

    const result = await repairProjections(store, { apply: true });
    expect(result.repaired).toBe(1);

    // Re-audit must now report no drift.
    const report = await auditProjectionDrift(store);
    expect(report.driftedSubjects).toBe(0);
  });
});
