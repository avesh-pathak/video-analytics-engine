import { CircleCheck, Radio } from "lucide-react";

import { mediaEvents, playerChips } from "@/lib/site";

function ChipRow({
  items,
  reverse,
  mono,
}: {
  items: readonly string[];
  reverse?: boolean;
  mono?: boolean;
}) {
  const doubled = [...items, ...items, ...items, ...items];

  return (
    <div className="edge-fade overflow-hidden py-1">
      <div
        className={`flex w-max items-center gap-2 ${reverse ? "animate-marquee-right" : "animate-marquee-left"}`}
      >
        {doubled.map((item, index) => (
          <span
            key={`${item}-${index}`}
            aria-hidden={index >= items.length ? "true" : undefined}
            className={
              mono
                ? "inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-line-soft bg-card px-4 py-2.5 font-mono text-[12px] text-muted-ink shadow-[0_1px_2px_rgba(13,15,13,0.03)]"
                : "inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-line-soft bg-card px-4 py-2.5 text-[13px] font-medium text-body shadow-[0_1px_2px_rgba(13,15,13,0.03)]"
            }
          >
            {mono ? (
              <span className="size-1.5 rounded-full bg-green/60" />
            ) : (
              <span className="grid size-4 place-items-center rounded-full bg-mint">
                <CircleCheck className="size-2.5 text-green-deep" />
              </span>
            )}
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function EventMarquee() {
  return (
    <section className="pt-[104px] sm:pt-[120px]">
      <div className="page-container">
        <div className="mx-auto max-w-[760px] text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-green-deep">
            <Radio className="size-3" />
            Player-agnostic by contract
          </span>
          <h2 className="mt-4 text-h2 font-medium text-ink">
            Bring your own player.
            <br />
            Keep the number.
          </h2>
          <p className="mx-auto mt-4 max-w-[640px] text-[16px] leading-7 text-muted-ink sm:text-[17px]">
            No SDK, no iframe, no provider lock-in. Watchline listens to the ten media
            events a browser already emits, then decides what they are worth using math
            the client cannot influence.
          </p>
        </div>

        <div className="mt-9 space-y-2.5 sm:mt-10">
          <ChipRow items={mediaEvents} mono />
          <ChipRow items={playerChips} reverse />
        </div>

        <div className="mx-auto mt-7 flex max-w-[760px] flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-medium text-subtle-ink">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-green" />
            Local video never uploaded
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-sky" />
            Media never fetched
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-lilac" />
            Provider data never required
          </span>
        </div>
      </div>
    </section>
  );
}
