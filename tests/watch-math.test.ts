import { describe, expect, it } from "vitest";
import {
  calculateCompletionPercentage,
  computeWatchMetrics,
  mergeRanges,
  normalizeWatchSegment,
  renderCoverageBitmap,
  sumRanges,
  validateWatchSegment,
} from "../engine/watch-math.js";

describe("mergeRanges", () => {
  it("merges overlapping ranges", () => {
    expect(mergeRanges([{ start: 0, end: 10 }, { start: 5, end: 15 }])).toEqual([
      { start: 0, end: 15 },
    ]);
  });

  it("merges adjacent ranges", () => {
    expect(mergeRanges([{ start: 0, end: 10 }, { start: 10, end: 20 }])).toEqual([
      { start: 0, end: 20 },
    ]);
  });

  it("keeps disjoint ranges separate", () => {
    expect(mergeRanges([{ start: 0, end: 10 }, { start: 20, end: 30 }])).toEqual([
      { start: 0, end: 10 },
      { start: 20, end: 30 },
    ]);
  });

  it("sorts before merging", () => {
    expect(mergeRanges([{ start: 20, end: 30 }, { start: 0, end: 10 }])).toEqual([
      { start: 0, end: 10 },
      { start: 20, end: 30 },
    ]);
  });

  it("drops inverted ranges", () => {
    expect(mergeRanges([{ start: 30, end: 20 }])).toEqual([]);
  });
});

describe("computeWatchMetrics", () => {
  it("counts a rewatch once in unique and twice in total", () => {
    const metrics = computeWatchMetrics(
      [
        { start: 0, end: 10 },
        { start: 0, end: 10 },
      ],
      100,
    );

    expect(metrics.uniqueWatched).toBe(10);
    expect(metrics.totalWatched).toBe(20);
    expect(metrics.repeatWatched).toBe(10);
  });

  it("clips unique to the authoritative duration", () => {
    const metrics = computeWatchMetrics([{ start: 0, end: 200 }], 100);
    expect(metrics.uniqueWatched).toBe(100);
  });

  it("preserves the raw union when the duration is unknown", () => {
    // "We do not know how long the video is" is not "they watched nothing".
    const metrics = computeWatchMetrics([{ start: 0, end: 200 }], 0);
    expect(metrics.uniqueWatched).toBe(200);
  });

  it("excludes degenerate segments", () => {
    const metrics = computeWatchMetrics(
      [
        { start: 10, end: 10 },
        { start: 20, end: 15 },
        { start: 0, end: 5 },
      ],
      100,
    );
    expect(metrics.totalWatched).toBe(5);
  });

  it("sums wall clock separately from content", () => {
    const metrics = computeWatchMetrics(
      [{ start: 0, end: 30, wallClockSeconds: 10 }],
      100,
    );
    expect(metrics.totalWatched).toBe(30);
    expect(metrics.engagedWallClock).toBe(10);
  });
});

describe("normalizeWatchSegment", () => {
  it("swaps reversed bounds rather than dropping the evidence", () => {
    const segment = normalizeWatchSegment({ startSecond: 30, endSecond: 10 });
    expect(segment.startSecond).toBe(10);
    expect(segment.endSecond).toBe(30);
  });

  it("defaults the playback rate to 1", () => {
    expect(normalizeWatchSegment({ startSecond: 0, endSecond: 1 }).playbackRate).toBe(1);
  });
});

describe("validateWatchSegment", () => {
  it("rejects a segment that runs backwards", () => {
    const segment = normalizeWatchSegment({ startSecond: 0, endSecond: 0 });
    expect(validateWatchSegment(segment, 100)).toBe(false);
  });

  it("rejects a segment past the end of the video", () => {
    const segment = normalizeWatchSegment({ startSecond: 90, endSecond: 200 });
    expect(validateWatchSegment(segment, 100)).toBe(false);
  });

  it("accepts a segment at the boundary", () => {
    const segment = normalizeWatchSegment({ startSecond: 0, endSecond: 100 });
    expect(validateWatchSegment(segment, 100)).toBe(true);
  });
});

describe("calculateCompletionPercentage", () => {
  it("is zero when nothing was watched", () => {
    expect(calculateCompletionPercentage(0, 100)).toBe(0);
  });

  it("caps at 100", () => {
    expect(calculateCompletionPercentage(200, 100)).toBe(100);
  });

  it("never goes below zero", () => {
    expect(calculateCompletionPercentage(-10, 100)).toBe(0);
  });
});

describe("renderCoverageBitmap", () => {
  it("marks exactly the watched seconds", () => {
    const bitmap = renderCoverageBitmap([{ start: 2, end: 5 }], 10);
    expect(Array.from(bitmap)).toEqual([0, 0, 1, 1, 1, 0, 0, 0, 0, 0]);
  });

  it("returns an empty bitmap for an unknown duration", () => {
    expect(renderCoverageBitmap([{ start: 0, end: 5 }], 0).length).toBe(0);
  });
});

describe("sumRanges", () => {
  it("is zero for no ranges", () => {
    expect(sumRanges([])).toBe(0);
  });
});
