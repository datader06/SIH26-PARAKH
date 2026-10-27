"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { HBarChart, DonutChart, Panel, StatCard, STATUS } from "@/components/charts/Charts";
import { ShieldAlert, ScanFace, GitCompareArrows, ArrowUpRight, Flame } from "lucide-react";

interface InvestigatorData {
  riskTierDistribution: Record<string, number>;
  anomalySeverity: Record<string, number>;
  faceMismatchCount: number;
  faceVerificationsTotal: number;
  riskQueue: {
    id: string;
    screeningId: string;
    documentType: string;
    riskTier: string;
    riskScore: number;
    createdAt: string;
    operator: { name: string };
  }[];
  crossDocumentFlagged: { id: string; applicationNumber: string; institutionName: string; flaggedRules: number }[];
}

const RISK_TIER_COLOR: Record<string, string> = {
  LOW_RISK: STATUS.good,
  REVIEW_REQUIRED: STATUS.warning,
  HIGH_RISK: STATUS.critical,
};

const ANOMALY_SEVERITY_COLOR: Record<string, string> = {
  INFO: STATUS.neutral,
  MODERATE: STATUS.warning,
  HIGH: STATUS.critical,
};

const DOC_LABEL: Record<string, string> = {
  AADHAAR_CARD: "Aadhaar Card",
  PAN_CARD: "PAN Card",
  PASSPORT: "Passport",
  DRIVING_LICENCE: "Driving Licence",
  VOTER_ID: "Voter ID",
  UNKNOWN: "Unclassified",
};

export function InvestigatorDashboard() {
  const [data, setData] = useState<InvestigatorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const faceMatchCoverage =
    data && data.faceVerificationsTotal > 0
      ? Math.round(((data.faceVerificationsTotal - data.faceMismatchCount) / data.faceVerificationsTotal) * 100)
      : null;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pb-4 border-b border-border"
      >
        <h1 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">Investigation Queue</h1>
        <p className="text-xs text-ink-soft mt-0.5">
          Org-wide risk signals that need a closer look — flagged screenings, forensic anomalies, and cross-document inconsistencies.
        </p>
      </motion.div>

      {loading ? (
        <div className="py-24 text-center text-ink-faint text-sm">Loading investigation signals…</div>
      ) : !data ? (
        <div className="py-24 text-center text-ink-faint text-sm">Unable to load dashboard data.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="High / Review Risk Cases"
              value={(data.riskTierDistribution.HIGH_RISK || 0) + (data.riskTierDistribution.REVIEW_REQUIRED || 0)}
              icon={<Flame className="h-3.5 w-3.5" />}
              tone="rose"
              delay={0}
            />
            <StatCard
              label="High-Severity Anomalies"
              value={data.anomalySeverity.HIGH || 0}
              icon={<ShieldAlert className="h-3.5 w-3.5" />}
              tone="amber"
              delay={0.05}
            />
            <StatCard
              label="Face Match Coverage"
              value={faceMatchCoverage !== null ? `${faceMatchCoverage}%` : "—"}
              icon={<ScanFace className="h-3.5 w-3.5" />}
              tone="dusk"
              sub={`${data.faceMismatchCount} mismatch(es) of ${data.faceVerificationsTotal} checked`}
              delay={0.1}
            />
            <StatCard
              label="Cross-Document Flags"
              value={data.crossDocumentFlagged.length}
              icon={<GitCompareArrows className="h-3.5 w-3.5" />}
              tone="clay"
              sub="AICTE applications with unresolved ID/date inconsistencies"
              delay={0.15}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel
              title="Risk Tier Distribution"
              subtitle="How every screening in the organization currently sits"
              icon={<Flame className="h-4.5 w-4.5" />}
              delay={0.2}
            >
              <DonutChart
                items={Object.entries(data.riskTierDistribution).map(([tier, count]) => ({
                  label: tier.replace(/_/g, " "),
                  value: count,
                  color: RISK_TIER_COLOR[tier] || STATUS.neutral,
                }))}
              />
            </Panel>

            <Panel
              title="Forensic Anomaly Severity"
              subtitle="Visual/quality anomalies detected across all screenings"
              icon={<ShieldAlert className="h-4.5 w-4.5" />}
              delay={0.25}
            >
              <HBarChart
                items={Object.entries(data.anomalySeverity).map(([sev, count]) => ({
                  label: sev,
                  value: count,
                  color: ANOMALY_SEVERITY_COLOR[sev] || STATUS.neutral,
                }))}
                valueSuffix=" flag(s)"
              />
            </Panel>
          </div>

          <Panel
            title="Priority Risk Queue"
            subtitle="Highest risk-score screenings across the organization, not just your own captures"
            icon={<Flame className="h-4.5 w-4.5" />}
            delay={0.3}
          >
            {data.riskQueue.length === 0 ? (
              <p className="text-xs text-ink-faint py-6 text-center">No high-risk or review-required screenings right now.</p>
            ) : (
              <div className="divide-y divide-border">
                {data.riskQueue.map((sc) => (
                  <Link
                    key={sc.id}
                    href={`/reports/${sc.screeningId}`}
                    className="flex items-center justify-between py-2.5 group hover:bg-sand-100 -mx-2 px-2 rounded-lg transition-colors duration-150"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-clay-600">{sc.screeningId}</span>
                        <Badge tone={sc.riskTier === "HIGH_RISK" ? "rose" : "amber"}>Score {sc.riskScore}</Badge>
                      </div>
                      <p className="text-xs text-ink-soft truncate mt-0.5">
                        {DOC_LABEL[sc.documentType] || sc.documentType} &bull; Operator: {sc.operator?.name || "Unknown"}
                      </p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-ink-faint group-hover:text-clay-600 transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Cross-Document Consistency Flags"
            subtitle="AICTE applications where extracted identifiers or dates disagree between the case's own documents"
            icon={<GitCompareArrows className="h-4.5 w-4.5" />}
            delay={0.35}
          >
            {data.crossDocumentFlagged.length === 0 ? (
              <p className="text-xs text-ink-faint py-6 text-center">No unresolved cross-document inconsistencies.</p>
            ) : (
              <div className="divide-y divide-border">
                {data.crossDocumentFlagged.map((app) => (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className="flex items-center justify-between py-2.5 group hover:bg-sand-100 -mx-2 px-2 rounded-lg transition-colors duration-150"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-bold text-clay-600">{app.applicationNumber}</span>
                      <p className="text-xs text-ink-soft truncate mt-0.5">{app.institutionName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge tone="rose">{app.flaggedRules} flag(s)</Badge>
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
  );
}
