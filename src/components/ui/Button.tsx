"use client";

import React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary:
    "border border-clay-600 bg-clay-600 text-white shadow-soft hover:border-clay-700 hover:bg-clay-700",
  secondary:
    "border border-border bg-surface text-ink shadow-soft hover:border-clay-300 hover:bg-sand-50",
  ghost:
    "border border-transparent bg-transparent text-ink-soft hover:bg-sand-100 hover:text-ink",
  danger: "border border-rose-600 bg-rose-600 text-white hover:bg-rose-500",
};

const sizes: Record<Size, string> = {
  sm: "min-h-[34px] px-3 py-1.5 text-xs gap-1.5",
  md: "min-h-[42px] px-4 py-2.5 text-sm gap-2",
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
  }
>(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    className = "",
    type,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "pressable inline-flex shrink-0 items-center justify-center rounded-lg font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
