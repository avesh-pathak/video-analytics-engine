"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      disabled={!mounted}
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light" : "Switch to dark"}
      className={cn(
        "relative grid size-11 place-items-center overflow-hidden rounded-full border border-line bg-card text-body transition hover:-translate-y-px hover:border-green-bright/40 hover:bg-mint-soft disabled:pointer-events-none lg:size-9",
        className,
      )}
    >
      <Sun
        className={cn(
          "absolute size-4 transition-all duration-300 ease-soft",
          isDark ? "translate-y-4 scale-0 opacity-0" : "translate-y-0 scale-100 opacity-100",
        )}
      />
      <Moon
        className={cn(
          "absolute size-4 transition-all duration-300 ease-soft",
          isDark ? "translate-y-0 scale-100 opacity-100" : "-translate-y-4 scale-0 opacity-0",
        )}
      />
      <span className="sr-only">Toggle color theme</span>
    </button>
  );
}
