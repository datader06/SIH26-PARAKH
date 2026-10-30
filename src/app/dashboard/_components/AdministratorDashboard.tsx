"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import {
  DonutChart,
  Panel,
  StatCard,
  TrendBars,
  STATUS,
  CATEGORICAL,
} from "@/components/charts/Charts";
import {
  Users,
  Layers,
  Activity,
  Key,
  ArrowUpRight,
  AlertOctagon,
  GraduationCap,
} from "lucide-react";

interface AdministratorData {
  totalUsers: number;
  usersByRole: Record<string, number>;
  totalScreenings: number;
  totalApplications: number;
  volumeTrend: { label: string; screenings: number; applications: number }[];
  riskTierDistribution: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  scoreDistribution: { range: string; count: number }[];
  apiKeys: {
    name: string;
    isActive: boolean;
    lastUsedAt: string | null;
    createdAt: string;
  }[];
  ocrFailureRate: number;
  appDocOcrFailureRate: number;
  sourceUnavailableRate: number;
}

const RISK_TIER_COLOR: Record<string, string> = {
  LOW_RISK: STATUS.good,
  REVIEW_REQUIRED: STATUS.warning,
  HIGH_RISK: STATUS.critical,
};

const CATEGORY_LABEL: Record<string, string> = {
  EXTENSION_OF_APPROVAL: "Extension of Approval",
  NEW_PROGRAMME: "New Programme",
  INTAKE_CHANGE: "Intake Change",
  APPROVAL_CHANGE: "Approval Change",
};

const ROLE_LABEL: Record<string, string> = {
  ADMINISTRATOR: "Administrator",
  REVIEWER: "Reviewer",
  INVESTIGATOR: "Investigator",
  OPERATOR: "Operator",
};

export function AdministratorDashboard() {
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<AdministratorData | null>(null);
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

  const combinedVolume = data
    ? data.volumeTrend.map((pt) => ({
        label: pt.label,
        value: pt.screenings + pt.applications,
      }))
    : [];

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
            Organization Overview
          </h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Org-wide volume, system health, and access control — the full
            picture no other role can see.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/applications/insights"
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-sand-200 border border-border text-xs font-semibold text-ink-soft transition-colors duration-200 flex items-center gap-1.5"
          >
            <GraduationCap className="h-4 w-4" />
            <span>Portfolio Insights</span>
          </Link>
          <Link
            href="/api-access"
            className="px-3.5 py-2 rounded-xl bg-clay-500 hover:bg-clay-600 text-xs font-semibold text-white shadow-soft hover:shadow-card flex items-center gap-1.5 transition-all duration-200"
          >
            <Key className="h-4 w-4" />
            <span>Manage API Keys</span>
          </Link>
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
          Loading organization data…
        </div>
      ) : !data ? (
        <div className="py-24 text-center text-ink-faint text-sm">
          Unable to load dashboard data.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Users"
              value={data.totalUsers}
              icon={<Users className="h-3.5 w-3.5" />}
              tone="clay"
              delay={0}
            />
            <StatCard
              label="Total Screenings"
              value={data.totalScreenings}
              icon={<Activity className="h-3.5 w-3.5" />}
              tone="dusk"
              delay={0.05}
            />
            <StatCard
              label="AICTE Applications"
              value={data.totalApplications}
              icon={<GraduationCap className="h-3.5 w-3.5" />}
              tone="sage"
              delay={0.1}
            />
            <StatCard
              label="OCR Engine Failure Rate"
              value={`${data.ocrFailureRate}%`}
              icon={<AlertOctagon className="h-3.5 w-3.5" />}
              tone={data.ocrFailureRate > 10 ? "rose" : "amber"}
              sub="Share of identity-screening OCR attempts that returned zero-confidence"
              delay={0.15}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Panel
              title="14-Day Volume Trend"
              subtitle="Daily screenings + applications created, organization-wide"
              icon={<Activity className="h-[18px] w-[18px]" />}
              delay={0.2}
            >
              <TrendBars series={combinedVolume} color={CATEGORICAL[0]} />
            </Panel>

            <Panel
              title="Risk Tier Distribution"
              subtitle="All identity screenings by current risk tier"
              icon={<AlertOctagon className="h-[18px] w-[18px]" />}
              delay={0.25}
            >
              <DonutChart
                items={Object.entries(data.riskTierDistribution).map(
                  ([tier, count]) => ({
                    label: tier.replace(/_/g, " "),
                    value: count,
                    color: RISK_TIER_COLOR[tier] || STATUS.neutral,
                  }),
                )}
              />
            </Panel>

            <Panel
              title="Users by Role"
              subtitle="Headcount across the RBAC hierarchy"
              icon={<Users className="h-[18px] w-[18px]" />}
              delay={0.3}
            >
              <DonutChart
                items={Object.entries(data.usersByRole).map(
                  ([role, count], i) => ({
                    label: ROLE_LABEL[role] || role,
                    value: count,
                    color: CATEGORICAL[i % CATEGORICAL.length],
                  }),
                )}
              />
            </Panel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel
              title="AICTE Application Category Volume"
              subtitle="Case mix by regulatory application type"
              icon={<GraduationCap className="h-[18px] w-[18px]" />}
              delay={0.35}
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
              title="System Health Signals"
              subtitle="Failure and gap rates that only an administrator should act on"
              icon={<AlertOctagon className="h-[18px] w-[18px]" />}
              delay={0.4}
            >
              <div className="space-y-2.5 text-xs">
                {[
                  {
                    label: "Identity OCR Engine Failures",
                    value: `${data.ocrFailureRate}%`,
                  },
                  {
                    label: "AICTE Document OCR Gaps",
                    value: `${data.appDocOcrFailureRate}%`,
                  },
                  {
                    label: "Source Verification Unavailable",
                    value: `${data.sourceUnavailableRate}%`,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-sand-100"
                  >
                    <span className="text-ink-soft">{row.label}</span>
                    <span className="font-mono font-semibold text-ink">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <Panel
            title="API Key Health"
            subtitle="Active credentials issued to this organization and their last usage"
            icon={<Key className="h-[18px] w-[18px]" />}
            delay={0.45}
          >
            {data.apiKeys.length === 0 ? (
              <p className="text-xs text-ink-faint py-6 text-center">
                No API keys issued yet.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {data.apiKeys.map((key) => (
                  <div
                    key={key.name}
                    className="flex items-center justify-between py-2.5"
                  >
                    <span className="text-xs font-medium text-ink">
                      {key.name}
                    </span>
                    <div className="flex items-center gap-3 shrink-0 text-[11px] text-ink-faint font-mono">
                      <span>
                        {key.lastUsedAt
                          ? `Last used ${new Date(key.lastUsedAt).toLocaleDateString("en-IN")}`
                          : "Never used"}
                      </span>
                      <Badge tone={key.isActive ? "sage" : "neutral"}>
                        {key.isActive ? "ACTIVE" : "INACTIVE"}
                      </Badge>
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
