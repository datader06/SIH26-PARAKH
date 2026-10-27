"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Shared chart primitives (validated via the dataviz skill's validate_palette.js
// against this app's light surface #FBF7F0). Status colors are fixed/never
// themed; the categorical set is the skill's default theme's first 4 slots,
// confirmed to pass CVD + normal-vision adjacent-pair checks for bar/donut use.
// Used across every role dashboard and the Portfolio Insights page so charts
// read as one system instead of four one-off implementations.
// ---------------------------------------------------------------------------
export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
  neutral: "#9a8f80",
};

export const CATEGORICAL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"];

export function HBarChart({
  items,
  valueSuffix = "",
}: {
  items: { label: string; value: number; color: string }[];
  valueSuffix?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...items.map((i) => i.value));

  if (items.length === 0) {
    return <p className="text-xs text-ink-faint py-6 text-center">No data yet.</p>;
  }

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => {
        const pct = (item.value / max) * 100;
        return (
          <div
            key={item.label}
            className="group"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-ink-soft font-medium truncate pr-2">{item.label}</span>
              <span className="text-ink font-mono font-semibold shrink-0">
                {item.value}
                {valueSuffix}
              </span>
            </div>
            <div className="relative h-5 w-full rounded-full bg-sand-200 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(3, pct)}%` }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] as const }}
                className="h-full rounded-full transition-[filter] duration-150"
                style={{
                  backgroundColor: item.color,
                  filter: hovered === i ? "brightness(1.1)" : "none",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DonutChart({ items }: { items: { label: string; value: number; color: string }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) {
    return <p className="text-xs text-ink-faint py-6 text-center">No data yet.</p>;
  }

  const radius = 60;
  const stroke = 22;
  const circumference = 2 * Math.PI * radius;
  let offsetAcc = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0 -rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#EFE5D3" strokeWidth={stroke} />
        {items.map((item, i) => {
          const fraction = item.value / total;
          const dash = fraction * circumference - 2;
          const dashArray = `${Math.max(0, dash)} ${circumference}`;
          const dashOffset = -offsetAcc;
          offsetAcc += fraction * circumference;
          return (
            <circle
              key={item.label}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={hovered === i ? stroke + 2 : stroke}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-150 cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        <text
          x="80"
          y="80"
          textAnchor="middle"
          dominantBaseline="central"
          style={{ transform: "rotate(90deg)", transformOrigin: "80px 80px", fill: "#2B2420", fontSize: "22px", fontWeight: 700 }}
        >
          {total}
        </text>
      </svg>
      <div className="space-y-1.5 w-full">
        {items.map((item, i) => (
          <div
            key={item.label}
            className={`flex items-center justify-between text-xs px-2 py-1.5 rounded-lg transition-colors duration-150 ${
              hovered === i ? "bg-sand-200" : ""
            }`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="flex items-center gap-2 text-ink-soft font-medium">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
            <span className="text-ink font-mono font-semibold">
              {item.value} <span className="text-ink-faint">({Math.round((item.value / total) * 100)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  icon,
  children,
  delay = 0,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] as const }}
      className="p-5 rounded-2xl bg-white border border-border shadow-soft"
    >
      <div className="flex items-start gap-3 pb-3 mb-4 border-b border-border">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-clay-50 text-clay-600">
          {icon}
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
          <p className="text-xs text-ink-soft mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = "clay",
  sub,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: "clay" | "rose" | "dusk" | "sage" | "amber";
  sub?: React.ReactNode;
  delay?: number;
}) {
  const toneBg: Record<string, string> = {
    clay: "bg-clay-50 text-clay-600",
    rose: "bg-rose-50 text-rose-500",
    dusk: "bg-dusk-50 text-dusk-600",
    sage: "bg-sage-50 text-sage-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="p-4 rounded-2xl bg-white border border-border shadow-soft"
    >
      <div className="flex items-center justify-between text-ink-soft mb-2">
        <span className="text-xs font-medium">{label}</span>
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${toneBg[tone]}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold font-mono text-ink">{value}</div>
      {sub && <p className="text-[11px] text-ink-faint mt-1.5 leading-snug">{sub}</p>}
    </motion.div>
  );
}

// Lightweight sparkline/trend bar strip for a time-bucketed series (e.g. last 14 days volume).
export function TrendBars({
  series,
  color = CATEGORICAL[0],
}: {
  series: { label: string; value: number }[];
  color?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...series.map((s) => s.value));

  if (series.length === 0) {
    return <p className="text-xs text-ink-faint py-6 text-center">No data yet.</p>;
  }

  return (
    <div>
      <div className="flex items-end gap-1 h-28">
        {series.map((pt, i) => {
          const heightPct = Math.max(3, (pt.value / max) * 100);
          return (
            <div
              key={pt.label}
              className="flex-1 flex flex-col items-center justify-end h-full group relative"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {hovered === i && (
                <div className="absolute -top-7 px-1.5 py-0.5 rounded bg-ink text-white text-[10px] font-mono whitespace-nowrap z-10">
                  {pt.value}
                </div>
              )}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ duration: 0.5, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] as const }}
                className="w-full rounded-t-sm transition-[filter] duration-150"
                style={{ backgroundColor: color, filter: hovered === i ? "brightness(1.15)" : "none", minHeight: 2 }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-1.5">
        {series.map((pt, i) => (
          <span
            key={pt.label}
            className="flex-1 text-center text-[9px] text-ink-faint font-mono truncate"
            style={{ opacity: i % Math.ceil(series.length / 7) === 0 ? 1 : 0 }}
          >
            {pt.label}
          </span>
        ))}
      </div>
    </div>
  );
}
