import { cn } from "@/lib/utils";

const markPath =
  "M9.48984 18.0598C22.8398 10.3498 46.89 25.6997 69.19 53.9597C68.69 60.2597 68.4195 66.7998 68.4195 73.4998C68.4195 94.5198 71.0396 113.93 75.4596 129.63C76.0896 115.39 78.5696 99.3297 83.0396 82.6797C95.6696 35.5297 119.709 0.369687 138.519 0.179688C157.329 0.369687 181.36 35.5197 194 82.6797C198.46 99.3297 200.94 115.39 201.57 129.63C206 113.93 208.61 94.5198 208.61 73.4998C208.61 66.7998 208.339 60.2697 207.839 53.9597C230.139 25.6897 254.19 10.3498 267.54 18.0598C284.81 28.0298 277.629 72.7798 251.509 118.02C228.659 157.61 198.87 184.44 180.21 183.86C161.33 184.27 136.99 148.92 124.25 101.37L123.95 100.24C123.75 104.28 123.65 108.39 123.65 112.57C123.65 129.39 125.329 145.18 128.269 158.86C117.909 174.64 106.63 184.07 96.8297 183.86C78.1697 184.45 48.3899 157.61 25.5299 118.02C-0.600124 72.7798 -7.78016 28.0298 9.48984 18.0598Z";

export function LogoMark({
  className,
  variant = "ink",
}: {
  className?: string;
  variant?: "ink" | "brand" | "white";
}) {
  const fill = variant === "brand" ? "url(#watchline-mark-gradient)" : variant === "white" ? "#FAFAFA" : "currentColor";

  return (
    <svg
      viewBox="0 0 277 184"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-9 shrink-0 text-ink", className)}
      aria-hidden="true"
    >
      {variant === "brand" ? (
        <defs>
          <linearGradient id="watchline-mark-gradient" x1="0" y1="184" x2="277" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#39D47A" />
            <stop offset="0.5" stopColor="#16BFA6" />
            <stop offset="1" stopColor="#009CD0" />
          </linearGradient>
        </defs>
      ) : null}
      <path fillRule="evenodd" clipRule="evenodd" d={markPath} fill={fill} />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  wordmarkClassName,
  subtle,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  subtle?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span
        className={cn(
          "text-[22px] font-semibold leading-none tracking-[-0.045em] text-ink",
          wordmarkClassName,
        )}
      >
        Watchline
      </span>
      {subtle ? (
        <span className="ml-1 border-l border-line pl-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-subtle-ink">
          Engine
        </span>
      ) : null}
    </span>
  );
}
