/**
 * The segment state machine.
 *
 * This is the client half of the engine, and it has no player dependency. It
 * consumes ten standard media callbacks — `play`, `playing`, `timeupdate`,
 * `pause`, `seeking`, `seeked`, `ratechange`, `ended`, `waiting`, `stalled`
 * — which is exactly the set a native `<video>` element emits. It imports no
 * player SDK, embeds no iframe, and fetches no media or provider data. Any
 * source that can surface those events can feed it.
 *
 * What it produces: a stream of *segments*. A segment is a contiguous stretch
 * of playback with no discontinuity in it. A segment ends when:
 *
 *   - playback pauses
 *   - the user seeks
 *   - buffering starts
 *   - the playback rate changes
 *   - the tab is hidden
 *   - the player ends
 *   - the segment reaches 110 seconds of content (rollover)
 *   - the playhead jumps backwards
 *
 * Every one of those is a point where "the learner was continuously watching
 * this part of the video" stops being true, and continuing the segment past
 * it would make the wall-clock evidence wrong.
 *
 * Two subtleties that carry most of the weight:
 *
 *   SEEK DETECTION WITHOUT A SEEK EVENT.
 *     A seek that the browser reports is easy. A seek the browser *does not*
 *     report — a dropped frame, a slow network, a device stall — is not. The
 *     fix is arithmetic: if the playhead moved further than wall-clock time
 *     could possibly explain, it moved on its own, and the segment must be
 *     closed. The tolerance is deliberately generous (1.35x) because a
 *     legitimate jump is faster than real time by exactly the playback rate,
 *     and stutters add noise on top of that.
 *
 *   WALL CLOCK IS MEASURED PER SEGMENT, NOT PER TICK.
 *     A segment's wall clock is the real time between the moment it opened
 *     and the moment it closed. Paused time is therefore excluded by
 *     construction — there is no segment spanning the pause — and this is
 *     what makes `engagedWallClock` a meaningful number rather than an echo of
 *     the session length.
 */

import {
  ACTIVE_SEGMENT_MAX_CONTENT_SECONDS,
  MIN_PLAYBACK_RATE,
  MAX_PLAYBACK_RATE,
  WATCH_TIME_PLAUSIBILITY_TOLERANCE,
} from "./policy.js";
import {
  normalizeWatchSegment,
  type NormalizedWatchSegment,
  type WatchSegmentInput,
} from "./watch-math.js";

export type PlayerState =
  | "IDLE"
  | "PLAY_REQUESTED"
  | "PLAYING"
  | "PAUSED"
  | "SEEKING"
  | "BUFFERING"
  | "SUSPENDED"
  | "ENDED";

export type SegmentSource =
  | "play"
  | "timeupdate"
  | "rollover"
  | "rewind"
  | "visibility_restored";

export interface Segment extends WatchSegmentInput {
  startSecond: number;
  endSecond: number;
  playbackRate: number;
  source: SegmentSource;
  clientSegmentId: string;
  playerInstanceId: string;
  clientSequence: number;
  wallClockSeconds: number;
  segmentStartedAt: string;
  segmentEndedAt: string;
}

export interface EventCounts {
  play: number;
  pause: number;
  seek: number;
  ratechange: number;
}

export interface SegmentMachineOptions {
  /** Stable identity for the subject being watched. */
  subjectKey: string;
  /** Minted once per player mount. */
  playerInstanceId: string;
  /** Injected for deterministic tests. */
  now?: () => number;
  /** Injected for deterministic tests. */
  mintId?: () => string;
}

export interface SegmentMachineEvents {
  /** A segment was closed and is ready to be persisted. */
  onSegment: (segment: Segment) => void;
  /** A player state transition happened. */
  onTransition: (from: PlayerState, to: PlayerState) => void;
}

export class SegmentMachine {
  private state: PlayerState = "IDLE";
  private isPlaying = false;
  private duration = 0;
  private lastTime = 0;
  private lastTickWall = 0;
  private segmentStartWall = 0;
  private sequence = 0;
  private playbackRate = 1.0;
  private current: Segment | null = null;

  readonly counts: EventCounts = { play: 0, pause: 0, seek: 0, ratechange: 0 };

  constructor(
    private readonly options: SegmentMachineOptions,
    private readonly events: SegmentMachineEvents,
  ) {}

  private now(): number {
    return this.options.now ? this.options.now() : Date.now();
  }

  private mintId(): string {
    if (this.options.mintId) return this.options.mintId();
    return globalThis.crypto?.randomUUID?.() ?? `seg-${Date.now()}-${this.sequence}`;
  }

  get playerState(): PlayerState {
    return this.state;
  }

  get currentSegment(): Segment | null {
    return this.current;
  }

