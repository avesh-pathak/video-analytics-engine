/**
 * Storage layer — SQLite via Node's built-in `node:sqlite`.
 *
 * Why no external database:
 *
 *   The interesting guarantees in this system are enforced by the *store*,
 *   not by the framework. The segment dedup is a UNIQUE index. The atomic
 *   multi-table write is a transaction. Both are available from SQLite, and
 *   SQLite ships with Node 24 — so the whole system runs from a file with
 *   zero installation, zero credentials and zero containers.
 *
 *   `node:sqlite` is a real SQLite build compiled into Node. It supports
 *   transactions, partial and expression indexes, `ON CONFLICT DO NOTHING`,
 *   `RETURNING`, and foreign keys. Nothing in the engine depends on a
 *   server-side extension.
 *
 * Configuration that matters:
 *
 *   WAL            Write-Ahead Logging lets readers proceed while a writer
 *                  holds the write lock. Without it, a long repair batch
 *                  blocks every read.
 *   busy_timeout   SQLite throws SQLITE_BUSY immediately by default. With a
 *                  timeout it waits for the lock instead. The repair engine
 *                  deliberately holds a write transaction while it works, and
 *                  the request path must not fail when that happens.
 *   foreign_keys   Off by default in SQLite, on by default in Postgres.
 *                  Explicitly enabled here so the two behave the same.
 *
 * The handle is cached on `globalThis` so Next.js hot-reload does not open a
 * new connection per module evaluation, and so a dev-server reload does not
 * trip the "database is locked" error that a naive implementation hits.
 */

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

export type SqliteDatabase = DatabaseSync;

declare global {
  // eslint-disable-next-line no-var
  var __videoAnalyticsDb: SqliteDatabase | undefined;
}

const DB_PATH = process.env.ANALYTICS_DB_PATH ?? path.join(process.cwd(), ".data", "analytics.db");

/**
 * Open (or reuse) the database handle.
 *
 * The singleton pattern is not a micro-optimisation. In a dev server, module
 * re-evaluation happens on every file change; opening a fresh connection
 * each time leaks file handles and eventually produces a locked database.
 */
export function getDb(): SqliteDatabase {
  if (globalThis.__videoAnalyticsDb) return globalThis.__videoAnalyticsDb;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const db = new DatabaseSync(DB_PATH);

  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA synchronous = NORMAL");

  globalThis.__videoAnalyticsDb = db;
  return db;
}

/**
 * Run a function inside a transaction.
 *
 * `BEGIN IMMEDIATE` takes the write lock up front rather than on first write.
 * With the default deferred begin, two transactions can both read, then both
 * try to upgrade to a write lock, and one gets SQLITE_BUSY — the classic
 * deferred-transaction deadlock. Taking the lock immediately avoids it.
 *
 * A nested call joins the outer transaction rather than starting a new one.
 * SQLite has no nested transactions, and a savepoint is not the right tool:
 * the inner failure should abort the whole unit of work, not just the inner
 * part.
 */
export function transaction<T>(fn: (db: SqliteDatabase) => T): T {
  const db = getDb();

  const inTransaction = db.prepare("SELECT 1 AS in_tx").get() !== undefined;
  if (inTransaction) return fn(db);

  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn(db);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // The transaction may already have been rolled back by SQLite.
    }
    throw error;
  }
}

/** Close the handle. Used by tests and by the reset script. */
export function closeDb(): void {
  if (!globalThis.__videoAnalyticsDb) return;
  try {
    globalThis.__videoAnalyticsDb.close();
  } catch {
    // Already closed.
  }
  globalThis.__videoAnalyticsDb = undefined;
}
