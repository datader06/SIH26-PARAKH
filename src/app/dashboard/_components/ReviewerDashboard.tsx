"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { HBarChart, Panel, StatCard, STATUS } from "@/components/charts/Charts";
import {
  ClipboardList,
  Layers,
  ShieldCheck,
  ArrowUpRight,
  History,
} from "lucide-react";

interface ReviewerData {
  totalApplications: number;
  scoreDistribution: { range: string; count: number }[];
  pendingBreakdown: { status: string; count: number; avgAgeDays: number }[];
  sourceStanding: Record<string, number>;
  triageQueue: {
    id: string;
    applicationNumber: string;
    institutionName: string;
    validationStatus: string;
    complianceScore: number;
    criticalCount: number;
    ageDays: number;
  }[];
  auditExcerpt: {
    id: string;
    action: string;
    userEmail: string | null;
    details: string | null;
    timestamp: string;
  }[];
}

const SCORE_BUCKET_COLOR: Record<string, string> = {
  "0-25": STATUS.critical,
  "26-50": STATUS.serious,
  "51-75": STATUS.warning,
  "76-100": STATUS.good,
};

const SOURCE_STATUS_COLOR: Record<string, string> = {
  VERIFIED: STATUS.good,
  MISMATCH_DETECTED: STATUS.critical,
  EXPIRED: STATUS.critical,
  PENDING: STATUS.warning,
  MANUAL_REVIEW_REQUIRED: STATUS.warning,
  SOURCE_UNAVAILABLE: STATUS.neutral,
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  VALIDATION_PENDING: "Validation Pending",
  RECTIFICATION_REQUESTED: "Rectification Requested",
  OFFICIAL_REVIEW_REQUIRED: "Official Review Required",
  UNDER_REVIEW: "Under Review",
};

export function ReviewerDashboard() {
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<ReviewerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch("/api/dashboard")
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

  const totalPending = data
    ? data.pendingBreakdown.reduce((s, p) => s + p.count, 0)
    : 0;
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
    <div className="space-y-6">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border"
      >
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            Reviewer Dashboard
          </h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Decisions you&apos;re accountable for — pending applications, their
            age, and the audit trail you verify against.
          </p>
        </div>
        <Link
          href="/applications/insights"
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-sand-200 border border-border text-xs font-semibold text-ink-soft transition-colors duration-200 flex items-center gap-1.5 shrink-0"
        >
          <span>Full Portfolio Insights</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
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
          Loading reviewer data…
        </div>
      ) : !data ? (
        <div className="py-24 text-center text-ink-faint text-sm">
          Unable to load dashboard data.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Applications in Portfolio"
              value={data.totalApplications}
              icon={<Layers className="h-3.5 w-3.5" />}
              tone="clay"
              delay={0}
            />
            <StatCard
              label="Pending Your Decision"
              value={totalPending}
              icon={<ClipboardList className="h-3.5 w-3.5" />}
              tone="amber"
              delay={0.05}
            />
            <StatCard
              label="Source Verification Coverage"
              value={`${sourceVerifiedCoverage}%`}
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              tone="sage"
              delay={0.1}
            />
            <StatCard
              label="Oldest Pending Case"
              value={
                data.pendingBreakdown.length
                  ? `${Math.max(...data.pendingBreakdown.map((p) => p.avgAgeDays))}d avg`
                  : "—"
              }
              icon={<History className="h-3.5 w-3.5" />}
              tone="dusk"
              delay={0.15}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel
              title="Pending Applications by Stage"
              subtitle="Where cases are stuck in the pipeline, with average waiting time"
              icon={<ClipboardList className="h-[18px] w-[18px]" />}
              delay={0.2}
            >
              <HBarChart
                items={data.pendingBreakdown.map((p) => ({
                  label: `${STATUS_LABEL[p.status] || p.status} (avg ${p.avgAgeDays}d)`,
                  value: p.count,
                  color: STATUS.warning,
                }))}
                valueSuffix=" case(s)"
              />
            </Panel>

            <Panel
              title="Compliance Score Distribution"
              subtitle="How validated applications spread across the advisory score band"
              icon={<Layers className="h-[18px] w-[18px]" />}
              delay={0.25}
            >
              <HBarChart
                items={data.scoreDistribution.map((b) => ({
                  label: b.range,
                  value: b.count,
                  color: SCORE_BUCKET_COLOR[b.range],
                }))}
                valueSuffix=" app(s)"
              />
            </Panel>
          </div>

          <Panel
            title="Your Triage Queue"
            subtitle="Active cases ranked by outstanding critical findings first, then by how long they've waited"
            icon={<ClipboardList className="h-[18px] w-[18px]" />}
            delay={0.3}
          >
            {data.triageQueue.length === 0 ? (
              <p className="text-xs text-ink-faint py-6 text-center">
                No active cases pending review.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {data.triageQueue.map((app) => (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className="flex items-center justify-between py-2.5 group hover:bg-sand-100 -mx-2 px-2 rounded-lg transition-colors duration-150"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-clay-600">
                          {app.applicationNumber}
                        </span>
                        {app.criticalCount > 0 && (
                          <Badge tone="rose">
                            {app.criticalCount} CRITICAL
                          </Badge>
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

          <Panel
            title="Recent Reviewer-Relevant Audit Events"
            subtitle="PII unmasks, PARAKH dispatches, and review transitions you're accountable for verifying"
            icon={<History className="h-[18px] w-[18px]" />}
            delay={0.35}
          >
            {data.auditExcerpt.length === 0 ? (
              <p className="text-xs text-ink-faint py-6 text-center">
                No relevant audit events yet.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {data.auditExcerpt.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] font-bold text-clay-600">
                        {log.action}
                      </span>
                      <p className="text-xs text-ink-soft truncate mt-0.5">
                        {log.details || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-[11px] text-ink-faint font-mono">
                      <span>{log.userEmail || "System"}</span>
                      <span>
                        {new Date(log.timestamp).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
