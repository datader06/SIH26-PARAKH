"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import {
  HBarChart,
  DonutChart,
  Panel,
  STATUS,
  CATEGORICAL,
} from "@/components/charts/Charts";
import {
  ArrowLeft,
  Layers,
  ShieldAlert,
  GitCompareArrows,
  ClipboardList,
  ArrowUpRight,
} from "lucide-react";

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
  topDeficiencies: {
    ruleId: string;
    title: string;
    severity: string;
    count: number;
  }[];
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

export default function PortfolioInsightsPage() {
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch("/api/institution-applications/insights")
      .then(async (r) => {
        if (!r.ok)
          throw new Error("Unable to load this workspace. Please try again.");
        return r.json();
      })
      .then((json) => {
        if (json.success) setData(json.data);
        else throw new Error(json.error || "Unable to load this workspace.");
      })
      .catch((err) =>
        setError(err.message || "Connection failed. Please try again."),
      )
      .finally(() => setLoading(false));
  }, [attempt]);

  const sourceCheckedTotal = data
    ? Object.values(data.sourceStanding).reduce((a, b) => a + b, 0)
    : 0;
  const sourceVerifiedCoverage =
    data && sourceCheckedTotal > 0
      ? Math.round(
          ((data.sourceStanding["VERIFIED"] || 0) / sourceCheckedTotal) * 100,
        )
      : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.4 }}
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
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
              Portfolio Insights
            </h1>
            <p className="text-xs text-ink-soft mt-0.5 max-w-2xl">
              Aggregate signals across every institutional application in this
              organization — where deficiencies cluster, how verification
              coverage stands, and which cases need attention first.
            </p>
          </div>
        </motion.div>

        {error ? (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center"
          >
            <p className="text-sm text-rose-700">{error}</p>
            <button
              onClick={() => setAttempt((value) => value + 1)}
              className="mt-4 rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-ink"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div
            role="status"
            className="rounded-2xl border border-border bg-white py-24 text-center text-ink-soft text-sm"
          >
            Computing portfolio insights…
          </div>
        ) : !data || data.totalApplications === 0 ? (
          <div className="py-24 text-center text-ink-faint text-sm">
            No applications yet — insights will populate once cases are created
            and validated.
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
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.45,
                    delay: reduceMotion ? 0 : i * 0.06,
                  }}
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
                  <div className="text-2xl font-bold font-mono text-ink">
                    {card.value}
                  </div>
                  {card.sub && (
                    <p className="text-[11px] text-ink-faint mt-1.5 leading-snug">
                      {card.sub}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Panel
                title="Most Frequent Deficiencies"
                subtitle="Which statutory checks fail most often across the portfolio — a systemic pattern, not a single case"
                icon={<ShieldAlert className="h-[18px] w-[18px]" />}
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
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {sev}
                    </span>
                  ))}
                </div>
              </Panel>

              <Panel
                title="Compliance Score Distribution"
                subtitle="How validated applications spread across the preliminary advisory score band"
                icon={<Layers className="h-[18px] w-[18px]" />}
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
                icon={<Layers className="h-[18px] w-[18px]" />}
                delay={0.2}
              >
                <DonutChart
                  items={Object.entries(data.categoryBreakdown).map(
                    ([cat, count], i) => ({
                      label: CATEGORY_LABEL[cat] || cat,
                      value: count,
                      color: CATEGORICAL[i % CATEGORICAL.length],
                    }),
                  )}
                />
              </Panel>

              <Panel
                title="External Source Verification Standing"
                subtitle="Outcomes of issuer/source-authority checks across the whole portfolio — directly reflects manual-effort reduction"
                icon={<ShieldAlert className="h-[18px] w-[18px]" />}
                delay={0.25}
              >
                <HBarChart
                  items={Object.entries(data.sourceStanding).map(
                    ([status, count]) => ({
                      label: status.replace(/_/g, " "),
                      value: count,
                      color: SOURCE_STATUS_COLOR[status] || STATUS.neutral,
                    }),
                  )}
                  valueSuffix=" check(s)"
                />
              </Panel>
            </div>

            <Panel
              title="Reviewer Triage Queue"
              subtitle="Active cases ranked by outstanding critical findings first, then by how long they've been waiting — what to look at next, not a duplicate of the case list"
              icon={<ClipboardList className="h-[18px] w-[18px]" />}
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
                          <span className="font-mono text-xs font-bold text-clay-600">
                            {app.applicationNumber}
                          </span>
                          {app.criticalCount > 0 && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: STATUS.critical }}
                            >
                              {app.criticalCount} CRITICAL
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-soft truncate mt-0.5">
                          {app.institutionName}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[11px] text-ink-faint">
                          {app.ageDays}d waiting
                        </span>
                        <span className="text-xs font-mono font-semibold text-ink">
                          {app.complianceScore}%
                        </span>
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
