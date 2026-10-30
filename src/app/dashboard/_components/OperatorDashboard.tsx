"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import {
  HBarChart,
  Panel,
  StatCard,
  CATEGORICAL,
} from "@/components/charts/Charts";
import {
  Scan,
  FileText,
  Gauge,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";

interface OperatorData {
  myScreeningsToday: number;
  myScreeningsTotal: number;
  avgProcessingTimeMs: number;
  avgOcrConfidence: number;
  docDistribution: Record<string, number>;
  needsAttention: {
    id: string;
    screeningId: string;
    documentType: string;
    status: string;
    riskTier: string;
  }[];
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
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<OperatorData | null>(null);
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
            My Screening Desk
          </h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Your own capture queue, scan quality, and items waiting on you — not
            the full organization&apos;s workload.
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
          Loading your screening activity…
        </div>
      ) : !data ? (
        <div className="py-24 text-center text-ink-faint text-sm">
          Unable to load dashboard data.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Scanned Today"
              value={data.myScreeningsToday}
              icon={<Scan className="h-3.5 w-3.5" />}
              tone="clay"
              delay={0}
            />
            <StatCard
              label="My Total Screenings"
              value={data.myScreeningsTotal}
              icon={<FileText className="h-3.5 w-3.5" />}
              tone="dusk"
              delay={0.05}
            />
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
              icon={<FileText className="h-[18px] w-[18px]" />}
              delay={0.2}
            >
              <HBarChart
                items={Object.entries(data.docDistribution).map(
                  ([type, count], i) => ({
                    label: DOC_LABEL[type] || type,
                    value: count,
                    color: CATEGORICAL[i % CATEGORICAL.length],
                  }),
                )}
                valueSuffix=" scan(s)"
              />
            </Panel>

            <Panel
              title="Needs Your Attention"
              subtitle="Your own captures flagged for review or with low OCR confidence — resubmit or escalate these"
              icon={<AlertTriangle className="h-[18px] w-[18px]" />}
              delay={0.25}
            >
              {data.needsAttention.length === 0 ? (
                <p className="text-xs text-ink-faint py-6 text-center">
                  Nothing needs attention right now.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {data.needsAttention.map((item) => (
                    <Link
                      key={item.id}
                      href={`/reports/${item.screeningId}`}
                      className="flex items-center justify-between py-2.5 group hover:bg-sand-100 -mx-2 px-2 rounded-lg transition-colors duration-150"
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-xs font-bold text-clay-600">
                          {item.screeningId}
                        </span>
                        <p className="text-xs text-ink-soft truncate mt-0.5">
                          {DOC_LABEL[item.documentType] || item.documentType}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          tone={item.status === "FLAGGED" ? "rose" : "amber"}
                        >
                          {item.status.replace(/_/g, " ")}
                        </Badge>
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
            icon={<Scan className="h-[18px] w-[18px]" />}
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
                      <span className="font-mono text-xs font-bold text-clay-600">
                        {sc.screeningId}
                      </span>
                      <p className="text-xs text-ink-soft truncate mt-0.5">
                        {DOC_LABEL[sc.documentType] || sc.documentType}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        tone={
                          sc.riskTier === "LOW_RISK"
                            ? "sage"
                            : sc.riskTier === "REVIEW_REQUIRED"
                              ? "amber"
                              : "rose"
                        }
                      >
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
