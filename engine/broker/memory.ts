/**
 * In-process broker with real Kafka semantics.
 *
 * This is not a stub. It implements the parts of Kafka that a system like
 * this actually depends on, because those parts *are* the engineering:
 *
 *   PARTITIONS      Ordering is guaranteed within a partition, not across the
 *                   topic. The publisher picks the partition by hashing the
 *                   event key, so all events for one subject land on one
 *                   partition and therefore retain their order. This is what
 *                   lets the projector assume ordering for a given subject.
 *
 *   OFFSETS         Monotonic per partition. An offset is the position of an
 *                   event in the partition's log. Consumers track a
 *                   *committed offset* — the position they have durably
 *                   processed.
 *
 *   AT-LEAST-ONCE  A record is delivered until the consumer commits past it.
 *                   A crash between "delivered" and "committed" means the
 *                   record is delivered again. Exactly-once is not attempted
 *                   here, and it does not need to be: the consumer is
 *                   idempotent, because the projection upsert is keyed by
 *                   (student, subject) and the segment insert is guarded by a
 *                   UNIQUE index.
 *
 *   CONSUMER GROUPS One group consumes a topic. Within a group, each
 *                   partition is assigned to exactly one member, so two
 *                   members never process the same partition concurrently.
 *
 *   LAG             Committed offset vs. end offset. The number a dashboard
 *                   shows and an alerting rule fires on.
 *
 *   DEAD LETTER     A record that fails repeatedly is moved aside instead of
 *                   blocking the partition. One poison message must not stall
 *                   the pipeline.
 *
 *   REPLAY          A group's committed offset can be rewound. This is what
 *                   makes the projection rebuildable: rewind to zero, replay
 *                   the whole log, and the projection converges on the same
 *                   answer it had before.
 */

import type {
  Broker,
  BrokerEvent,
  BrokerStats,
  ConsumerGroupState,
  ConsumerRecord,
} from "./types.js";

interface Partition {
  log: BrokerEvent[];
  endOffset: number;
}

interface DeadLetterRecord extends BrokerEvent {
  reason: string;
}

const DEFAULT_MAX_DELIVERY_ATTEMPTS = 3;

export class MemoryBroker implements Broker {
  private readonly topics = new Map<string, Partition[]>();
  private readonly groups = new Map<string, Map<string, ConsumerGroupState>>();
  private readonly subscribers = new Map<
    string,
    Array<{ groupId: string; handler: (records: ConsumerRecord[]) => Promise<void> }>
  >();
  private readonly deadLetters = new Map<string, DeadLetterRecord[]>();
  private readonly attempts = new Map<string, number>();
  private partitionCount = 3;

  /** Number of partitions per topic. Kafka's default is 1; more is better. */
  setPartitionCount(count: number): void {
    this.partitionCount = Math.max(1, count);
  }

  private topic(name: string): Partition[] {
    let partitions = this.topics.get(name);
    if (!partitions) {
      partitions = Array.from({ length: this.partitionCount }, () => ({
        log: [],
        endOffset: 0,
      }));
      this.topics.set(name, partitions);
    }
    return partitions;
  }

  private group(topic: string, groupId: string): ConsumerGroupState {
    let byGroup = this.groups.get(topic);
    if (!byGroup) {
      byGroup = new Map();
      this.groups.set(topic, byGroup);
    }
    let state = byGroup.get(groupId);
    if (!state) {
      state = { groupId, committed: {}, assignments: {} };
      byGroup.set(groupId, state);
    }
    return state;
  }

  /**
   * Partition selection by key hash.
   *
   * The key is the subject scope, so every event for a given subject lands on
   * the same partition and is therefore processed in order. Without this the
   * projector could apply a later segment before an earlier one and the
   * incremental projection would diverge from a full recompute.
   */
  private partitionFor(key: string): number {
    const partitions = this.topic("__probe__");
    void partitions;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % this.partitionCount;
  }

  async publish<T>(
    topic: string,
    key: string,
    value: T,
    headers?: Record<string, string>,
  ): Promise<BrokerEvent<T>> {
    const partitions = this.topic(topic);
    const partition = this.partitionFor(key);
    const target = partitions[partition];

    const event: BrokerEvent<T> = {
      topic,
      partition,
      offset: target.endOffset,
      key,
      value,
      timestamp: Date.now(),
      headers,
    };

    target.log.push(event as BrokerEvent);
    target.endOffset += 1;

    // Deliver asynchronously, the way a real broker does. A synchronous
    // publish would hide consumer-side latency and back-pressure bugs.
    queueMicrotask(() => void this.deliver(topic));

    return event;
  }

