import Link from "next/link";

import { site } from "@/lib/site";

const layers = [
  {
    name: "Framework-free engine",
    path: "engine/",
    description:
      "TypeScript modules own segment state, validation policy, range arithmetic, projection updates and reconciliation. They do not import Next.js or a database driver.",
    files: "watch-math.ts · sanitize.ts · projection.ts · reconcile.ts",
  },
  {
    name: "Storage and delivery",
    path: "server/",
    description:
      "Node's built-in SQLite driver stores evidence, sessions, request claims, projections and outbox rows. Repository functions own the SQL; broker adapters share one interface.",
    files: "db.ts · schema.ts · repository.ts · broker.ts",
  },
  {
    name: "HTTP boundary",
    path: "app/api/analytics/",
    description:
      "Zod validates requests, server-owned session context is resolved, and the engine runs through the repository. Session, heartbeat, read and admin routes stay separate.",
    files: "session/route.ts · heartbeat/route.ts · read/route.ts · admin/route.ts",
  },
];

export function SystemOverview() {
  return (
    <section id="system" className="pt-[80px] sm:pt-[104px]">
      <div className="page-container">
        <div className="max-w-[760px]">
          <h2 className="text-h2 font-medium text-foreground">How the engine is built.</h2>
          <p className="mt-4 max-w-[65ch] text-base leading-7 text-muted-foreground">
            One Next.js application wraps a framework-free TypeScript engine and a local
            SQLite store. The browser supplies intervals, the server decides what counts,
            and the database keeps both the evidence and the derived answer. Playback and
            access control stay outside the engine; no video is uploaded.
          </p>
        </div>

        <div className="mt-10 divide-y divide-border border-t border-border">
          {layers.map((layer) => (
            <article
              key={layer.path}
              className="grid gap-3 py-6 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-8"
            >
              <div className="min-w-0">
                <h3 className="text-base font-medium text-foreground">{layer.name}</h3>
                <Link
                  href={`${site.links.github}/tree/main/${layer.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block break-words font-mono text-xs text-primary underline-offset-4 hover:underline"
                >
                  {layer.path}
                </Link>
              </div>
              <div className="min-w-0">
                <p className="text-sm leading-6 text-muted-foreground">{layer.description}</p>
                <p className="mt-2 break-words font-mono text-xs leading-5 text-muted-foreground">
                  {layer.files}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
          The full request, relay and read paths are in the system diagram under{" "}
          <Link
            href="#messages"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            the message layer
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
