"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { HBarChart, Panel, StatCard, STATUS } from "@/components/charts/Charts";
import { ClipboardList, Layers, ShieldCheck, ArrowUpRight, History } from "lucide-react";

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
  auditExcerpt: { id: string; action: string; userEmail: string | null; details: string | null; timestamp: string }[];
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
  const [data, setData] = useState<ReviewerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalPending = data ? data.pendingBreakdown.reduce((s, p) => s + p.count, 0) : 0;
  const sourceCheckedTotal = data ? Object.values(data.sourceStanding).reduce((a, b) => a + b, 0) : 0;
  const sourceVerifiedCoverage =
    data && sourceCheckedTotal > 0 ? Math.round(((data.sourceStanding["VERIFIED"] || 0) / sourceCheckedTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border"
      >
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">Reviewer Dashboard</h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Decisions you're accountable for — pending applications, their age, and the audit trail you verify against.
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

      {loading ? (
        <div className="py-24 text-center text-ink-faint text-sm">Loading reviewer data…</div>
      ) : !data ? (
        <div className="py-24 text-center text-ink-faint text-sm">Unable to load dashboard data.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Applications in Portfolio" value={data.totalApplications} icon={<Layers className="h-3.5 w-3.5" />} tone="clay" delay={0} />
            <StatCard label="Pending Your Decision" value={totalPending} icon={<ClipboardList className="h-3.5 w-3.5" />} tone="amber" delay={0.05} />
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
              icon={<ClipboardList className="h-4.5 w-4.5" />}
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
              icon={<Layers className="h-4.5 w-4.5" />}
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
            icon={<ClipboardList className="h-4.5 w-4.5" />}
            delay={0.3}
          >
            {data.triageQueue.length === 0 ? (
              <p className="text-xs text-ink-faint py-6 text-center">No active cases pending review.</p>
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
                        <span className="font-mono text-xs font-bold text-clay-600">{app.applicationNumber}</span>
                        {app.criticalCount > 0 && <Badge tone="rose">{app.criticalCount} CRITICAL</Badge>}
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

          <Panel
            title="Recent Reviewer-Relevant Audit Events"
            subtitle="PII unmasks, PARAKH dispatches, and review transitions you're accountable for verifying"
            icon={<History className="h-4.5 w-4.5" />}
            delay={0.35}
          >
            {data.auditExcerpt.length === 0 ? (
              <p className="text-xs text-ink-faint py-6 text-center">No relevant audit events yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {data.auditExcerpt.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] font-bold text-clay-600">{log.action}</span>
                      <p className="text-xs text-ink-soft truncate mt-0.5">{log.details || "—"}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-[11px] text-ink-faint font-mono">
                      <span>{log.userEmail || "System"}</span>
                      <span>{new Date(log.timestamp).toLocaleString("en-IN")}</span>
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
