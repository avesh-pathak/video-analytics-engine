"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { GithubIcon, LinkedinIcon } from "@/components/brand/social-icons";
import { ThemeToggle } from "@/components/brand/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

function SocialLinks({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  return (
    <div className={cn("items-center gap-2", className)}>
      <Link href={site.links.github} target="_blank" rel="noreferrer" onClick={onNavigate} aria-label="GitHub repository" className="grid size-11 place-items-center rounded-full border border-line bg-card text-ink transition-colors hover:bg-mint-soft"><GithubIcon className="size-4" /></Link>
      <Link href={site.links.linkedin} target="_blank" rel="noreferrer" onClick={onNavigate} aria-label="Avesh Pathak on LinkedIn" className="grid size-11 place-items-center rounded-full border border-line bg-card text-ink transition-colors hover:bg-mint-soft"><LinkedinIcon className="size-4" /></Link>
      <Link href={site.links.portfolio} target="_blank" rel="noreferrer" onClick={onNavigate} className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line bg-card px-4 text-sm font-semibold text-ink transition-colors hover:bg-mint-soft">avesh.tech <ArrowUpRight className="size-3.5" aria-hidden="true" /></Link>
    </div>
  );
}

export function SiteHeader() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const defaultHref = pathname === "/architecture" ? "/architecture" : pathname === "/" ? "/#product" : null;
  const [sectionHref, setSectionHref] = React.useState<string | null>(null);
  const activeHref = sectionHref ?? defaultHref;

  React.useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const marker = 100;
      const current = site.nav.find((item) => {
        const [route, id] = item.href.split("#");
        if (route !== pathname || !id) return false;
        const section = document.getElementById(id);
        if (!section) return false;
        const bounds = section.getBoundingClientRect();
        return bounds.top <= marker && bounds.bottom > marker;
      });
      setSectionHref(current?.href ?? null);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, [pathname]);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-[68px] border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-line/80 bg-card/90 shadow-[0_1px_20px_rgba(13,15,13,0.04)] backdrop-blur-xl"
          : "border-transparent bg-card/80 backdrop-blur-md",
      )}
    >
      <div className="page-container flex h-full items-center justify-between gap-6">
        <Link href="/" aria-label="Watchline home" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {site.nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={activeHref === item.href ? (item.href.includes("#") ? "location" : "page") : undefined}
              className={cn(
                "relative py-2 text-[14px] font-medium transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-green-deep after:transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4",
                activeHref === item.href
                  ? "text-green-deep after:opacity-100"
                  : "text-ink after:opacity-0 hover:text-green-deep",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <SocialLinks className="hidden sm:flex" />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="grid size-11 place-items-center rounded-full border border-line bg-card text-ink lg:hidden"
              >
                <Menu className="size-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="max-w-[360px] rounded-l-panel border-line">
              <SheetHeader>
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <SheetDescription className="sr-only">Site navigation</SheetDescription>
                <Logo />
              </SheetHeader>
              <div className="flex flex-1 flex-col px-6 py-7">
                <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                  {site.nav.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={activeHref === item.href ? (item.href.includes("#") ? "location" : "page") : undefined}
                      className={cn(
                        "flex items-center justify-between rounded-2xl px-3 py-3.5 text-[19px] font-medium tracking-[-0.01em] transition-colors hover:bg-mint-soft",
                        activeHref === item.href ? "bg-mint text-green-deep" : "text-ink",
                      )}
                    >
                      {item.label}
                      <ArrowUpRight className="size-4 text-subtle-ink" />
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto border-t border-line pt-5">
                  <SocialLinks className="flex flex-wrap" onNavigate={() => setOpen(false)} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