  get videoDuration(): number {
    return this.duration;
  }

  get playbackSpeed(): number {
    return this.playbackRate;
  }

  private transition(next: PlayerState): void {
    if (this.state === next) return;
    const previous = this.state;
    this.state = next;
    this.events.onTransition(previous, next);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  onPlay(): void {
    this.isPlaying = true;
    this.transition("PLAY_REQUESTED");
    this.counts.play += 1;
  }

  onPlaying(): void {
    this.isPlaying = true;
    this.transition("PLAYING");
  }

  onPause(): void {
    this.isPlaying = false;
    this.transition("PAUSED");
    this.counts.pause += 1;
    this.closeActiveSegment();
  }

  onSeekStart(): void {
    this.closeActiveSegment();
    this.transition("SEEKING");
  }

  onSeek(): void {
    this.counts.seek += 1;
    this.closeActiveSegment();
  }

  onBuffering(): void {
    if (!this.isPlaying) return;
    this.transition("BUFFERING");
    this.closeActiveSegment();
  }

  onRateChange(rate?: number): void {
    this.counts.ratechange += 1;
    if (rate === undefined || !Number.isFinite(rate)) return;
    if (rate < MIN_PLAYBACK_RATE || rate > MAX_PLAYBACK_RATE) return;
    this.playbackRate = rate;
    this.closeActiveSegment();
  }

  onEnded(): void {
    this.isPlaying = false;
    this.transition("ENDED");
    this.closeActiveSegment();
  }

  /** The tab went to the background. */
  onVisibilityHidden(): void {
    if (!this.isPlaying) return;
    this.transition("SUSPENDED");
    this.closeActiveSegment();
  }

  /** The tab came back. A new segment starts where the playhead is. */
  onVisibilityRestored(): void {
    if (!this.isPlaying) return;
    this.transition("PLAY_REQUESTED");
    if (!this.current) this.startNewSegment(this.lastTime, "visibility_restored");
  }

  // ── The tick ──────────────────────────────────────────────────────────

  /**
   * Called on every `timeupdate`.
   *
   * `currentTime` is the playhead position. `videoDurationSeconds` is
   * optional and only ever used to grow the known duration — a duration that
   * arrives late must never shrink the recorded one.
   */
  onTimeUpdate(currentTime: number, videoDurationSeconds?: number): void {
    if (
      typeof videoDurationSeconds === "number" &&
      Number.isFinite(videoDurationSeconds) &&
      videoDurationSeconds >= 0 &&
      videoDurationSeconds > this.duration
    ) {
      this.duration = videoDurationSeconds;
    }

    const now = this.now();
    const delta = currentTime - this.lastTime;

    // A seek in progress: consume the tick, account for nothing.
    if (this.state === "SEEKING") {
      this.transition(this.isPlaying ? "PLAY_REQUESTED" : "PAUSED");
      this.lastTime = currentTime;
      this.lastTickWall = now;
      return;
    }

    const wallDeltaSec = this.lastTickWall ? (now - this.lastTickWall) / 1000 : 0;
    const maxAllowedDelta =
      wallDeltaSec > 0
        ? Math.max(0.35, wallDeltaSec * this.playbackRate * WATCH_TIME_PLAUSIBILITY_TOLERANCE)
        : 3.0;

    const isUnreportedJump = Math.abs(delta) > maxAllowedDelta;

    if (!this.isPlaying) {
      this.lastTime = currentTime;
      this.lastTickWall = now;
      return;
    }

    if (isUnreportedJump) {
      // The playhead moved further than wall-clock time can explain. Whether
      // or not the browser reported a seek, the continuity is broken.
      this.closeActiveSegment();
      this.transition("SEEKING");
      this.lastTime = currentTime;
      this.lastTickWall = now;
      return;
    }

    if (delta > 0) {
      this.transition("PLAYING");
      if (!this.current) this.startNewSegment(this.lastTime, "play");
      this.current!.endSecond = Number(currentTime.toFixed(2));

      // Roll the segment over once it is long enough that keeping it open
      // would make a single request exceed the batch budget.
      const span = Math.max(0, this.current!.endSecond - this.current!.startSecond);
      if (span >= ACTIVE_SEGMENT_MAX_CONTENT_SECONDS) {
        this.closeActiveSegment();
        this.startNewSegment(currentTime, "rollover");
      }
    } else if (delta < 0) {
      // Rewind: the learner went back. Close the segment and start a new one
      // at the new position so the range union stays correct.
      this.closeActiveSegment();
      this.startNewSegment(currentTime, "rewind");
    }

    this.lastTime = currentTime;
    this.lastTickWall = now;
  }

  // ── Segment lifecycle ─────────────────────────────────────────────────

  private startNewSegment(startSecond: number, source: SegmentSource): void {
    this.sequence += 1;
    this.segmentStartWall = this.now();
    this.current = {
      startSecond: Number(startSecond.toFixed(2)),
      endSecond: Number(startSecond.toFixed(2)),
      playbackRate: this.playbackRate,
      source,
      clientSegmentId: this.mintId(),
      playerInstanceId: this.options.playerInstanceId,
      clientSequence: this.sequence,
      wallClockSeconds: 0,
      segmentStartedAt: new Date(this.segmentStartWall).toISOString(),
      segmentEndedAt: new Date(this.segmentStartWall).toISOString(),
    };
  }

  /**
   * Close the active segment and hand it to the persistence layer.
   *
   * If the segment made no forward progress it is still emitted, with a
   * minimal one-hundredth-of-a-second span, so that "played but nothing
   * advanced" is distinguishable from "never played".
   */
  closeActiveSegment(): Segment | null {
    const seg = this.current;
    if (!seg) return null;

    const now = this.now();

    if (seg.endSecond <= seg.startSecond) {
      const wall = (now - this.segmentStartWall) / 1000;
      const fallback = Math.max(
        this.lastTime,
        seg.startSecond + 0.01,
        seg.startSecond + wall * seg.playbackRate,
      );
      seg.endSecond = Number(fallback.toFixed(2));
    }

    seg.wallClockSeconds = Number(((now - this.segmentStartWall) / 1000).toFixed(2));
    seg.segmentEndedAt = new Date(now).toISOString();

    const clamped = clampSegmentToPlausibleWall(seg);
    this.current = null;
    this.events.onSegment(clamped);
    return clamped;
  }

  /**
   * A durable snapshot of the in-flight segment, for crash recovery.
   *
   * This writes to the local outbox only — never to the network. Its job is
   * to bound how much watch time a hard crash can cost.
   *
   * Note the deliberate difference from the network path: the checkpoint uses
   * its *own* segment id suffix. If it reused the segment's id, then a
   * checkpoint that was accepted by the server followed by the full segment
   * would be treated as a duplicate and dropped — under-counting. A separate
   * id makes the checkpoint a distinct piece of evidence, and the union
   * absorbs the overlap.
   */
  checkpoint(): Segment | null {
    const seg = this.current;
    if (!seg) return null;

    const progressed = this.lastTime - seg.startSecond;
    if (progressed < 0.3) return null;

    const now = this.now();
    return {
      ...seg,
      endSecond: Number(this.lastTime.toFixed(2)),
      wallClockSeconds: Number(((now - this.segmentStartWall) / 1000).toFixed(2)),
      segmentEndedAt: new Date(now).toISOString(),
      clientSegmentId: `${seg.clientSegmentId}_cp`,
    };
  }
}

/**
 * Shrink a segment whose content span exceeds what its wall clock could
 * possibly support.
 *
 * This is the last line of defence before evidence is persisted. A segment
 * claiming 60 seconds of content while only 10 seconds of real time passed
 * is clamped to what 10 seconds at the stated rate actually permits.
 */
export function clampSegmentToPlausibleWall(segment: Segment): Segment {
  const wall = Number(segment.wallClockSeconds) || 0;
  const rate = Number(segment.playbackRate) || 1;
  if (wall <= 0) return segment;

  const span = Math.max(0, segment.endSecond - segment.startSecond);
  const maxSpan = wall * rate * WATCH_TIME_PLAUSIBILITY_TOLERANCE;
  if (span <= maxSpan) return segment;

  return {
    ...segment,
    endSecond: Number((segment.startSecond + maxSpan).toFixed(2)),
  };
}

/**
 * Build a batch that respects both batch limits at once: at most 50 segments
 * and at most 120 seconds of content.
 *
 * The first segment does not get to bypass the content limit. A greedy
 * implementation that lets the first item through unconditionally will
 * produce a first request that the server rejects, which costs a round trip
 * and delays every segment behind it.
 */
export function takeSafeHeartbeatChunk(
  segments: WatchSegmentInput[],
  maxSegments = 50,
  maxContentSeconds = 120,
): NormalizedWatchSegment[] {
  const chunk: NormalizedWatchSegment[] = [];
  let contentSeconds = 0;

  for (const raw of segments) {
    if (chunk.length >= maxSegments) break;

    const segment = normalizeWatchSegment(raw);
    const segmentSeconds = Math.max(0, segment.endSecond - segment.startSecond);
    if (segmentSeconds <= 0) continue;

    if (contentSeconds + segmentSeconds > maxContentSeconds) break;

    chunk.push(segment);
    contentSeconds += segmentSeconds;
  }

  return chunk;
}
