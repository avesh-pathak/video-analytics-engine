"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const questions = [
  {
    q: "What happens when someone rewatches?",
    a: "Total watched grows. Unique watched only grows when they watch a new part of the video. Rewatch is the difference.",
  },
  {
    q: "Can retries count the same playback twice?",
    a: "No. A request key catches repeated batches. A separate segment identity catches the same evidence even if it returns in a new session.",
  },
  {
    q: "Does it work with my video player?",
    a: "The engine accepts standard playback events from HTML5 video and compatible players. It doesn’t fetch or store your video. Authentication belongs in your product layer.",
  },
  {
    q: "What if a stored total is wrong?",
    a: "An audit compares it with the evidence log. Preview the changes, repair the affected subjects, then verify the result. The projection can also be rebuilt from scratch.",
  },
  {
    q: "Is this a live analytics dashboard?",
    a: "No. This site is an interactive UI demo with deterministic sample data and no backend calls. The repository contains the measurement engine and API implementation.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="pt-24 sm:pt-32">
      <div className="page-container">
        <div className="mx-auto max-w-[820px]">
          <h2 className="text-h2 font-medium text-ink">A few useful answers.</h2>
          <Accordion type="single" collapsible className="mt-8 border-t border-line">
            {questions.map((item, index) => (
              <AccordionItem key={item.q} value={`question-${index}`}>
                <AccordionTrigger className="py-6 text-base leading-6">{item.q}</AccordionTrigger>
                <AccordionContent className="max-w-[680px] pb-6 text-base leading-7 text-muted-ink">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
