import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-soft disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-button text-button-foreground shadow-[0_1px_0_rgba(255,255,255,0.12)_inset] hover:-translate-y-px hover:bg-button/90",
        secondary:
          "border border-line bg-card text-ink hover:-translate-y-px hover:border-green-bright/40 hover:bg-mint-soft",
        outline:
          "border border-line bg-transparent text-ink hover:-translate-y-px hover:border-green-bright/40 hover:bg-mint-soft",
        ghost: "bg-transparent text-body hover:bg-mint-soft hover:text-ink",
        mint: "border border-green-bright/70 bg-mint text-green-deep hover:-translate-y-px hover:bg-mint-deep",
        link: "h-auto rounded-none p-0 text-green-deep underline-offset-4 hover:underline",
        destructive:
          "bg-destructive text-destructive-foreground hover:-translate-y-px hover:bg-destructive/90",
      },
      size: {
        default: "h-12 px-6 text-[15px]",
        sm: "h-9 px-4 text-[13px] max-sm:h-11",
        xs: "h-8 px-3 text-xs",
        lg: "h-14 px-7 text-base",
        icon: "size-10 p-0",
        "icon-sm": "size-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
