"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import {
  Scan,
  ShieldCheck,
  AlertTriangle,
  Clock,
  FileText,
  ArrowUpRight,
  Cpu,
  Layers,
  ArrowRight,
  GraduationCap,
} from "lucide-react";

interface MetricsData {
  totalScreenings: number;
  todayScreenings: number;
  requiresReviewCount: number;
  flaggedCount: number;
  lowRiskCount: number;
  verifiedRate: number;
  avgProcessingTime: number;
  avgOcrAccuracy: number;
  docDistribution: Record<string, number>;
  systemHealth: {
    ocrEngine: string;
    classifierEngine: string;
    forensicEngine: string;
    biometricsModule: string;
    parakhHubGateway: string;
    verificationGateway: string;
  };
}

interface RecentScreening {
  id: string;
  screeningId: string;
  documentType: string;
  status: string;
  riskScore: number;
  riskTier: string;
  processingTimeMs: number;
  createdAt: string;
  operator: { name: string };
  extractedFields: Array<{ fieldKey: string; maskedValue: string }>;
}

const cardIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const },
});

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [recentScreenings, setRecentScreenings] = useState<RecentScreening[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [mRes, sRes] = await Promise.all([
          fetch("/api/metrics"),
          fetch("/api/screenings?limit=5"),
        ]);
        const mData = await mRes.json();
        const sData = await sRes.json();

        if (mData.success) setMetrics(mData.data);
        if (sData.success) setRecentScreenings(sData.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  const formatDocName = (type: string) => type.replace(/_/g, " ").replace("CARD", "");

  const metricCards = [
    {
      label: "Total Screenings",
      value: metrics ? metrics.totalScreenings : "-",
      icon: FileText,
      tone: "clay" as const,
      sub: (
        <>
          <span className="text-sage-600 font-semibold">+{metrics?.todayScreenings || 0}</span> completed today
        </>
      ),
    },
    {
      label: "Verified Compliance Rate",
      value: metrics ? `${metrics.verifiedRate}%` : "-",
      icon: ShieldCheck,
      tone: "sage" as const,
      sub: "Low risk statutory conformity",
    },
    {
      label: "Review Required",
      value: metrics ? metrics.requiresReviewCount : "-",
      icon: AlertTriangle,
      tone: "amber" as const,
      sub: "Pending supervisor triage",
      emphasise: true,
    },
    {
      label: "Avg. Processing Time",
      value: metrics ? `${(metrics.avgProcessingTime / 1000).toFixed(2)}s` : "-",
      icon: Clock,
      tone: "dusk" as const,
      sub: (
        <>
          OCR accuracy avg: <span className="text-ink font-medium">{metrics?.avgOcrAccuracy || 92}%</span>
        </>
      ),
    },
  ];

  const toneBg: Record<string, string> = {
    clay: "bg-clay-50 text-clay-600",
    sage: "bg-sage-50 text-sage-600",
    amber: "bg-amber-50 text-amber-600",
    dusk: "bg-dusk-50 text-dusk-600",
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border"
        >
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
              Operational Screening Overview
            </h1>
            <p className="text-xs text-ink-soft mt-0.5">
              Live document verification throughput, risk analysis, and subsystem health.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/applications"
              className="px-3.5 py-2 rounded-xl bg-dusk-50 hover:bg-dusk-100 border border-dusk-100 text-xs font-semibold text-dusk-600 transition-colors duration-200 flex items-center gap-1.5"
            >
              <GraduationCap className="h-4 w-4" />
              <span>Institutional Applications</span>
            </Link>
            <Link
              href="/documents"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-sand-200 border border-border text-xs font-semibold text-ink-soft transition-colors duration-200"
            >
              Browse All Records
            </Link>
            <Link
              href="/scanner"
              className="px-4 py-2 rounded-xl bg-clay-500 hover:bg-clay-600 text-xs font-semibold text-white shadow-soft hover:shadow-card flex items-center gap-2 transition-all duration-200"
            >
              <Scan className="h-4 w-4" />
              <span>New Document Screening</span>
            </Link>
          </div>
        </motion.div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((card, i) => (
            <motion.div
              key={card.label}
              {...cardIn(i)}
              whileHover={{ y: -3 }}
              className="p-4 rounded-2xl bg-white border border-border shadow-soft hover:shadow-card transition-shadow duration-300"
            >
              <div className="flex items-center justify-between text-ink-soft mb-2">
                <span className="text-xs font-medium">{card.label}</span>
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${toneBg[card.tone]}`}>
                  <card.icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className={`text-2xl font-bold font-mono ${card.emphasise ? "text-amber-600" : "text-ink"}`}>
                {card.value}
              </div>
              <p className="text-[11px] text-ink-faint mt-1">{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* AICTE Spotlight */}
        <motion.div
          {...cardIn(4)}
          className="p-4 rounded-2xl bg-gradient-to-r from-dusk-50 via-white to-clay-50 border border-dusk-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-dusk-100 text-dusk-600 shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge tone="dusk">AICTE PS 26261</Badge>
                <h3 className="text-xs font-bold text-ink tracking-tight">
                  Institutional Applications & Regulatory Compliance Module
                </h3>
              </div>
              <p className="text-[11px] text-ink-soft mt-0.5">
                Multi-factor approval validation, statutory checklist engine, and evidence authentication for AICTE
                institutional applications.
              </p>
            </div>
          </div>
          <Link
            href="/applications"
            className="px-4 py-2 rounded-xl bg-clay-500 hover:bg-clay-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-soft hover:shadow-card transition-all duration-200 shrink-0"
          >
            <span>Open Applications Workspace</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>

        {/* Distribution + Subsystem */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            {...cardIn(5)}
            className="lg:col-span-2 p-5 rounded-2xl bg-white border border-border shadow-soft"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft flex items-center gap-2">
                <Layers className="h-4 w-4 text-clay-500" />
                <span>Identity Document Ingestion Distribution</span>
              </h3>
              <span className="text-[10px] text-ink-faint font-mono">Statutory Standards</span>
            </div>

            {metrics && (
              <div className="space-y-3.5">
                {[
                  { key: "AADHAAR_CARD", label: "Aadhaar Card (UIDAI)", color: "bg-clay-500" },
                  { key: "PAN_CARD", label: "PAN Card (Income Tax Dept)", color: "bg-dusk-500" },
                  { key: "PASSPORT", label: "Passport (ICAO 9303)", color: "bg-sage-500" },
                  { key: "DRIVING_LICENCE", label: "Driving Licence (MoRTH)", color: "bg-amber-500" },
                  { key: "VOTER_ID", label: "Voter ID (EPIC / ECI)", color: "bg-clay-300" },
                ].map((doc, i) => {
                  const count = metrics.docDistribution[doc.key] || 0;
                  const total = metrics.totalScreenings || 1;
                  const pct = Math.round((count / total) * 100);

                  return (
                    <div key={doc.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-soft font-medium">{doc.label}</span>
                        <span className="text-ink-faint font-mono">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-sand-200 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(4, pct)}%` }}
                          transition={{ duration: 0.7, delay: 0.1 + i * 0.05, ease: [0.16, 1, 0.3, 1] as const }}
                          className={`h-full rounded-full ${doc.color}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          <motion.div
            {...cardIn(6)}
            className="p-5 rounded-2xl bg-white border border-border shadow-soft flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-sage-500" />
                  <span>Subsystem Connectivity</span>
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  { label: "OCR Extraction Engine", value: "Tesseract / Cloud", tone: "sage" },
                  { label: "Classification & Forensics", value: "Active (v2.1)", tone: "sage" },
                  { label: "Biometric Face Analyzer", value: "Operational", tone: "sage" },
                  { label: "PARAKH Central Hub", value: "Cryptographically Linked", tone: "dusk" },
                  { label: "Govt. Verification Gateway", value: "Sandbox Mode", tone: "amber" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between p-2 rounded-xl bg-sand-100">
                    <span className="text-ink-soft">{row.label}</span>
                    <span
                      className={`text-[11px] font-mono font-medium ${
                        row.tone === "sage"
                          ? "text-sage-600"
                          : row.tone === "dusk"
                          ? "text-dusk-600"
                          : "text-amber-600"
                      }`}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-ink-soft">
              <span>Security Audit Integrity</span>
              <span className="text-sage-600 font-mono">100% Sealed</span>
            </div>
          </motion.div>
        </div>

        {/* Recent Screenings */}
        <motion.div {...cardIn(7)} className="p-5 rounded-2xl bg-white border border-border shadow-soft">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Recent Document Screenings
              </h3>
              <p className="text-[11px] text-ink-faint">
                Latest identity verifications processed by authorized operators.
              </p>
            </div>
            <Link
              href="/documents"
              className="text-xs text-clay-600 hover:text-clay-700 font-medium flex items-center gap-1"
            >
              <span>View All Records</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentScreenings.length === 0 ? (
            <div className="py-12 text-center text-ink-faint text-xs">
              <p className="text-sm font-semibold text-ink-soft">No screening activity yet</p>
              <p className="mt-1">Initiate a scan to begin processing identity documents.</p>
              <Link
                href="/scanner"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-clay-500 hover:bg-clay-600 text-white font-medium text-xs transition-colors duration-200"
              >
                <Scan className="h-3.5 w-3.5" /> Launch Scanner
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-ink-faint uppercase font-mono text-[10px]">
                    <th className="pb-2.5">Screening ID</th>
                    <th className="pb-2.5">Document Type</th>
                    <th className="pb-2.5">Protected Identifier</th>
                    <th className="pb-2.5">Risk Tier</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5">Operator</th>
                    <th className="pb-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentScreenings.map((sc) => {
                    const primaryField = sc.extractedFields?.find(
                      (f) => f.fieldKey.includes("number") || f.fieldKey.includes("epic")
                    );
                    const maskedId = primaryField?.maskedValue || "Protected";

                    return (
                      <tr key={sc.id} className="hover:bg-sand-100 transition-colors duration-150">
                        <td className="py-3 font-mono font-bold text-clay-600">{sc.screeningId}</td>
                        <td className="py-3 text-ink font-medium">{formatDocName(sc.documentType)}</td>
                        <td className="py-3 font-mono text-ink-soft">{maskedId}</td>
                        <td className="py-3">
                          <Badge
                            tone={
                              sc.riskTier === "LOW_RISK" ? "sage" : sc.riskTier === "REVIEW_REQUIRED" ? "amber" : "rose"
                            }
                          >
                            Score: {sc.riskScore} &bull; {sc.riskTier.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <span className="text-[11px] font-medium text-ink-soft">{sc.status.replace("_", " ")}</span>
                        </td>
                        <td className="py-3 text-ink-faint">{sc.operator?.name || "Operator"}</td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/reports/${sc.screeningId}`}
                            className="inline-flex items-center gap-1 text-clay-600 hover:text-clay-700 font-medium"
                          >
                            <span>Dossier</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </AppShell>
  );
}
