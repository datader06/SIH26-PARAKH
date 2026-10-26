"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import {
  ArrowLeft,
  Layers,
  ShieldAlert,
  GitCompareArrows,
  ClipboardList,
  ArrowUpRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Palette (validated via dataviz skill's validate_palette.js against this
// app's light surface #FBF7F0). Status colors are fixed/never themed; the
// categorical set is the skill's default theme's first 4 slots, confirmed to
// pass CVD + normal-vision adjacent-pair checks for bar/donut use.
// ---------------------------------------------------------------------------
const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
  neutral: "#9a8f80",
};
const CATEGORICAL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"];

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: STATUS.critical,
  HIGH: STATUS.serious,
  MEDIUM: STATUS.warning,
  LOW: STATUS.good,
};

const SOURCE_STATUS_COLOR: Record<string, string> = {
  VERIFIED: STATUS.good,
  MISMATCH_DETECTED: STATUS.critical,
  EXPIRED: STATUS.critical,
  PENDING: STATUS.warning,
  MANUAL_REVIEW_REQUIRED: STATUS.warning,
  SOURCE_UNAVAILABLE: STATUS.neutral,
};

const SCORE_BUCKET_COLOR: Record<string, string> = {
  "0-25": STATUS.critical,
  "26-50": STATUS.serious,
  "51-75": STATUS.warning,
  "76-100": STATUS.good,
};

const CATEGORY_LABEL: Record<string, string> = {
  EXTENSION_OF_APPROVAL: "Extension of Approval",
  NEW_PROGRAMME: "New Programme",
  INTAKE_CHANGE: "Intake Change",
  APPROVAL_CHANGE: "Approval Change",
};

interface InsightsData {
  totalApplications: number;
  categoryBreakdown: Record<string, number>;
  scoreDistribution: { range: string; count: number }[];
  topDeficiencies: { ruleId: string; title: string; severity: string; count: number }[];
  sourceStanding: Record<string, number>;
  crossDocumentFlaggedCount: number;
  triageQueue: {
    id: string;
    applicationNumber: string;
    institutionName: string;
    validationStatus: string;
    complianceScore: number;
    criticalCount: number;
    ageDays: number;
  }[];
}

