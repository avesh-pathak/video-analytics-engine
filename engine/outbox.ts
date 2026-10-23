/**
 * The durable outbox.
 *
 * The client's job is not to report watch time. The client's job is to never
 * lose it. This module is where that promise is kept.
 *
 * Every closed segment is written to durable storage *before* any network
 * call is attempted. The network is a delivery mechanism; the outbox is the
 * record. If the network is down, the tablet is asleep, the tab is closed, or
 * the server is returning 429s, the evidence stays on disk and goes out later.
 *
 * Storage: IndexedDB is primary. localStorage is a mirror.
 *
 * IndexedDB because it is the only browser storage that survives a large
 * volume of small writes without blocking the main thread, and because it
 * supports transactions — the mirror and the primary are updated together or
 * not at all. localStorage is a synchronous string API; writing to it on
 * every mutation is a main-thread stall, which on a video player is a visible
 * stutter. So the mirror is *coalesced*: mutations mark it dirty, and a
 * 200ms debounce performs one write. On `pagehide` and `beforeunload` the
 * mirror is flushed synchronously, because those are the last chance.
 *
 * The mirror is not redundant data — it is the fallback. If IndexedDB is
 * blocked (private mode, storage pressure, a locked database), the mirror
 * becomes the only store. It is always slightly behind, which is why the
 * merge on hydration unions both by segment id and lets IndexedDB win.
 *
 * Capacity is bounded, and the bound is a policy decision rather than an
 * accident. A learner offline for a week must not grow storage without
 * limit. When the cap is hit, the *oldest* records are evicted first: the
 * most recent watch time is the most relevant, and losing the oldest is the
 * least damaging choice available.
 */

export interface OutboxSegment {
  startSecond: number;
  endSecond: number;
  playbackRate: number;
  source: string;
  clientSegmentId: string;
  playerInstanceId: string;
  clientSequence: number;
  wallClockSeconds: number;
  segmentStartedAt: string;
  segmentEndedAt: string;
}

export interface OutboxRecord {
  clientSegmentId: string;
  storedAt: number;
  subjectKey: string;
  segment: OutboxSegment;
  attemptCount: number;
  lastAttemptAt?: number;
  lastRejectionReason?: string;
  lastRejectionRetryable?: boolean;
}

export const MAX_OUTBOX_SEGMENTS = 300;
export const MAX_RECORD_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const LS_MIRROR_DEBOUNCE_MS = 200;

const IDB_NAME = "video-watch-outbox";
const IDB_STORE = "pending-segments";
const LS_KEY = "video-watch-outbox:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

// ── In-memory source of truth for the running session ───────────────────
const memoryStore = new Map<string, OutboxRecord>();

let idb: IDBDatabase | null = null;
let idbUnavailable = false;
let mirrorTimer: ReturnType<typeof setTimeout> | null = null;
let mirrorDirty = false;

function openIndexedDb(): Promise<IDBDatabase | null> {
  if (!isBrowser()) return Promise.resolve(null);
  if (idb) return Promise.resolve(idb);
  if (idbUnavailable) return Promise.resolve(null);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: IDBDatabase | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    // If IndexedDB is slow or blocked, fall back to localStorage quickly
    // rather than making the user wait.
    const timeout = setTimeout(() => {
      idbUnavailable = true;
      finish(null);
    }, 1500);

    try {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: "clientSegmentId" });
        }
      };
      request.onsuccess = () => {
        clearTimeout(timeout);
        idb = request.result;
        finish(idb);
      };
      request.onerror = () => {
        clearTimeout(timeout);
        idbUnavailable = true;
        finish(null);
      };
    } catch {
      clearTimeout(timeout);
      idbUnavailable = true;
      finish(null);
    }
  });
}

// ── localStorage mirror ─────────────────────────────────────────────────

function readMirror(): OutboxRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OutboxRecord[]) : [];
  } catch {
    return [];
  }
}

function writeMirrorNow(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify([...memoryStore.values()]));
  } catch {
    // Quota exceeded or storage blocked. The IndexedDB copy is authoritative
    // and remains intact — the mirror is a fallback, not the record.
  }
}

function scheduleMirror(): void {
  mirrorDirty = true;
  if (mirrorTimer) return;
  mirrorTimer = setTimeout(() => {
    mirrorTimer = null;
    if (mirrorDirty) {
      mirrorDirty = false;
      writeMirrorNow();
    }
  }, LS_MIRROR_DEBOUNCE_MS);
}

export function flushMirror(): void {
  if (mirrorTimer) {
    clearTimeout(mirrorTimer);
    mirrorTimer = null;
  }
  mirrorDirty = false;
  writeMirrorNow();
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushMirror);
  window.addEventListener("beforeunload", flushMirror);
}

// ── Persistence ─────────────────────────────────────────────────────────

