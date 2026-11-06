"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, MessageCircleQuestion } from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const categories = [
  {
    id: "engine",
    label: "The engine",
    questions: [
      {
        q: "What exactly does Watchline measure?",
        a: "Watchline measures watch-time evidence: raw playback ranges and the wall-clock time claimed for them. From that it derives four metrics: total watched, unique watched, rewatch, and engaged wall clock. Completion is unique watched divided by the authoritative duration.",
      },
      {
        q: "How is unique watch time calculated?",
        a: "The server merges every accepted range into a union, clips that union to the video duration, and sums it. A union can never be updated by addition, so the projection recomputes the merged ranges rather than adding a new segment to a stored total.",
      },
      {
        q: "What happens when a learner rewatches content?",
        a: "A rewatch increases total watched and engaged wall clock, but not unique watched if the same ranges were already seen. The difference between total and unique is reported as rewatch, so the repeat is visible without inflating reach.",
      },
      {
        q: "Can the projection be rebuilt from the log?",
        a: "Yes. The evidence log is append-only and is the source of truth. The projection is a materialized cache. You can drop it, rebuild it from evidence, and compare the result with the prior projection using the audit path.",
      },
    ],
  },
  {
    id: "trust",
    label: "Trust & accuracy",
    questions: [
      {
        q: "Do you trust the client's watched-seconds number?",
        a: "No. The client never sends a watched-seconds total that the engine accepts. It sends raw ranges plus wall-clock evidence. The server validates segment bounds, playback-rate limits, wall-clock plausibility and batch budgets, then recomputes every metric itself.",
      },
      {
        q: "What stops duplicate events from inflating the number?",
        a: "Two independent layers. A unique idempotency key makes a whole request harmless to replay. A unique segment identity — student, scope, and client segment id — makes the same evidence harmless even if it returns under a different session id.",
      },
      {
        q: "What happens when events arrive late or offline?",
        a: "The client keeps a durable outbox in IndexedDB with a mirror. Delivery is at-least-once, so the engine assumes retries rather than hoping they never happen. The two dedupe layers turn repeated delivery into the same result.",
      },
      {
        q: "How do I know the dashboard is right?",
        a: "Every audit compares the projection against the append-only evidence log and reports the delta. If drift exists, a dry run shows the scope, a bounded repair applies it, and verification re-audits and returns the resulting delta. The UI shows the same agreement figure.",
      },
    ],
  },
  {
    id: "integration",
    label: "Integration",
    questions: [
      {
        q: "Which players are supported?",
        a: "Any media source that emits the standard events the segment machine listens to: play, playing, timeupdate, pause, seeking, seeked, ratechange, ended, waiting and stalled. That includes a plain HTML5 video element and most players built on top of one.",
      },
      {
        q: "Does Watchline upload or fetch my video?",
        a: "No. The engine never fetches media, catalog data or provider metadata. Playback stays outside the boundary. The client only sends evidence about the intervals it played, not the file itself.",
      },
      {
        q: "What does the client send?",
        a: "A heartbeat batch of playback ranges, each with its start and end second and the wall-clock time claimed for the interval, plus identity dimensions and a durable segment id. It does not send a summary that the server trusts.",
      },
      {
        q: "Is authentication part of the engine?",
        a: "No. Identity fields are dimensions of the evidence, not permission claims. A gateway or product layer can add authentication and authorization in front of the API without changing the measurement path. Access control answers who may watch; the engine answers what was watched.",
      },
    ],
  },
];

export function FaqSection() {
  const [activeCategory, setActiveCategory] = React.useState(categories[0].id);
  const reduce = useReducedMotion();
  const category = categories.find((item) => item.id === activeCategory) ?? categories[0];

  return (
    <section id="faq" className="pt-[104px] sm:pt-[120px]">
      <div className="page-container">
        <Reveal className="mx-auto max-w-[760px] text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-green-deep">
            07 / FAQ
          </span>
          <h2 className="mt-4 text-h2 font-medium text-ink">
            Questions with
            <br />
            real answers.
          </h2>
          <p className="mx-auto mt-4 max-w-[580px] text-[16px] leading-7 text-muted-ink sm:text-[17px]">
            The short version of the architecture. For the full contract, the repository
            is open.
          </p>
        </Reveal>

        <Reveal className="mt-10">
          <div className="grid gap-6 rounded-card border border-line bg-card p-3 shadow-card sm:p-4 lg:grid-cols-[245px_1fr] lg:gap-10 lg:p-6">
            <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {categories.map((item) => {
                const selected = item.id === activeCategory;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveCategory(item.id)}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center justify-between gap-4 rounded-2xl border px-3 py-3 text-left text-[12px] font-medium transition-colors duration-200 sm:text-[13px] lg:w-full lg:px-4 lg:py-3.5",
                      selected
                        ? "border-line bg-card text-ink shadow-[0_1px_2px_rgba(13,15,13,0.05)]"
                        : "border-transparent bg-transparent text-muted-ink hover:bg-mint-soft/60 hover:text-ink",
                    )}
                  >
                    {item.label}
                    <span
                      className={cn(
                        "hidden h-1.5 w-1.5 rounded-full lg:block",
                        selected ? "bg-green" : "bg-line",
                      )}
                    />
                  </button>
                );
              })}
              <div className="mt-auto hidden rounded-2xl bg-mint-soft p-4 lg:block">
                <span className="grid size-8 place-items-center rounded-full bg-card text-green-deep">
                  <MessageCircleQuestion className="size-4" />
                </span>
                <div className="mt-3 text-[12px] font-semibold text-ink">Still curious?</div>
                <p className="mt-1 text-[10.5px] leading-4 text-muted-ink">
                  The full failure matrix and API reference are in the repository.
                </p>
                <Link
                  href={site.links.github}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1 text-[10.5px] font-semibold text-green-deep underline-offset-4 hover:underline"
                >
                  Open GitHub
                  <ArrowUpRight className="size-3" />
                </Link>
              </div>
            </div>

            <div className="min-w-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={category.id}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={reduce ? undefined : { opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.42, ease: [0.33, 1, 0.68, 1] }}
                >
                  <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-subtle-ink lg:mb-0">
                    {category.questions.length} questions
                  </div>
                  <Accordion type="single" collapsible defaultValue={`${category.id}-0`} className="w-full">
                    {category.questions.map((item, index) => (
                      <AccordionItem
                        key={item.q}
                        value={`${category.id}-${index}`}
                        className="last:border-b-0"
                      >
                        <AccordionTrigger>{item.q}</AccordionTrigger>
                        <AccordionContent className="max-w-[680px]">{item.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
