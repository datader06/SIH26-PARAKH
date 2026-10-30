"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className = "",
  hover = false,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  as?: "div" | "section";
}) {
  const Comp = as;
  return (
    <Comp
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-soft",
        hover && "transition-shadow hover:shadow-card",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-sand-50 text-clay-600">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-display text-sm font-semibold text-ink">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-ink-soft mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