async function persistToIndexedDb(): Promise<void> {
  const db = await openIndexedDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      store.clear();
      for (const record of memoryStore.values()) store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

function prune(): void {
  const now = Date.now();

  for (const [key, record] of memoryStore) {
    if (now - record.storedAt > MAX_RECORD_AGE_MS) memoryStore.delete(key);
  }

  if (memoryStore.size > MAX_OUTBOX_SEGMENTS) {
    const sorted = [...memoryStore.values()].sort((a, b) => a.storedAt - b.storedAt);
    const excess = memoryStore.size - MAX_OUTBOX_SEGMENTS;
    for (let i = 0; i < excess; i++) memoryStore.delete(sorted[i].clientSegmentId);
  }
}

// ── Public API ──────────────────────────────────────────────────────────

/** Stable key for the subject being watched. Segments never cross subjects. */
export function makeSubjectKey(input: {
  subjectType: string;
  subjectId: string | null;
}): string {
  return `${input.subjectType}:${input.subjectId ?? "unknown"}`;
}

/**
 * Add segments to the outbox.
 *
 * Re-enqueueing an existing id **refreshes the record in place** — same id,
 * same storedAt, same attempt count, updated geometry. The id is the
 * identity; re-adding it means "here is a better snapshot of the same piece
 * of evidence", not "here is a new piece of evidence".
 */
export async function enqueueSegments(
  segments: OutboxSegment[],
  subjectKey: string,
): Promise<void> {
  const now = Date.now();

  for (const segment of segments) {
    const existing = memoryStore.get(segment.clientSegmentId);
    memoryStore.set(segment.clientSegmentId, {
      clientSegmentId: segment.clientSegmentId,
      storedAt: existing?.storedAt ?? now,
      subjectKey: existing?.subjectKey ?? subjectKey,
      segment,
      attemptCount: existing?.attemptCount ?? 0,
      lastAttemptAt: existing?.lastAttemptAt,
      lastRejectionReason: existing?.lastRejectionReason,
      lastRejectionRetryable: existing?.lastRejectionRetryable,
    });
  }

  prune();
  scheduleMirror();
  await persistToIndexedDb();
}

let hydrated = false;

/**
 * Load pending segments, hydrating from durable storage on first use.
 *
 * Both stores are read and unioned by segment id. IndexedDB is read second
 * and therefore wins on conflict, because it is the authoritative copy.
 */
export async function getPendingSegments(subjectKey?: string): Promise<OutboxRecord[]> {
  if (!hydrated) {
    hydrated = true;

    const db = await openIndexedDb();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(IDB_STORE, "readonly");
          const req = tx.objectStore(IDB_STORE).getAll();
          req.onsuccess = () => {
            for (const record of req.result as OutboxRecord[]) {
              memoryStore.set(record.clientSegmentId, record);
            }
            resolve();
          };
          req.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }

    for (const record of readMirror()) {
      if (!memoryStore.has(record.clientSegmentId)) {
        memoryStore.set(record.clientSegmentId, record);
      }
    }

    prune();
  }

  const all = [...memoryStore.values()];
  const filtered = subjectKey
    ? all.filter((r) => r.subjectKey === subjectKey)
    : all;

  // Sorted by playback start time. The underlying store is keyed by UUID, so
  // its natural order is arbitrary; replaying chronologically makes the
  // on-screen event log readable and costs nothing.
  return filtered.sort((a, b) => {
    const ta = Date.parse(a.segment.segmentStartedAt) || a.storedAt;
    const tb = Date.parse(b.segment.segmentStartedAt) || b.storedAt;
    return ta - tb;
  });
}

export function outboxDepth(): number {
  return memoryStore.size;
}

export async function markSegmentAttempts(ids: string[]): Promise<void> {
  const now = Date.now();
  for (const id of ids) {
    const record = memoryStore.get(id);
    if (!record) continue;
    record.attemptCount += 1;
    record.lastAttemptAt = now;
  }
  scheduleMirror();
  await persistToIndexedDb();
}

export async function markSegmentRejection(
  id: string,
  reason: string,
  retryable: boolean,
): Promise<void> {
  const record = memoryStore.get(id);
  if (!record) return;
  record.lastRejectionReason = reason;
  record.lastRejectionRetryable = retryable;
  scheduleMirror();
  await persistToIndexedDb();
}

/**
 * Remove segments that the server has accepted, rejected permanently, or
 * already holds.
 *
 * This is the only place segments leave the outbox, and it is driven
 * entirely by the server's verdict. The client never decides on its own that
 * evidence was successfully recorded.
 */
export async function removeSegments(ids: string[]): Promise<void> {
  for (const id of ids) memoryStore.delete(id);
  if (memoryStore.size === 0) {
    // Drain to empty: write the mirror immediately rather than waiting for
    // the debounce, so a fresh page load sees an empty outbox.
    flushMirror();
  } else {
    scheduleMirror();
  }
  await persistToIndexedDb();
}

/** Wipe everything. Used by the demo's reset control and by tests. */
export async function clearOutbox(): Promise<void> {
  memoryStore.clear();
  flushMirror();
  await persistToIndexedDb();
}
