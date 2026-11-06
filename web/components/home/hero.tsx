"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Clapperboard,
  LayoutDashboard,
  Play,
  ShieldCheck,
  Users,
} from "lucide-react";

import { HeroPreview, type PreviewTab } from "@/components/home/hero-preview";
import { GithubIcon } from "@/components/brand/social-icons";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const tools: {
  id: PreviewTab;
  label: string;
  caption: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "overview", label: "Overview", caption: "The number, at a glance", icon: LayoutDashboard },
  { id: "sessions", label: "Sessions", caption: "Evidence, event by event", icon: Users },
  { id: "content", label: "Content", caption: "What holds attention", icon: Clapperboard },
  { id: "quality", label: "Quality", caption: "Audit, repair, verify", icon: ShieldCheck },
];

export function Hero() {
  const [active, setActive] = React.useState<PreviewTab>("overview");
  const reduce = useReducedMotion();
  const activeTool = tools.find((tool) => tool.id === active) ?? tools[0];

  return (
    <section className="pt-[84px] sm:pt-[92px]">
      <div className="page-container">
        <div className="gradient-hero relative overflow-hidden rounded-[32px] border border-line/60 px-4 pb-0 pt-10 sm:rounded-[40px] sm:px-8 sm:pt-14 lg:px-[72px] lg:pt-14">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#39D47A]/50 to-transparent"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-24 top-16 size-[360px] rounded-full border border-white/30 bg-white/10 blur-2xl"
            aria-hidden="true"
          />

          <motion.div
            className="relative z-10 flex flex-col items-center text-center"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card/80 px-2 py-1.5 pr-3.5 text-[12px] font-medium text-muted-ink shadow-[0_1px_2px_rgba(13,15,13,0.04)] backdrop-blur">
              <span className="grid size-5 place-items-center rounded-full bg-mint text-green-deep">
                <ShieldCheck className="size-3" />
              </span>
              The watch-time engine
              <span className="h-3 w-px bg-line" />
              <span className="text-[11px] font-semibold text-green-deep">v1.0</span>
            </span>

            <h1 className="mt-6 max-w-[880px] text-hero font-medium text-ink">
              Every second counted.
              <br />
              Every number defended<span className="text-green">.</span>
            </h1>

            <p className="mt-5 max-w-[720px] text-[17px] leading-7 text-muted-ink sm:text-[19px] sm:leading-8">
              Watchline turns untrusted playback events into watch time your team can stand
              behind. Recomputed on the server, deduplicated twice, and reconciled against an
              append-only evidence log.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6 text-[15px]">
                <Link href="/architecture">
                  Read the architecture
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="h-12 px-6 text-[15px]">
                <Link href="https://github.com/avesh-pathak/video-analytics-engine" target="_blank" rel="noreferrer">
                  <GithubIcon className="size-4" />
                  View source
                </Link>
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {[
                ["10", "media events"],
                ["2", "dedupe layers"],
                ["0", "client totals trusted"],
              ].map(([value, label]) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card/55 px-3 py-1.5 text-[11px] font-medium text-muted-ink backdrop-blur"
                >
                  <span className="font-semibold text-green-deep">{value}</span>
                  {label}
                </span>
              ))}
            </div>
          </motion.div>

          <div className="relative z-10 mt-9 flex items-center justify-center gap-2.5 sm:gap-3">
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              const selected = active === tool.id;
              return (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={tool.label}
                      aria-pressed={selected}
                      onClick={() => setActive(tool.id)}
                      className={cn(
                        "relative grid size-[52px] place-items-center rounded-[18px] border transition-[background-color,border-color,box-shadow,transform] duration-200 ease-soft sm:size-14",
                        selected
                          ? "border-mint bg-mint text-green-deep shadow-[0_0_0_4px_rgba(255,255,255,0.72),0_8px_18px_rgba(48,166,109,0.14)] dark:shadow-[0_0_0_4px_rgba(11,13,12,0.8),0_8px_18px_rgba(0,0,0,0.3)]"
                          : "border-line bg-card/85 text-muted-ink backdrop-blur hover:-translate-y-0.5 hover:bg-card hover:shadow-[0_8px_18px_rgba(15,15,26,0.06)]",
                      )}
                    >
                      <Icon className="size-[19px] sm:size-[21px]" />
                      {selected ? (
                        <span
                          className="absolute -bottom-[9px] left-1/2 h-[9px] w-4 -translate-x-1/2 rounded-b-[5px] bg-card"
                          style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
                          aria-hidden="true"
                        />
                      ) : null}
                      <span className="sr-only">{tool.caption}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span className="font-semibold">{tool.label}</span>
                    <span className="ml-1.5 text-white/60">{tool.caption}</span>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          <motion.div
            className="relative z-10 mt-4"
            initial={reduce ? false : { opacity: 0, y: 26 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.16, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="gradient-showcase relative overflow-hidden rounded-t-[26px] px-2.5 pb-0 pt-12 sm:px-4 sm:pt-14 lg:px-6">
              <div className="absolute left-4 top-3.5 z-10 inline-flex items-center gap-1.5 rounded-full border border-line/60 bg-card/80 px-2.5 py-1.5 text-[10px] font-semibold text-green-deep shadow-[0_1px_2px_rgba(15,15,26,0.04)] backdrop-blur sm:left-6 sm:top-4 sm:text-[11px]">
                <span className="grid size-4 place-items-center rounded-full bg-mint">
                  <Play className="size-2 fill-green-deep text-green-deep" />
                </span>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={activeTool.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.22 }}
                  >
                    {activeTool.label}
                  </motion.span>
                </AnimatePresence>
                <span className="hidden font-normal text-muted-ink sm:inline">
                  · {activeTool.caption}
                </span>
              </div>
              <div className="absolute right-4 top-3.5 z-10 hidden items-center gap-1.5 rounded-full border border-line/60 bg-card/65 px-2.5 py-1.5 text-[10px] font-medium text-muted-ink backdrop-blur sm:right-6 sm:top-4 sm:inline-flex">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-55" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-green" />
                </span>
                Interactive preview
              </div>

              <div className="overflow-hidden rounded-t-[20px] border border-line bg-card shadow-[0_-1px_0_rgba(255,255,255,0.5),0_28px_60px_rgba(15,15,26,0.17)]">
                <div className="flex h-9 items-center gap-2.5 border-b border-line bg-card px-3.5">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((dot) => (
                      <span key={dot} className="size-[6px] rounded-full bg-line" />
                    ))}
                  </div>
                  <div className="flex h-6 flex-1 items-center gap-1.5 rounded-md bg-surface-muted px-2.5 text-[8.5px] text-subtle-ink">
                    <ShieldCheck className="size-2.5 text-green" />
                    <span className="truncate">app.watchline.dev / {active}</span>
                  </div>
                  <span className="hidden items-center gap-1 text-[8px] font-medium text-green-deep sm:inline-flex">
                    <span className="size-1.5 rounded-full bg-green" />
                    Preview
                  </span>
                  <span className="hidden size-5 place-items-center rounded-full border border-line text-subtle-ink sm:grid">
                    <ArrowUpRight className="size-2.5" />
                  </span>
                </div>
                <div className="h-[440px] overflow-hidden sm:h-[452px]">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={active}
                      initial={reduce ? false : { opacity: 0, y: 18 }}
                      animate={reduce ? undefined : { opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0, y: -14 }}
                      transition={{ duration: 0.42, ease: [0.33, 1, 0.68, 1] }}
                      className="h-full"
                    >
                      <HeroPreview tab={active} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
