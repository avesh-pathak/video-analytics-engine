/**
 * Broker bootstrap and the outbox relay.
 *
 * The relay is the piece that connects the transactional outbox to the
 * broker. It is deliberately simple and deliberately boring:
 *
 *   1. Read unpublished outbox rows, oldest first.
 *   2. Publish each to the broker, keyed by the subject scope so that all
 *      events for one subject land on one partition and stay ordered.
 *   3. Mark the row published.
 *
 * The ordering matters. The row is marked published *after* the publish
 * returns. If the process dies in between, the event is published twice
 * rather than not at all — and publishing twice is safe, because the
 * consumer is idempotent. The opposite ordering would lose events, which is
 * not safe at all.
 *
 * This is the "at-least-once" half of the contract. The "once" half is
 * enforced at the database, by the unique index on the segment identity.
 * The two halves live in different places on purpose.
 */

import { MemoryBroker } from "../engine/broker/memory.js";
import type { Broker } from "../engine/broker/types.js";
import { getDb, transaction } from "./db.js";
import { applySchema } from "./schema.js";
import { drainOutbox, markOutboxPublished } from "./repository.js";

declare global {
  // eslint-disable-next-line no-var
  var __videoAnalyticsBroker: Broker | undefined;
  // eslint-disable-next-line no-var
  var __videoAnalyticsRelay: NodeJS.Timeout | undefined;
}

/**
 * The broker instance.
 *
 * Kafka is used when `KAFKA_BROKERS` is set; otherwise the in-process
 * broker. The import is dynamic so `kafkajs` stays an optional dependency —
 * a project that has not installed it still runs.
 */
export function getBroker(): Broker {
  if (globalThis.__videoAnalyticsBroker) return globalThis.__videoAnalyticsBroker;

  const brokers = process.env.KAFKA_BROKERS?.split(",").filter(Boolean);

  if (brokers && brokers.length > 0) {
    // Lazily constructed; the Kafka client is only touched on first use.
    let instance: Broker | null = null;
    globalThis.__videoAnalyticsBroker = {
      publish: async (topic, key, value, headers) => {
        if (!instance) {
          const { KafkaBroker } = await import("../engine/broker/kafka.js");
          instance = new KafkaBroker({ brokers });
        }
        return instance.publish(topic, key, value, headers);
      },
      subscribe: (topic, groupId, handler) => {
        let unsubscribe: (() => void) | null = null;
        let cancelled = false;
        void (async () => {
          if (!instance) {
            const { KafkaBroker } = await import("../engine/broker/kafka.js");
            instance = new KafkaBroker({ brokers });
          }
          if (!cancelled) unsubscribe = instance.subscribe(topic, groupId, handler);
        })();
        return () => {
          cancelled = true;
          unsubscribe?.();
        };
      },
      peek: async (topic, groupId, fromOffset, limit) => {
        if (!instance) {
          const { KafkaBroker } = await import("../engine/broker/kafka.js");
          instance = new KafkaBroker({ brokers });
        }
        return instance.peek(topic, groupId, fromOffset, limit);
      },
      seek: async (topic, groupId, partition, offset) => {
        if (!instance) {
          const { KafkaBroker } = await import("../engine/broker/kafka.js");
          instance = new KafkaBroker({ brokers });
        }
        return instance.seek(topic, groupId, partition, offset);
      },
      commit: async (topic, groupId, partition, offset) => {
        if (!instance) {
          const { KafkaBroker } = await import("../engine/broker/kafka.js");
          instance = new KafkaBroker({ brokers });
        }
        return instance.commit(topic, groupId, partition, offset);
      },
      stats: async (topic, groupId) => {
        if (!instance) {
          const { KafkaBroker } = await import("../engine/broker/kafka.js");
          instance = new KafkaBroker({ brokers });
        }
        return instance.stats(topic, groupId);
      },
      deadLetter: async (topic, record, reason) => {
        if (!instance) {
          const { KafkaBroker } = await import("../engine/broker/kafka.js");
          instance = new KafkaBroker({ brokers });
        }
        return instance.deadLetter(topic, record, reason);
      },
      deadLetterRecords: async (topic) => {
        if (!instance) {
          const { KafkaBroker } = await import("../engine/broker/kafka.js");
          instance = new KafkaBroker({ brokers });
        }
        return instance.deadLetterRecords(topic);
      },
    };
    return globalThis.__videoAnalyticsBroker;
  }

  const memory = new MemoryBroker();
  memory.setPartitionCount(3);
  globalThis.__videoAnalyticsBroker = memory;
  return memory;
}

export const TOPIC_SEGMENTS = "video.segments";
export const PROJECTOR_GROUP = "va-projector";

/**
 * Start the relay.
 *
 * Called once at boot. The interval is short so the demo feels live, and
 * the drain is bounded so a large backlog does not monopolise the event
 * loop.
 */
export function startRelay(intervalMs = 500): void {
  if (globalThis.__videoAnalyticsRelay) return;

  const tick = async () => {
    try {
      const db = getDb();
      applySchema(db);
      const broker = getBroker();

      const rows = transaction((tx) => drainOutbox(tx, 100));
      for (const row of rows) {
        await broker.publish(row.topic, row.eventKey, JSON.parse(row.payload));
        markOutboxPublished(db, row.id);
      }
    } catch {
      // A relay failure must never take the process down. The outbox row
      // stays unpublished and the next tick picks it up.
    }
  };

  globalThis.__videoAnalyticsRelay = setInterval(() => void tick(), intervalMs);
  if (typeof globalThis.__videoAnalyticsRelay.unref === "function") {
    globalThis.__videoAnalyticsRelay.unref();
  }
}

export function stopRelay(): void {
  if (!globalThis.__videoAnalyticsRelay) return;
  clearInterval(globalThis.__videoAnalyticsRelay);
  globalThis.__videoAnalyticsRelay = undefined;
}
