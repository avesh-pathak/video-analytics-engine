import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
            <div className="mx-auto flex max-w-[560px] flex-col items-center py-24 text-center sm:py-32">
              <h1 className="text-h2 font-medium text-ink">Page not found</h1>
              <p className="mt-4 max-w-[420px] text-[16px] leading-7 text-muted-ink">
                This page doesn&apos;t exist or has moved.
              </p>

              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                <Button asChild>
                  <Link href="/">Back to home</Link>
                </Button>
                <Link
                  href="/architecture"
                  className="inline-flex items-center gap-1.5 text-[14px] font-medium text-muted-ink underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  Architecture
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>

              <p className="mt-16 text-[12px] tabular text-subtle-ink">404 · No page at this address</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
