/**
 * Two layers of idempotency.
 *
 * Idempotency is not one mechanism — it is two, solving two different
 * problems, and you need both.
 *
 *   LAYER 1 — REQUEST KEY ("was this exact HTTP request already applied?")
 *
 *     A network layer will retry. A proxy will retry. `sendBeacon` on page
 *     unload may deliver the same body twice. If the server applied a write
 *     twice, the numbers are wrong.
 *
 *     The key is a client-generated `Idempotency-Key` header. The server
 *     claims it in a table with a UNIQUE primary key *before* the write. The
 *     second arrival hits the unique constraint and is answered with a
 *     "already applied" acknowledgement instead of a write.
 *
 *     This is short-lived (60s TTL) and deliberately *not* the durable
 *     guarantee. It only covers near-simultaneous retries.
 *
 *   LAYER 2 — SEGMENT IDENTITY ("have I already counted this piece of
 *   evidence?")
 *
 *     The stronger problem. A client can be offline for an hour, accumulate
 *     300 segments, and then replay them — possibly under a *different*
 *     session id, because the session expired while it was offline. The
 *     request key would be different, so layer 1 would not catch it.
 *
 *     Every segment carries a `clientSegmentId` minted once when the segment
 *     is created. A UNIQUE index over `(student, subject_scope,
 *     clientSegmentId)` makes the database itself refuse the second insert.
 *     The segment identity is deliberately **session-independent**, so the
 *     dedup survives a session change.
 *
 * The rule that makes layer 2 safe: a duplicate row is *marked*, never
 * deleted. It is preserved for audit and excluded from all watch-time math
 * via a `dedupe_excluded` flag. Deleting evidence destroys the ability to
 * explain why a number is what it is.
 *
 * Ordering matters. The claim is taken **after** the request has been parsed
 * and **immediately before** the write. A malformed request must not consume
 * the key, or the client's corrected retry could be answered with "already
 * done" — a cheerful success for a request that never happened.
 */

export type ClaimOutcome = "claimed" | "duplicate";

export interface Claim {
  outcome: ClaimOutcome;
  key: string;
  expiresAt: number;
}

/**
 * In-memory fallback used when the durable store is unavailable.
 *
 * Bounded, TTL-scoped, and process-local — it degrades the guarantee from
 * "cross-instance" to "cross-request-in-this-process" rather than removing it.
 */
const LOCAL_CLAIMS = new Map<string, number>();
const LOCAL_CLAIM_CAPACITY = 5_000;

function pruneLocalClaims(now: number): void {
  for (const [key, expiresAt] of LOCAL_CLAIMS) {
    if (expiresAt <= now) LOCAL_CLAIMS.delete(key);
  }
  if (LOCAL_CLAIMS.size > LOCAL_CLAIM_CAPACITY) {
    const excess = LOCAL_CLAIMS.size - LOCAL_CLAIM_CAPACITY;
    let removed = 0;
    for (const key of LOCAL_CLAIMS.keys()) {
      LOCAL_CLAIMS.delete(key);
      if (++removed >= excess) break;
    }
  }
}

/**
 * Claim a request key.
 *
 * `insertClaim` must perform a UNIQUE insert and report a conflict. The
 * storage adapter owns that; this function owns the policy around it.
 */
export async function claimRequest(
  key: string | null,
  sessionId: string,
  insertClaim: (key: string, sessionId: string, expiresAt: number) => "inserted" | "conflict",
  ttlMs: number,
): Promise<ClaimOutcome> {
  // No key means no request-level protection. This is not an error — some
  // transports cannot set headers. Segment-level dedup still applies.
  if (!key) return "claimed";

  const now = Date.now();
  const expiresAt = now + ttlMs;

  try {
    const result = insertClaim(key, sessionId, expiresAt);
    return result === "inserted" ? "claimed" : "duplicate";
  } catch {
    // Fail open on a storage error. Losing watch time because the dedup table
    // is briefly unavailable is worse than a rare double count, and the
    // segment-level index still catches the segment-level duplicates.
    return "claimed";
  }
}

/**
 * Release a claim after a failed write.
 *
 * Without this, a write that failed would suppress the client's genuine retry
 * for the whole TTL — and the evidence would be lost even though the client
 * did nothing wrong.
 */
export async function releaseRequest(
  key: string | null,
  deleteClaim: (key: string) => void,
): Promise<void> {
  if (!key) return;
  try {
    deleteClaim(key);
  } catch {
    // Best effort. The TTL bounds the damage.
  }
}

/** Local fallback claim, for deployments without a durable claim table. */
export function claimLocally(key: string, ttlMs: number): ClaimOutcome {
  const now = Date.now();
  pruneLocalClaims(now);
  const existing = LOCAL_CLAIMS.get(key);
  if (existing && existing > now) return "duplicate";
  LOCAL_CLAIMS.set(key, now + ttlMs);
  return "claimed";
}

/**
 * The scope key used for segment-level dedup.
 *
 * It mirrors the generated column in the storage layer:
 *
 *     subject_type || ':' || COALESCE(lesson_id, recording_id, 'unknown')
 *
 * The dedup identity is (student, scope, segment id) — session-independent by
 * design, so a replay under a new session still collapses.
 */
export function subjectScopeKey(input: {
  subjectType: string;
  subjectId: string | null;
}): string {
  return `${input.subjectType}:${input.subjectId ?? "unknown"}`;
}

/**
 * Decide which row wins when the same segment id appears more than once.
 *
 * Earliest `created_at` wins. This must match the storage layer's rule
 * exactly, or the read path and the write path disagree about which row is
 * canonical — which is precisely the class of bug that produced the drift the
 * repair engine exists to fix.
 */
export function dedupeSegmentWinners<T extends {
  studentId: string;
  subjectScope: string;
  clientSegmentId: string | null;
  dedupeExcluded: boolean;
  createdAt: number;
}>(rows: T[]): T[] {
  const seen = new Set<string>();
  const winners: T[] = [];

  for (const row of [...rows].sort((a, b) => a.createdAt - b.createdAt)) {
    if (row.dedupeExcluded) continue;
    if (!row.clientSegmentId) {
      // Legacy evidence with no identity — keep it, there is nothing to dedup.
      winners.push(row);
      continue;
    }
    const key = `${row.studentId}|${row.subjectScope}|${row.clientSegmentId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    winners.push(row);
  }

  return winners;
}
