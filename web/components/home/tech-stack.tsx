const stack = [
  { name: "TypeScript", icon: "typescript", reason: "Shared types across the client, API, and engine." },
  { name: "Next.js", icon: "nextjs", reason: "Pages and API routes in one application.", monochrome: true },
  { name: "React", icon: "react", reason: "Interactive previews and the watch-time lab." },
  { name: "Tailwind CSS", icon: "tailwindcss", reason: "Responsive layouts with shared design tokens." },
  { name: "SQLite", icon: "sqlite", reason: "Evidence and totals saved in one transaction." },
  { name: "Apache Kafka", icon: "apachekafka", reason: "Optional event delivery; in-memory broker by default.", monochrome: true },
];

export function TechStack() {
  return (
    <section id="stack" className="pt-16 sm:pt-20">
      <div className="page-container">
        <h2 className="text-2xl font-medium tracking-tight text-ink">Built with purpose.</h2>
        <ul className="mt-6 grid grid-cols-1 gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
          {stack.map((tool) => (
            <li key={tool.name} className="flex items-start gap-4 border-t border-line py-6">
              {/* Devicon assets are self-hosted to respect the site's CSP. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/icons/stack/${tool.icon}.svg`} width={32} height={32} alt="" loading="lazy" className={`mt-1 size-8 shrink-0 ${tool.monochrome ? "dark:invert" : ""}`} />
              <div>
                <h3 className="text-base font-medium text-ink">{tool.name}</h3>
                <p className="mt-1 max-w-[280px] text-sm leading-6 text-muted-ink">{tool.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
