import Link from "next/link";
import { ArrowRight } from "lucide-react";

const metrics = [
  { name: "Unique watched", definition: "Each part of the video, counted once." },
  { name: "Total watched", definition: "All accepted playback, including rewatches." },
  { name: "Rewatch", definition: "Total watched minus unique watched." },
  { name: "Engaged wall clock", definition: "Accepted time spent watching, independent of playback speed." },
];

export function MetricsSection() {
  return (
    <section id="metrics" className="pt-24 sm:pt-32">
      <div className="page-container">
        <div className="grid grid-cols-1 gap-10 border-t border-line pt-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:pt-14">
          <div>
            <h2 className="text-h2 font-medium text-ink">Know what you’re measuring.</h2>
            <p className="mt-4 max-w-[400px] text-base leading-7 text-muted-ink">
              Four metrics. Distinct meanings. Completion is the share of the video watched at least once.
            </p>
            <Link href="/architecture#watch-math" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-green-deep underline-offset-4 hover:underline">
              Try the watch math <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <dl className="divide-y divide-line">
            {metrics.map((metric) => (
              <div key={metric.name} className="grid grid-cols-1 gap-1 py-5 first:pt-0 sm:grid-cols-[170px_1fr] sm:gap-6">
                <dt className="text-base font-medium text-ink">{metric.name}</dt>
                <dd className="text-sm leading-6 text-muted-ink">{metric.definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
