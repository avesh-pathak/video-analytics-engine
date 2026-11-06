import Link from "next/link";
import { ArrowLeft, ArrowRight, Play, ShieldQuestion, Waypoints } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="pt-[84px] sm:pt-[92px]">
          <div className="page-container">
            <div className="gradient-hero relative overflow-hidden rounded-[32px] border border-line/60 px-5 py-12 sm:rounded-[40px] sm:px-8 sm:py-16 lg:px-14">
              <div
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#39D47A]/50 to-transparent"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -left-24 top-16 size-[360px] rounded-full border border-white/20 bg-white/10 blur-2xl"
                aria-hidden="true"
              />

              <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
                <div className="max-w-[480px]">
                  <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-2 py-1.5 pr-3.5 text-[11px] font-medium text-muted-ink backdrop-blur">
                    <span className="grid size-5 place-items-center rounded-full bg-mint text-green-deep">
                      <ShieldQuestion className="size-3" />
                    </span>
                    Missing evidence
                    <span className="h-3 w-px bg-line" />
                    <span className="font-mono text-[9px] text-subtle-ink">404</span>
                  </span>
                  <h1 className="mt-6 text-hero font-medium text-ink">
                    This second
                    <br />
                    never happened<span className="text-green">.</span>
                  </h1>
                  <p className="mt-5 max-w-[430px] text-[16px] leading-7 text-muted-ink">
                    The page you asked for is not in the evidence log. It may have moved,
                    or it may never have existed. Either way, we are not going to invent it.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-2.5">
                    <Button asChild>
                      <Link href="/">
                        <ArrowLeft className="size-4" />
                        Back to overview
                      </Link>
                    </Button>
                    <Button asChild variant="secondary">
                      <Link href="/architecture">
                        Read the architecture
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-[10px] text-subtle-ink">
                    <Waypoints className="size-3.5" />
                    Error 404 · no matching route in the evidence log
                  </div>
                </div>

                <div className="relative mx-auto w-full max-w-[520px]">
                  <div className="absolute -right-3 -top-3 z-20 hidden items-center gap-2 rounded-2xl border border-line bg-card/90 px-3 py-2 shadow-soft backdrop-blur sm:flex">
                    <span className="grid size-6 place-items-center rounded-full bg-mint text-green-deep">
                      <LogoMark className="h-3 w-3.5" />
                    </span>
                    <div>
                      <div className="text-[7px] uppercase tracking-[0.1em] text-subtle-ink">
                        Integrity check
                      </div>
                      <div className="text-[9.5px] font-semibold text-ink">No fabricated page</div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-line bg-card shadow-deep">
                    <div className="flex h-9 items-center gap-2.5 border-b border-line bg-card px-3.5">
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((dot) => (
                          <span key={dot} className="size-[6px] rounded-full bg-line" />
                        ))}
                      </div>
                      <div className="flex h-6 flex-1 items-center gap-1.5 rounded-md bg-surface-muted px-2.5 font-mono text-[8.5px] text-subtle-ink">
                        <span className="size-1.5 rounded-full bg-danger" />
                        watchline / route-not-found
                      </div>
                    </div>

                    <div className="bg-surface-soft p-4 sm:p-5">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-subtle-ink">
                          <Play className="size-3 text-green" />
                          Evidence lookup
                        </span>
                        <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[8px] font-semibold text-danger">
                          0 rows
                        </span>
                      </div>

                      <div className="mt-4 rounded-2xl border border-line bg-card p-4 text-center">
                        <div className="text-[84px] font-semibold leading-none tracking-[-0.08em] text-ink sm:text-[110px]">
                          404
                        </div>
                        <div className="mt-2 font-mono text-[9px] text-subtle-ink">
                          SELECT * FROM pages WHERE route = ?
                        </div>
                        <div className="mx-auto mt-4 h-2 w-full max-w-[280px] overflow-hidden rounded-full bg-surface-strong">
                          <div className="h-full w-[37%] rounded-full bg-danger/50" />
                        </div>
                        <div className="mt-2 flex items-center justify-center gap-1.5 text-[8px] text-muted-ink">
                          <span className="size-1.5 rounded-full bg-danger" />
                          no evidence returned
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {[
                          ["Route", "missing"],
                          ["Retries", "0"],
                          ["Invented", "0"],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-xl border border-line bg-card p-2.5">
                            <div className="text-[6.5px] uppercase tracking-[0.07em] text-subtle-ink">
                              {label}
                            </div>
                            <div className="mt-0.5 text-[10px] font-semibold text-ink">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-line px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[8px] text-subtle-ink">
                        <span className="size-1.5 rounded-full bg-green" />
                        Engine healthy
                      </span>
                      <Link
                        href="/"
                        className="inline-flex items-center gap-1 text-[8.5px] font-semibold text-green-deep hover:underline"
                      >
                        Return home
                        <ArrowRight className="size-2.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
