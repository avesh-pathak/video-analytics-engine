/**
 * The broker interface.
 *
 * The system writes evidence to a store and publishes change events to a
 * broker. The broker is what makes the system *scaleable* rather than merely
 * *working*: the projection is a consumer, not a side effect of a request
 * handler, so the read path and the write path can be deployed, tuned and
 * failed independently.
 *
 * Two implementations satisfy this interface:
 *
 *   MemoryBroker  — in-process, zero infrastructure, used by default and by
 *                   the test suite. It is not a mock: it implements real
 *                   partition assignment, monotonic offsets, consumer groups,
 *                   at-least-once delivery, a dead-letter queue, lag
 *                   accounting and offset replay.
 *
 *   KafkaBroker   — the same semantics over Apache Kafka via `kafkajs`.
 *
 * The demo never requires a Kafka broker to be installed, because the
 * guarantee this system actually needs — that a segment is counted once — is
 * enforced by a UNIQUE index in the store, not by the broker. The broker
 * controls *when the projection updates*, not *whether a segment counts*.
 */

export interface BrokerEvent<T = unknown> {
  topic: string;
  partition: number;
  offset: number;
  key: string;
  value: T;
  timestamp: number;
  headers?: Record<string, string>;
}

export interface ConsumerRecord<T = unknown> extends BrokerEvent<T> {}

export interface ConsumerGroupState {
  groupId: string;
  /** partition -> committed offset */
  committed: Record<number, number>;
  /** partition -> member id */
  assignments: Record<number, string>;
}

export interface BrokerStats {
  topic: string;
  partitions: number;
  /** High-water mark per partition: the next offset that would be written. */
  endOffsets: Record<number, number>;
  /** Committed offset per partition for the given group. */
  committedOffsets: Record<number, number>;
  /** Committed - end. Zero means fully caught up. */
  lag: Record<number, number>;
  deadLetterCount: number;
}

export interface Broker {
  publish<T>(
    topic: string,
    key: string,
    value: T,
    headers?: Record<string, string>,
  ): Promise<BrokerEvent<T>>;

  subscribe<T>(
    topic: string,
    groupId: string,
    handler: (records: ConsumerRecord<T>[]) => Promise<void>,
  ): () => void;

  /**
   * Read committed records for a group without consuming them.
   * Used by the demo's "replay from offset" control.
   */
  peek<T>(
    topic: string,
    groupId: string,
    fromOffset?: number,
    limit?: number,
  ): Promise<ConsumerRecord<T>[]>;

  /** Move a group's committed offset. Used to rewind and replay. */
  seek(topic: string, groupId: string, partition: number, offset: number): Promise<void>;

  /** Acknowledge records up to an offset. */
  commit(topic: string, groupId: string, partition: number, offset: number): Promise<void>;

  stats(topic: string, groupId: string): Promise<BrokerStats>;

  /** Move a message to the dead-letter queue after repeated failures. */
  deadLetter(topic: string, record: BrokerEvent, reason: string): Promise<void>;

  deadLetterRecords(topic: string): Promise<Array<BrokerEvent & { reason: string }>>;
}