function HBarChart({
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

function DonutChart({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) {
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
          const dash = fraction * circumference - 2; // 2px surface gap between segments
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
          className="rotate-90"
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

function Panel({
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

export default function PortfolioInsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/institution-applications/insights")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const sourceCheckedTotal = data ? Object.values(data.sourceStanding).reduce((a, b) => a + b, 0) : 0;
  const sourceVerifiedCoverage =
    data && sourceCheckedTotal > 0
      ? Math.round(((data.sourceStanding["VERIFIED"] || 0) / sourceCheckedTotal) * 100)
      : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border"
        >
          <div>
            <Link
              href="/applications"
              className="inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink-soft mb-2 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Applications</span>
            </Link>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
              Portfolio Insights
            </h1>
            <p className="text-xs text-ink-soft mt-0.5 max-w-2xl">
              Aggregate signals across every institutional application in this organization — where deficiencies
              cluster, how verification coverage stands, and which cases need attention first.
            </p>
          </div>
        </motion.div>

        {loading ? (
          <div className="py-24 text-center text-ink-faint text-sm">Computing portfolio insights…</div>
        ) : !data || data.totalApplications === 0 ? (
          <div className="py-24 text-center text-ink-faint text-sm">
            No applications yet — insights will populate once cases are created and validated.
          </div>
        ) : (
          <>
            {/* Headline stats — distinct from the list page's static counts */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  label: "Applications in Portfolio",
                  value: data.totalApplications,
                  icon: <Layers className="h-3.5 w-3.5" />,
                  tone: "clay",
                },
                {
                  label: "Cross-Document Flags",
                  value: data.crossDocumentFlaggedCount,
                  icon: <GitCompareArrows className="h-3.5 w-3.5" />,
                  tone: "rose",
                  sub: "Applications with an unresolved ID/date inconsistency between their own documents",
                },
                {
                  label: "Automated Source Verification Coverage",
                  value: `${sourceVerifiedCoverage}%`,
                  icon: <ShieldAlert className="h-3.5 w-3.5" />,
                  tone: "dusk",
                  sub: "Share of source checks that returned a confirmed VERIFIED result (vs. requiring manual review)",
                },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.06 }}
                  className="p-4 rounded-2xl bg-white border border-border shadow-soft"
                >
                  <div className="flex items-center justify-between text-ink-soft mb-2">
                    <span className="text-xs font-medium">{card.label}</span>
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                        card.tone === "clay"
                          ? "bg-clay-50 text-clay-600"
                          : card.tone === "rose"
                          ? "bg-rose-50 text-rose-500"
                          : "bg-dusk-50 text-dusk-600"
                      }`}
                    >
                      {card.icon}
                    </div>
                  </div>
                  <div className="text-2xl font-bold font-mono text-ink">{card.value}</div>
                  {card.sub && <p className="text-[11px] text-ink-faint mt-1.5 leading-snug">{card.sub}</p>}
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Panel
                title="Most Frequent Deficiencies"
                subtitle="Which statutory checks fail most often across the portfolio — a systemic pattern, not a single case"
                icon={<ShieldAlert className="h-4.5 w-4.5" />}
                delay={0.1}
              >
                <HBarChart
                  items={data.topDeficiencies.map((d) => ({
                    label: d.title,
                    value: d.count,
                    color: SEVERITY_COLOR[d.severity] || STATUS.neutral,
                  }))}
                  valueSuffix=" case(s)"
                />
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-[11px] text-ink-faint flex-wrap">
                  {Object.entries(SEVERITY_COLOR).map(([sev, color]) => (
                    <span key={sev} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                      {sev}
                    </span>
                  ))}
                </div>
              </Panel>

              <Panel
                title="Compliance Score Distribution"
                subtitle="How validated applications spread across the preliminary advisory score band"
                icon={<Layers className="h-4.5 w-4.5" />}
                delay={0.15}
              >
                <HBarChart
                  items={data.scoreDistribution.map((b) => ({
                    label: `${b.range}`,
                    value: b.count,
                    color: SCORE_BUCKET_COLOR[b.range],
                  }))}
                  valueSuffix=" app(s)"
                />
              </Panel>

              <Panel
                title="Application Category Volume"
                subtitle="Case mix by regulatory application type"
                icon={<Layers className="h-4.5 w-4.5" />}
                delay={0.2}
              >
                <DonutChart
                  items={Object.entries(data.categoryBreakdown).map(([cat, count], i) => ({
                    label: CATEGORY_LABEL[cat] || cat,
                    value: count,
                    color: CATEGORICAL[i % CATEGORICAL.length],
                  }))}
                />
              </Panel>

              <Panel
                title="External Source Verification Standing"
                subtitle="Outcomes of issuer/source-authority checks across the whole portfolio — directly reflects manual-effort reduction"
                icon={<ShieldAlert className="h-4.5 w-4.5" />}
                delay={0.25}
              >
                <HBarChart
                  items={Object.entries(data.sourceStanding).map(([status, count]) => ({
                    label: status.replace(/_/g, " "),
                    value: count,
                    color: SOURCE_STATUS_COLOR[status] || STATUS.neutral,
                  }))}
                  valueSuffix=" check(s)"
                />
              </Panel>
            </div>

            <Panel
              title="Reviewer Triage Queue"
              subtitle="Active cases ranked by outstanding critical findings first, then by how long they've been waiting — what to look at next, not a duplicate of the case list"
              icon={<ClipboardList className="h-4.5 w-4.5" />}
              delay={0.3}
            >
              {data.triageQueue.length === 0 ? (
                <p className="text-xs text-ink-faint py-6 text-center">
                  No active cases pending reviewer attention.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {data.triageQueue.map((app) => (
                    <Link
                      key={app.id}
                      href={`/applications/${app.id}`}
                      className="flex items-center justify-between py-3 group hover:bg-sand-100 -mx-2 px-2 rounded-lg transition-colors duration-150"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-clay-600">{app.applicationNumber}</span>
                          {app.criticalCount > 0 && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: STATUS.critical }}
                            >
                              {app.criticalCount} CRITICAL
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-soft truncate mt-0.5">{app.institutionName}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[11px] text-ink-faint">{app.ageDays}d waiting</span>
                        <span className="text-xs font-mono font-semibold text-ink">{app.complianceScore}%</span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-ink-faint group-hover:text-clay-600 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Panel>
          </>
        )}
      </div>
    </AppShell>
  );
}
