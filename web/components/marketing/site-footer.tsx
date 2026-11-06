import Link from "next/link";
import { ArrowUpRight, CircleDot } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { GithubIcon, LinkedinIcon } from "@/components/brand/social-icons";
import { site } from "@/lib/site";

const columns = [
  { label: "Product", links: site.footer.product },
  { label: "Engine", links: site.footer.engine },
  { label: "Connect", links: site.footer.connect },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-[120px] overflow-hidden rounded-t-[40px] border-t border-line gradient-footer">
      <div className="page-container pb-0 pt-14">
        <div className="flex flex-col justify-between gap-10 border-b border-line pb-12 lg:flex-row">
          <div className="max-w-[360px]">
            <Logo />
            <p className="mt-4 text-sm leading-6 text-muted-ink">
              Watch-time analytics for teams whose numbers need to survive an audit.
              Built on an append-only evidence log, one authoritative calculation, and
              a projection that can always be rebuilt.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-green-bright/20 bg-mint px-3 py-1.5 text-[11px] font-semibold text-green-deep">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-green" />
              </span>
              All systems operational
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-3 lg:gap-x-16">
            {columns.map((column) => (
              <div key={column.label}>
                <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle-ink">{column.label}</h3>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("http") || link.href.startsWith("mailto") ? (
                        <Link href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noreferrer" : undefined} className="group inline-flex items-center gap-1 text-sm text-muted-ink transition-colors hover:text-ink">
                          {link.label}
                          {link.href.startsWith("http") ? <ArrowUpRight className="size-3 text-subtle-ink transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /> : null}
                        </Link>
                      ) : (
                        <Link href={link.href} className="text-sm text-muted-ink transition-colors hover:text-ink">{link.label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-6">
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
            <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-[11px] font-medium text-muted-ink">
              <CircleDot className="size-3 shrink-0 text-green" />
              UI demo · deterministic sample data
            </span>
            <span className="inline-flex max-w-full items-center rounded-full border border-line bg-card px-3 py-1.5 text-[11px] font-medium text-muted-ink">4 invariants · 2 layers · 0 trust in the client</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={site.links.github} target="_blank" rel="noreferrer" aria-label="GitHub repository" className="grid size-9 place-items-center rounded-full border border-line bg-card text-body transition hover:-translate-y-px hover:bg-mint-soft hover:text-green-deep"><GithubIcon className="size-4" /></Link>
            <Link href={site.links.linkedin} target="_blank" rel="noreferrer" aria-label="Avesh Pathak on LinkedIn" className="grid size-9 place-items-center rounded-full border border-line bg-card text-body transition hover:-translate-y-px hover:bg-mint-soft hover:text-green-deep"><LinkedinIcon className="size-4" /></Link>
            <Link href={site.links.portfolio} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-card px-3.5 text-xs font-semibold text-body transition hover:-translate-y-px hover:bg-mint-soft hover:text-green-deep">avesh.tech <ArrowUpRight className="size-3" /></Link>
          </div>
        </div>
      </div>

      <div className="page-container">
        <div className="[container-type:inline-size]">
          <div className="select-none whitespace-nowrap pt-4 text-center text-[min(23cqw,282px)] font-semibold leading-[0.74] tracking-[-0.07em] text-gradient-ink" aria-hidden="true">Watchline</div>
        </div>
      </div>

      <div className="page-container flex flex-col gap-2 border-t border-line py-5 text-[11px] tracking-[0.02em] text-subtle-ink sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 Watchline. A UI concept for the video analytics engine.</span>
        <span>
          Built by{" "}
          <Link href={site.links.linkedin} target="_blank" rel="noreferrer" className="font-medium text-muted-ink underline-offset-4 hover:text-ink hover:underline">Avesh Pathak</Link>
          {" · "}
          <Link href={site.links.portfolio} target="_blank" rel="noreferrer" className="font-medium text-muted-ink underline-offset-4 hover:text-ink hover:underline">avesh.tech</Link>
        </span>
      </div>
    </footer>
  );
}
