"use client";

import React from "react";
import { motion } from "framer-motion";

export function Card({
  children,
  className = "",
  hover = false,
  delay = 0,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  as?: "div" | "section";
}) {
  const Comp = motion[as];
  return (
    <Comp
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] as const }}
      whileHover={hover ? { y: -3, transition: { duration: 0.2 } } : undefined}
      className={`rounded-2xl border border-border bg-surface shadow-soft ${
        hover ? "hover:shadow-card transition-shadow" : ""
      } ${className}`}
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
    <div className="flex items-start justify-between gap-3 p-5 pb-3">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-clay-50 text-clay-600">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
          {subtitle && <p className="text-xs text-ink-soft mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
