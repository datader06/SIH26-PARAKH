"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { HBarChart, Panel, StatCard, CATEGORICAL } from "@/components/charts/Charts";
import { Scan, FileText, Gauge, Clock, AlertTriangle, ArrowUpRight, ArrowRight } from "lucide-react";

interface OperatorData {
  myScreeningsToday: number;
  myScreeningsTotal: number;
  avgProcessingTimeMs: number;
  avgOcrConfidence: number;
  docDistribution: Record<string, number>;
  needsAttention: { id: string; screeningId: string; documentType: string; status: string; riskTier: string }[];
  recentScreenings: {
    id: string;
    screeningId: string;
    documentType: string;
    status: string;
    riskTier: string;
    riskScore: number;
    createdAt: string;
  }[];
}

const DOC_LABEL: Record<string, string> = {
  AADHAAR_CARD: "Aadhaar Card",
  PAN_CARD: "PAN Card",
  PASSPORT: "Passport",
  DRIVING_LICENCE: "Driving Licence",
  VOTER_ID: "Voter ID",
  UNKNOWN: "Unclassified",
};

export function OperatorDashboard() {
  const [data, setData] = useState<OperatorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border"
      >
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">My Screening Desk</h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Your own capture queue, scan quality, and items waiting on you — not the full organization's workload.
          </p>
        </div>
        <Link
          href="/scanner"
          className="px-4 py-2 rounded-xl bg-clay-500 hover:bg-clay-600 text-xs font-semibold text-white shadow-soft hover:shadow-card flex items-center gap-2 transition-all duration-200 shrink-0"
        >
          <Scan className="h-4 w-4" />
          <span>New Document Screening</span>
        </Link>
      </motion.div>

      {loading ? (
        <div className="py-24 text-center text-ink-faint text-sm">Loading your screening activity…</div>
      ) : !data ? (
        <div className="py-24 text-center text-ink-faint text-sm">Unable to load dashboard data.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Scanned Today" value={data.myScreeningsToday} icon={<Scan className="h-3.5 w-3.5" />} tone="clay" delay={0} />
            <StatCard label="My Total Screenings" value={data.myScreeningsTotal} icon={<FileText className="h-3.5 w-3.5" />} tone="dusk" delay={0.05} />
            <StatCard
              label="Avg. OCR Confidence"
              value={`${data.avgOcrConfidence}%`}
              icon={<Gauge className="h-3.5 w-3.5" />}
              tone="sage"
              sub="Scan quality on your captures"
              delay={0.1}
            />
            <StatCard
              label="Avg. Processing Time"
              value={`${(data.avgProcessingTimeMs / 1000).toFixed(2)}s`}
              icon={<Clock className="h-3.5 w-3.5" />}
              tone="amber"
              delay={0.15}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel
              title="My Document Mix"
              subtitle="Which identity document types you've been processing"
              icon={<FileText className="h-4.5 w-4.5" />}
              delay={0.2}
            >
              <HBarChart
                items={Object.entries(data.docDistribution).map(([type, count], i) => ({
                  label: DOC_LABEL[type] || type,
                  value: count,
                  color: CATEGORICAL[i % CATEGORICAL.length],
                }))}
                valueSuffix=" scan(s)"
              />
            </Panel>

            <Panel
              title="Needs Your Attention"
              subtitle="Your own captures flagged for review or with low OCR confidence — resubmit or escalate these"
              icon={<AlertTriangle className="h-4.5 w-4.5" />}
              delay={0.25}
            >
              {data.needsAttention.length === 0 ? (
                <p className="text-xs text-ink-faint py-6 text-center">Nothing needs attention right now.</p>
              ) : (
                <div className="divide-y divide-border">
                  {data.needsAttention.map((item) => (
                    <Link
                      key={item.id}
                      href={`/reports/${item.screeningId}`}
                      className="flex items-center justify-between py-2.5 group hover:bg-sand-100 -mx-2 px-2 rounded-lg transition-colors duration-150"
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-xs font-bold text-clay-600">{item.screeningId}</span>
                        <p className="text-xs text-ink-soft truncate mt-0.5">{DOC_LABEL[item.documentType] || item.documentType}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge tone={item.status === "FLAGGED" ? "rose" : "amber"}>{item.status.replace(/_/g, " ")}</Badge>
                        <ArrowUpRight className="h-3.5 w-3.5 text-ink-faint group-hover:text-clay-600 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <Panel
            title="My Recent Screenings"
            subtitle="The last screenings you personally processed"
            icon={<Scan className="h-4.5 w-4.5" />}
            delay={0.3}
          >
            {data.recentScreenings.length === 0 ? (
              <div className="py-10 text-center text-ink-faint text-xs">
                <p>No screening activity yet.</p>
                <Link
                  href="/scanner"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-clay-500 hover:bg-clay-600 text-white font-medium text-xs transition-colors duration-200"
                >
                  <Scan className="h-3.5 w-3.5" /> Launch Scanner
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.recentScreenings.map((sc) => (
                  <Link
                    key={sc.id}
                    href={`/reports/${sc.screeningId}`}
                    className="flex items-center justify-between py-2.5 group hover:bg-sand-100 -mx-2 px-2 rounded-lg transition-colors duration-150"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-bold text-clay-600">{sc.screeningId}</span>
                      <p className="text-xs text-ink-soft truncate mt-0.5">{DOC_LABEL[sc.documentType] || sc.documentType}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge tone={sc.riskTier === "LOW_RISK" ? "sage" : sc.riskTier === "REVIEW_REQUIRED" ? "amber" : "rose"}>
                        {sc.riskTier.replace(/_/g, " ")}
                      </Badge>
                      <ArrowRight className="h-3.5 w-3.5 text-ink-faint group-hover:text-clay-600 transition-colors" />
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