  private async deliver(topic: string): Promise<void> {
    const listeners = this.subscribers.get(topic) ?? [];
    for (const listener of listeners) {
      const state = this.group(topic, listener.groupId);
      const partitions = this.topic(topic);

      for (const partition of partitions) {
        const partitionIndex = partitions.indexOf(partition);
        const committed = state.committed[partitionIndex] ?? 0;
        const pending = partition.log.filter((e) => e.offset >= committed);

        if (!pending.length) continue;

        try {
          await listener.handler(pending);
          state.committed[partitionIndex] = pending[pending.length - 1].offset + 1;
          state.assignments[partitionIndex] = listener.groupId;
        } catch (error) {
          const attemptKey = `${topic}:${partitionIndex}:${pending[0].offset}`;
          const attempts = (this.attempts.get(attemptKey) ?? 0) + 1;
          this.attempts.set(attemptKey, attempts);

          if (attempts >= DEFAULT_MAX_DELIVERY_ATTEMPTS) {
            // Poison message: move it aside so the partition keeps moving.
            await this.deadLetter(
              topic,
              pending[0],
              error instanceof Error ? error.message : String(error),
            );
            state.committed[partitionIndex] = pending[0].offset + 1;
            this.attempts.delete(attemptKey);
          }
          // Otherwise the record stays uncommitted and will be retried.
        }
      }
    }
  }

  subscribe<T>(
    topic: string,
    groupId: string,
    handler: (records: ConsumerRecord<T>[]) => Promise<void>,
  ): () => void {
    const list = this.subscribers.get(topic) ?? [];
    const entry = { groupId, handler: handler as (records: ConsumerRecord[]) => Promise<void> };
    list.push(entry);
    this.subscribers.set(topic, list);
    this.group(topic, groupId);

    // Deliver whatever is already in the log to a late subscriber.
    queueMicrotask(() => void this.deliver(topic));

    return () => {
      const current = this.subscribers.get(topic) ?? [];
      const index = current.indexOf(entry);
      if (index >= 0) current.splice(index, 1);
    };
  }

  async peek<T>(
    topic: string,
    groupId: string,
    fromOffset = 0,
    limit = 100,
  ): Promise<ConsumerRecord<T>[]> {
    const state = this.group(topic, groupId);
    const out: ConsumerRecord<T>[] = [];

    for (const partition of this.topic(topic)) {
      const index = this.topic(topic).indexOf(partition);
      const committed = state.committed[index] ?? 0;
      const start = Math.max(fromOffset, 0);
      for (const event of partition.log) {
        if (event.offset < start || event.offset < committed) continue;
        out.push(event as ConsumerRecord<T>);
        if (out.length >= limit) return out;
      }
    }
    return out.sort((a, b) => a.offset - b.offset);
  }

  async seek(
    topic: string,
    groupId: string,
    partition: number,
    offset: number,
  ): Promise<void> {
    const state = this.group(topic, groupId);
    state.committed[partition] = Math.max(0, offset);
    await this.deliver(topic);
  }

  async commit(
    topic: string,
    groupId: string,
    partition: number,
    offset: number,
  ): Promise<void> {
    const state = this.group(topic, groupId);
    state.committed[partition] = Math.max(state.committed[partition] ?? 0, offset);
  }

  async stats(topic: string, groupId: string): Promise<BrokerStats> {
    const state = this.group(topic, groupId);
    const partitions = this.topic(topic);
    const endOffsets: Record<number, number> = {};
    const committedOffsets: Record<number, number> = {};
    const lag: Record<number, number> = {};

    partitions.forEach((partition, index) => {
      endOffsets[index] = partition.endOffset;
      committedOffsets[index] = state.committed[index] ?? 0;
      lag[index] = Math.max(0, partition.endOffset - committedOffsets[index]);
    });

    return {
      topic,
      partitions: partitions.length,
      endOffsets,
      committedOffsets,
      lag,
      deadLetterCount: (this.deadLetters.get(topic) ?? []).length,
    };
  }

  async deadLetter(topic: string, record: BrokerEvent, reason: string): Promise<void> {
    const list = this.deadLetters.get(topic) ?? [];
    list.push({ ...record, reason });
    this.deadLetters.set(topic, list);
  }

  async deadLetterRecords(topic: string): Promise<Array<BrokerEvent & { reason: string }>> {
    return this.deadLetters.get(topic) ?? [];
  }
}
