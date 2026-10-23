/**
 * Administrative operations on the projection.
 *
 * Three verbs, all built on the same framework-free repair engine:
 *
 *   GET  ?op=audit    read-only drift report
 *   POST ?op=repair   recompute and write, optionally dry-run
 *   POST ?op=rebuild  drop and rebuild every projection for one student
 *
 * The rebuild is the strongest operation here: it deletes the derived state
 * and reconstructs it from the evidence log. If the result matches what the
 * incremental path produced, the incremental path is correct. If it does
 * not, the incremental path has a bug — and this is the operation that finds
 * it.
 *
 * The repair is paged and resumable. It returns a cursor; the caller passes
 * it back to continue. That is what makes it safe to run against live data:
 * it holds at most one page of locks at a time and can be interrupted
 * without losing its place.
 */

import { NextResponse } from "next/server";
import { getDb } from "../../../../server/db.js";
import { applySchema } from "../../../../server/schema.js";
import { createReconcileStore } from "../../../../server/repository.js";
import {
  auditProjectionDrift,
  rebuildStudentProjections,
  repairProjections,
  type RepairSubject,
} from "../../../../engine/reconcile.js";
import { MemoryBroker } from "../../../../engine/broker/memory.js";
import { getBroker } from "../../../../server/broker.js";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const db = getDb();
  applySchema(db);

  const url = new URL(request.url);
  const op = url.searchParams.get("op") ?? "audit";

  try {
    if (op === "audit") {
      const store = createReconcileStore(db);
      const limit = Number(url.searchParams.get("limit") ?? 200);
      const report = await auditProjectionDrift(store, { limit });
      return NextResponse.json({ ok: true, op, report });
    }

    if (op === "broker") {
      const broker = getBroker();
      const topic = url.searchParams.get("topic") ?? "video.segments";
      const groupId = url.searchParams.get("groupId") ?? "va-projector";
      const stats = await broker.stats(topic, groupId);
      const deadLetters = await broker.deadLetterRecords(topic);
      return NextResponse.json({ ok: true, op, stats, deadLetters });
    }

    return NextResponse.json(
      { ok: false, error: `Unknown op: ${op}` },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const db = getDb();
  applySchema(db);

  const url = new URL(request.url);
  const op = url.searchParams.get("op") ?? "repair";

  try {
    const body = (await request.json().catch(() => ({}))) as {
      studentId?: string;
      limit?: number;
      dryRun?: boolean;
      apply?: boolean;
      cursor?: string | null;
    };

    const store = createReconcileStore(db);

    if (op === "repair") {
      const after = body.cursor ? decodeCursor(body.cursor) : null;
      const result = await repairProjections(store, {
        after,
        limit: body.limit ?? 200,
        dryRun: body.dryRun ?? true,
        apply: body.apply ?? false,
      });
      return NextResponse.json({
        ok: true,
        op,
        dryRun: body.dryRun ?? true,
        result: { ...result, nextCursor: encodeCursor(result.nextCursor) },
      });
    }

    if (op === "rebuild") {
      if (!body.studentId) {
        return NextResponse.json(
          { ok: false, error: "studentId is required for a rebuild." },
          { status: 400 },
        );
      }
      const result = await rebuildStudentProjections(store, body.studentId, {
        apply: body.apply ?? false,
      });
      return NextResponse.json({ ok: true, op, result });
    }

    if (op === "seek") {
      // Rewind a consumer group so the log is replayed. This is what turns
      // "the projection is rebuildable" from a claim into a demonstration.
      const broker = getBroker();
      const topic = url.searchParams.get("topic") ?? "video.segments";
      const groupId = url.searchParams.get("groupId") ?? "va-projector";
      const partition = Number(url.searchParams.get("partition") ?? 0);
      const offset = Number(url.searchParams.get("offset") ?? 0);
      await broker.seek(topic, groupId, partition, offset);
      return NextResponse.json({ ok: true, op, topic, groupId, partition, offset });
    }

    return NextResponse.json(
      { ok: false, error: `Unknown op: ${op}` },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * The cursor is opaque to the client.
 *
 * Encoding it means the shape of the keyset — which columns, in which
 * order — is an implementation detail of the store rather than a contract
 * the client has to know.
 */
function encodeCursor(key: string | null): string | null {
  if (!key) return null;
  return Buffer.from(key, "utf8").toString("base64url");
}

function decodeCursor(cursor: string): RepairSubject | null {
  try {
    const key = Buffer.from(cursor, "base64url").toString("utf8");
    const [studentId, subjectType, subjectId] = key.split("|");
    if (!studentId || !subjectType || !subjectId) return null;
    return { studentId, subjectType, subjectId, videoDurationSeconds: 0 };
  } catch {
    return null;
  }
}
