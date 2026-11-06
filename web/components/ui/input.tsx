import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-full border border-line bg-card px-4 py-2 text-sm text-body outline-none transition-[border-color,box-shadow] placeholder:text-subtle-ink focus:border-green-bright/60 focus:ring-4 focus:ring-green/10 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
