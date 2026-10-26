import React from "react";

type Tone = "clay" | "sage" | "amber" | "rose" | "dusk" | "neutral";

const tones: Record<Tone, string> = {
  clay: "bg-clay-50 text-clay-700 border-clay-200",
  sage: "bg-sage-50 text-sage-600 border-sage-200",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  rose: "bg-rose-50 text-rose-600 border-rose-100",
  dusk: "bg-dusk-50 text-dusk-600 border-dusk-100",
  neutral: "bg-sand-200 text-ink-soft border-border",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
