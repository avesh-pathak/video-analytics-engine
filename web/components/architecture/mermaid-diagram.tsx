"use client";

import * as React from "react";
import { useTheme } from "next-themes";

// Mermaid keeps global renderer configuration. Serialize diagrams so a theme
// change cannot reconfigure another diagram halfway through its render.
let renderQueue: Promise<unknown> = Promise.resolve();

export function MermaidDiagram({
  source,
  label,
  caption,
  mobileFallback,
}: {
  source: string;
  label: string;
  caption: string;
  mobileFallback?: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const container = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);
  const [result, setResult] = React.useState<{ theme: string; svg: string } | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    const element = container.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "300px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!visible || !resolvedTheme) return;
    let cancelled = false;
    setFailed(false);

    const task = renderQueue.then(async () => {
      if (cancelled) return;
      const { default: mermaid } = await import("mermaid");
      if (cancelled) return;
      const style = getComputedStyle(document.documentElement);
      const color = (name: string) => style.getPropertyValue(`--${name}`).trim();
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        suppressErrorRendering: true,
        theme: "base",
        fontFamily: '"Google Sans Flex", system-ui, sans-serif',
        themeVariables: {
          background: color("card"),
          primaryColor: color("surface"),
          primaryTextColor: color("foreground"),
          primaryBorderColor: color("border"),
          secondaryColor: color("info"),
          secondaryTextColor: color("info-foreground"),
          tertiaryColor: color("muted"),
          tertiaryTextColor: color("foreground"),
          lineColor: color("muted-foreground"),
          textColor: color("foreground"),
          mainBkg: color("surface"),
          nodeBorder: color("border"),
          clusterBkg: color("card"),
          clusterBorder: color("border"),
          edgeLabelBackground: color("card"),
          actorBkg: color("surface"),
          actorBorder: color("border"),
          actorTextColor: color("foreground"),
          actorLineColor: color("muted-foreground"),
          signalColor: color("foreground"),
          signalTextColor: color("foreground"),
          noteBkgColor: color("surface"),
          noteBorderColor: color("border"),
          noteTextColor: color("foreground"),
          labelBoxBkgColor: color("surface"),
          labelTextColor: color("foreground"),
          fontSize: "14px",
        },
        flowchart: { htmlLabels: false, curve: "linear", useMaxWidth: true, padding: 18 },
        sequence: { useMaxWidth: true },
        state: { useMaxWidth: true },
      });
      const { svg } = await mermaid.render(`architecture${id}${resolvedTheme}`, source);
      if (!cancelled) setResult({ theme: resolvedTheme, svg });
    });
    renderQueue = task.catch(() => undefined);
    void task.catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [id, resolvedTheme, source, visible]);

  const svg = result && result.theme === resolvedTheme ? result.svg : null;

  return (
    <figure className="mt-8 overflow-hidden rounded-card border border-border bg-card text-card-foreground">
      <div ref={container} className="p-4 sm:p-6">
        {mobileFallback ? <div className="md:hidden">{mobileFallback}</div> : null}
        {svg ? (
          <div
            role="img"
            aria-label={label}
            className={`mx-auto min-w-0 w-full [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:w-full ${mobileFallback ? "hidden md:block" : ""}`}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <p className={`${mobileFallback ? "hidden md:grid" : "grid"} min-h-64 place-items-center text-sm text-muted-foreground`} role="status">
            {failed ? "Diagram unavailable. The complete source is below." : "Loading architecture diagram…"}
          </p>
        )}
      </div>
      <figcaption className="border-t border-border px-5 py-4 text-xs leading-5 text-muted-foreground sm:px-6">
        {caption}
        <details className="mt-3">
          <summary className="w-fit cursor-pointer font-medium text-primary">View Mermaid source</summary>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-muted p-4 font-mono text-xs leading-6 text-muted-foreground">{source}</pre>
        </details>
      </figcaption>
    </figure>
  );
}
