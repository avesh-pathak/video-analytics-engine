/**
 * The landing page.
 *
 * This is a static shell. The engine and its API are the product; there is no
 * embedded player here, and the page never loads media or provider data. The
 * client half of the engine lives in `engine/segment-machine.ts` and can be
 * driven by any media element that emits the ten standard events.
 */

export default function Home() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Video Analytics Engine</p>
        <h1>The number is the product.</h1>
        <p style={{ maxWidth: "68ch", color: "var(--muted)", fontSize: "15px" }}>
          Watch-time analytics from an untrusted client over an at-least-once network.
          Watched seconds are recomputed server-side from raw segment ranges, ingest is
          idempotent at two levels, and reads come from a materialized projection that can
          be rebuilt from the log and repaired when it drifts.
        </p>
      </section>

      <div className="grid">
        <div className="card">
          <h3>Client contract</h3>
          <p>
            Any media source that emits <span className="mono">play</span>,{" "}
            <span className="mono">playing</span>, <span className="mono">timeupdate</span>,{" "}
            <span className="mono">pause</span>, <span className="mono">seeking</span>,{" "}
            <span className="mono">seeked</span>, <span className="mono">ratechange</span>,{" "}
            <span className="mono">ended</span>, <span className="mono">waiting</span> and{" "}
            <span className="mono">stalled</span> can drive{" "}
            <span className="mono">engine/segment-machine.ts</span>. The engine imports no
            player SDK, embeds no iframe, and fetches no media or provider data.
          </p>
        </div>

        <div className="card">
          <h3>Write path</h3>
          <p>
            Segments are validated against server-owned bounds, deduplicated by a unique
            index, and written with the projection and the outbox row in one transaction.
          </p>
          <p className="mono" style={{ marginTop: "14px", color: "var(--muted)" }}>
            POST /api/analytics/heartbeat
            <br />
            Idempotency-Key: &lt;uuid&gt;
            <br />
            200 accepted=3 duplicate=0 rejected=0
          </p>
        </div>

        <div className="card">
          <h3>Metrics</h3>
          <p>
            <strong>unique</strong> — union of ranges, clipped to duration.
            <br />
            <strong>total</strong> — plain sum, repeats included.
            <br />
            <strong>engaged</strong> — real time, paused excluded.
            <br />
            <strong>completion</strong> — unique / duration, 66% threshold.
          </p>
        </div>

        <div className="card">
          <h3>Operations</h3>
          <p>
            <span className="mono">GET /api/analytics/admin?op=audit</span>
            <br />
            <span className="mono">POST ?op=repair</span>
            <br />
            <span className="mono">POST ?op=rebuild</span>
            <br />
            <span className="mono">GET ?op=broker</span>
          </p>
        </div>
      </div>

      <section className="card" style={{ marginTop: "20px" }}>
        <h3>Architecture write-up</h3>
        <p>
          The full diagram set, decision tables and the annotated failure matrix live in
          <span className="mono"> README.md</span>, with every diagram also rendered as
          a standalone image under <span className="mono">docs/diagrams/</span>.
        </p>
      </section>
    </main>
  );
}
