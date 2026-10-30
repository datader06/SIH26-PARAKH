"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { StatCard } from "@/components/charts/Charts";
import { Dialog } from "@/components/ui/Dialog";
import { AppShell } from "@/components/layout/AppShell";
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileText,
  Building2,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  X,
  FileCheck,
} from "lucide-react";

interface ApplicationItem {
  id: string;
  applicationNumber: string;
  institutionName: string;
  permanentId: string;
  applicationCategory: string;
  academicYear: string;
  previousApprovalRef: string | null;
  terFeeStatus: string;
  approvedIntake: number;
  requestedIntake: number;
  facultyCount: number;
  requiredFacultyCount: number;
  validationStatus: string;
  complianceScore: number;
  lastValidatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    documents: number;
    findings: number;
    sourceChecks: number;
  };
}

interface ApplicationsResponse {
  success: boolean;
  data: ApplicationItem[];
  metrics: {
    total: number;
    pendingValidationCount: number;
    flaggedCount: number;
    readyCount: number;
  };
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    pendingValidationCount: 0,
    flaggedCount: 0,
    readyCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const requestVersion = React.useRef(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [resetVersion, setResetVersion] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  // Create form state
  const [formData, setFormData] = useState({
    institutionName: "",
    permanentId: "",
    applicationCategory: "EXTENSION_OF_APPROVAL",
    academicYear: "2026-2027",
    previousApprovalRef: "",
    previousApprovalStatus: "APPROVED",
    institutionRecordStatus: "ACTIVE",
    terFeeStatus: "PAID",
    terFeeReference: "",
    approvedIntake: "240",
    requestedIntake: "300",
    facultyCount: "16",
    requiredFacultyCount: "15",
    reviewerNotes: "",
  });

  const loadApplications = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams();
      if (appliedSearch) params.append("search", appliedSearch);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const res = await fetch(
        `/api/institution-applications?${params.toString()}`,
      );
      const json: ApplicationsResponse & { error?: string } = await res.json();
      if (version !== requestVersion.current) return;
      if (!res.ok || !json.success)
        throw new Error(
          json.error || "Unable to load applications. Please try again.",
        );
      if (json.success) {
        setApplications(json.data);
        if (json.metrics) setMetrics(json.metrics);
      }
    } catch (err) {
      if (version === requestVersion.current)
        setLoadError(
          err instanceof Error
            ? err.message
            : "Connection failed. Please try again.",
        );
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [appliedSearch, categoryFilter, statusFilter]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications, resetVersion]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search === appliedSearch) void loadApplications();
    else setAppliedSearch(search);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCreateError("");

    try {
      const res = await fetch("/api/institution-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setShowCreateModal(false);
        setFormData({
          institutionName: "",
          permanentId: "",
          applicationCategory: "EXTENSION_OF_APPROVAL",
          academicYear: "2026-2027",
          previousApprovalRef: "",
          previousApprovalStatus: "APPROVED",
          institutionRecordStatus: "ACTIVE",
          terFeeStatus: "PAID",
          terFeeReference: "",
          approvedIntake: "240",
          requestedIntake: "300",
          facultyCount: "16",
          requiredFacultyCount: "15",
          reviewerNotes: "",
        });
        await loadApplications();
      } else {
        setCreateError(json.error || "Failed to create application case");
      }
    } catch {
      setCreateError("Network communication error");
    } finally {
      setSubmitting(false);
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "DRAFT":
        return {
          label: "Draft Intake",
          color: "bg-slate-50 text-slate-700 border-slate-200",
        };
      case "VALIDATION_PENDING":
        return {
          label: "Validation Pending",
          color: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "RECTIFICATION_REQUESTED":
        return {
          label: "Deficiency Flagged",
          color: "bg-rose-50 text-rose-700 border-rose-200",
        };
      case "OFFICIAL_REVIEW_REQUIRED":
        return {
          label: "Review Required",
          color: "bg-clay-50 text-clay-700 border-clay-200",
        };
      case "READY_FOR_OFFICIAL_SCRUTINY":
        return {
          label: "Ready for Scrutiny",
          color: "bg-teal-50 text-teal-700 border-teal-200",
        };
      case "UNDER_REVIEW":
        return {
          label: "Under Official Review",
          color: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "CLOSED":
        return {
          label: "Closed",
          color: "bg-sand-100 text-ink-soft border-border",
        };
      default:
        return {
          label: status,
          color: "bg-slate-50 text-slate-700 border-slate-200",
        };
    }
  };

  const formatCategory = (cat: string) => {
    switch (cat) {
      case "EXTENSION_OF_APPROVAL":
        return "Extension of Approval (EoA)";
      case "NEW_PROGRAMME":
        return "New Programme / Course";
      case "INTAKE_CHANGE":
        return "Intake Capacity Variation";
      case "APPROVAL_CHANGE":
        return "Approval Modification";
      default:
        return cat.replace(/_/g, " ");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-clay-50 text-clay-700 border border-clay-200">
                AICTE PS 26261
              </span>
              <span className="text-xs text-ink-soft">
                Regulatory workspace
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight flex items-center gap-2.5">
              <GraduationCap className="h-6 w-6 text-clay-700" />
              <span>Institutional applications</span>
            </h1>
            <p className="text-xs text-ink-soft mt-1 max-w-3xl">
              A clear path from submitted evidence to informed scrutiny. Track
              cases, resolve deficiencies, and prepare for official review.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/applications/insights"
              className="px-4 py-2 rounded-lg bg-white hover:bg-sand-200 border border-border text-xs font-semibold text-ink-soft flex items-center gap-2 transition-colors duration-200"
            >
              <FileCheck className="h-4 w-4" />
              <span>Portfolio Insights</span>
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-clay-600 hover:bg-clay-700 text-xs font-semibold text-white shadow-md shadow-clay-900/10 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New application</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total cases"
            value={metrics.total}
            icon={<Building2 className="h-4 w-4" />}
            sub="Institutional applications"
          />
          <StatCard
            label="Awaiting validation"
            value={metrics.pendingValidationCount}
            icon={<Clock className="h-4 w-4" />}
            tone="amber"
            sub="Checklist yet to run"
          />
          <StatCard
            label="Needs rectification"
            value={metrics.flaggedCount}
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="rose"
            sub="Evidence needs attention"
          />
          <StatCard
            label="Ready for scrutiny"
            value={metrics.readyCount}
            icon={<ShieldCheck className="h-4 w-4" />}
            tone="sage"
            sub="Prepared for human review"
          />
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-xl bg-white border border-border space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex-1 w-full min-w-[220px]"
            >
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-faint" />
              <input
                aria-label="Search applications"
                type="search"
                placeholder="Institution, permanent ID, or case number"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-sand-100 border border-border rounded-lg pl-9 pr-20 py-2.5 text-xs text-ink placeholder-ink-faint focus:outline-none focus:border-clay-500"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-clay-700 hover:bg-clay-50"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <select
                aria-label="Application category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-sand-100 border border-border rounded-lg px-3 py-2 text-xs text-ink-soft focus:outline-none focus:border-clay-500"
              >
                <option value="ALL">All Application Categories</option>
                <option value="EXTENSION_OF_APPROVAL">
                  Extension of Approval (EoA)
                </option>
                <option value="NEW_PROGRAMME">New Programme / Course</option>
                <option value="INTAKE_CHANGE">Intake Change</option>
                <option value="APPROVAL_CHANGE">Approval Modification</option>
              </select>

              <select
                aria-label="Review status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-sand-100 border border-border rounded-lg px-3 py-2 text-xs text-ink-soft focus:outline-none focus:border-clay-500"
              >
                <option value="ALL">All Scrutiny Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="VALIDATION_PENDING">Validation Pending</option>
                <option value="RECTIFICATION_REQUESTED">
                  Deficiency Flagged
                </option>
                <option value="OFFICIAL_REVIEW_REQUIRED">
                  Review Required
                </option>
                <option value="READY_FOR_OFFICIAL_SCRUTINY">
                  Ready for Scrutiny
                </option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="CLOSED">Closed</option>
              </select>

              <button
                onClick={loadApplications}
                className="p-2 rounded-lg bg-sand-100 border border-border hover:bg-surface-50 text-ink-soft hover:text-ink transition-colors"
                title="Refresh records"
                aria-label="Refresh applications"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Applications Data Table */}
        <div className="rounded-xl bg-white border border-border overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="font-semibold text-ink">Case register</h2>
              <p className="mt-1 text-xs text-ink-soft">
                {loading
                  ? "Updating records…"
                  : `${applications.length} matching cases`}
              </p>
            </div>
            {(search || categoryFilter !== "ALL" || statusFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setAppliedSearch("");
                  setCategoryFilter("ALL");
                  setStatusFilter("ALL");
                  setResetVersion((value) => value + 1);
                }}
                className="text-xs font-semibold text-clay-700"
              >
                Clear filters
              </button>
            )}
          </div>
          {loadError ? (
            <div role="alert" className="p-10 text-center">
              <p className="text-sm text-rose-700">{loadError}</p>
              <button
                onClick={loadApplications}
                className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-semibold"
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <div role="status" className="p-12 text-center text-ink-soft">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-clay-700" />
              <p className="text-xs">Loading institutional dockets...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="inline-flex p-3 rounded-full bg-sand-100 border border-border text-ink-faint">
                <FileCheck className="h-8 w-8 text-clay-700" />
              </div>
              <h3 className="text-sm font-semibold text-ink">
                No applications to show
              </h3>
              <p className="text-xs text-ink-soft max-w-md mx-auto">
                No institutional cases match your current filters. Create an
                application case to begin attaching supporting regulatory
                evidence and executing compliance checklists.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-clay-600 hover:bg-clay-700 text-xs font-semibold text-white transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create Institutional Application</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-[13px]">
                <caption className="sr-only">
                  Institutional application cases, evidence, advisory scores,
                  and review status
                </caption>
                <thead className="bg-sand-100/50 text-ink-soft uppercase text-[10px] font-semibold tracking-wider border-b border-border">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Case Reference
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Institution & Code
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Intake & Ratio
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Evidence Docs
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Compliance Score
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Scrutiny Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-ink-soft">
                  {applications.map((app) => {
                    const st = formatStatus(app.validationStatus);
                    return (
                      <tr
                        key={app.id}
                        className="hover:bg-surface-50/50 transition-colors"
                      >
                        <td className="px-4 py-3.5 font-mono font-medium text-clay-700">
                          {app.applicationNumber}
                          <span className="block text-[10px] font-sans text-ink-faint">
                            AY {app.academicYear}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-ink">
                            {app.institutionName}
                          </div>
                          <div className="text-[10px] font-mono text-ink-soft flex items-center gap-1.5 mt-0.5">
                            <span>PID: {app.permanentId}</span>
                            <span className="text-ink-faint">•</span>
                            <span className="text-ink-faint">
                              TER: {app.terFeeStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[11px] text-ink-soft">
                            {formatCategory(app.applicationCategory)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-mono text-[11px] text-ink">
                            {app.approvedIntake} &rarr;{" "}
                            <span className="text-clay-700 font-bold">
                              {app.requestedIntake}
                            </span>
                          </div>
                          <div className="text-[10px] text-ink-faint font-mono">
                            Faculty: {app.facultyCount} /{" "}
                            {app.requiredFacultyCount} req
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-ink-soft">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-sand-100 text-ink-soft text-[10px]">
                              {app._count.documents} files
                            </span>
                            {app._count.findings > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">
                                {app._count.findings} rules
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-sand-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  app.complianceScore >= 80
                                    ? "bg-teal-500"
                                    : app.complianceScore >= 50
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                }`}
                                style={{
                                  width: `${app.lastValidatedAt ? app.complianceScore : 0}%`,
                                }}
                              />
                            </div>
                            <span className="font-mono font-bold text-xs text-ink">
                              {app.lastValidatedAt
                                ? `${app.complianceScore}%`
                                : "Not run"}
                            </span>
                          </div>
                          <span className="text-[10px] text-ink-faint block">
                            {app.lastValidatedAt ? "Validated" : "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${st.color}`}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link
                            href={`/applications/${app.id}`}
                            aria-label={`Open case ${app.applicationNumber} for ${app.institutionName}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-clay-50 hover:bg-clay-100 text-clay-700 border border-clay-200 text-xs font-semibold transition-all"
                          >
                            <span>Open Case</span>
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Regulatory Governance Disclaimer Notice */}
        <div className="p-3.5 rounded-xl bg-clay-50 border border-clay-200 text-[11px] text-clay-700 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 shrink-0 text-clay-700 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold">
              Statutory Decision Support Disclaimer:
            </span>{" "}
            PARAKH Document Intelligence provides automated preliminary
            compliance scoring, forensic optical character recognition, and
            cross-reference verification in adherence with the AICTE Approval
            Process Handbook (APH 2024-2027). All scoring outputs are advisory
            decision-support signals. Formal statutory scrutiny and final
            approval decisions rest strictly with competent AICTE authorities.
          </p>
        </div>
      </div>

      {/* New Application Intake Modal */}
      <Dialog
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Register institutional application"
        className="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5 pt-5 text-sm">
          {createError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs"
            >
              {createError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="field-1" className="text-ink-soft font-medium">
                Institution Name *
              </label>
              <input
                id="field-1"
                type="text"
                required
                placeholder="e.g. Apex Institute of Technology & Management"
                value={formData.institutionName}
                onChange={(e) =>
                  setFormData({ ...formData, institutionName: e.target.value })
                }
                className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-clay-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="field-2" className="text-ink-soft font-medium">
                AICTE Permanent ID (PID) *
              </label>
              <input
                id="field-2"
                type="text"
                required
                placeholder="e.g. 1-432901928"
                value={formData.permanentId}
                onChange={(e) =>
                  setFormData({ ...formData, permanentId: e.target.value })
                }
                className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink font-mono focus:outline-none focus:border-clay-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="field-3" className="text-ink-soft font-medium">
                Application Category *
              </label>
              <select
                id="field-3"
                value={formData.applicationCategory}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    applicationCategory: e.target.value,
                  })
                }
                className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-clay-500"
              >
                <option value="EXTENSION_OF_APPROVAL">
                  Extension of Approval (EoA)
                </option>
                <option value="NEW_PROGRAMME">New Programme / Course</option>
                <option value="INTAKE_CHANGE">Intake Capacity Variation</option>
                <option value="APPROVAL_CHANGE">Approval Modification</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="field-4" className="text-ink-soft font-medium">
                Academic Year
              </label>
              <input
                id="field-4"
                type="text"
                value={formData.academicYear}
                onChange={(e) =>
                  setFormData({ ...formData, academicYear: e.target.value })
                }
                className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-clay-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="field-5" className="text-ink-soft font-medium">
                Previous EoA Reference Number
              </label>
              <input
                id="field-5"
                type="text"
                placeholder="e.g. F.No. AICTE/AB/2025/1-432901928"
                value={formData.previousApprovalRef}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    previousApprovalRef: e.target.value,
                  })
                }
                className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink font-mono focus:outline-none focus:border-clay-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="field-6" className="text-ink-soft font-medium">
                TER Fee Status
              </label>
              <select
                id="field-6"
                value={formData.terFeeStatus}
                onChange={(e) =>
                  setFormData({ ...formData, terFeeStatus: e.target.value })
                }
                className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-clay-500"
              >
                <option value="PAID">PAID</option>
                <option value="PENDING">PENDING</option>
                <option value="EXEMPTED">EXEMPTED</option>
                <option value="DEFICIENT">DEFICIENT</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="field-7" className="text-ink-soft font-medium">
                TER Transaction Reference
              </label>
              <input
                id="field-7"
                type="text"
                placeholder="e.g. UTR-AICTE-2026-904128"
                value={formData.terFeeReference}
                onChange={(e) =>
                  setFormData({ ...formData, terFeeReference: e.target.value })
                }
                className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink font-mono focus:outline-none focus:border-clay-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="field-8" className="text-ink-soft font-medium">
                Current Approved Intake
              </label>
              <input
                id="field-8"
                type="number"
                value={formData.approvedIntake}
                onChange={(e) =>
                  setFormData({ ...formData, approvedIntake: e.target.value })
                }
                className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink font-mono focus:outline-none focus:border-clay-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="field-9" className="text-ink-soft font-medium">
                Requested Student Intake
              </label>
              <input
                id="field-9"
                type="number"
                value={formData.requestedIntake}
                onChange={(e) =>
                  setFormData({ ...formData, requestedIntake: e.target.value })
                }
                className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink font-mono focus:outline-none focus:border-clay-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="field-10" className="text-ink-soft font-medium">
                Declared Faculty Count
              </label>
              <input
                id="field-10"
                type="number"
                value={formData.facultyCount}
                onChange={(e) =>
                  setFormData({ ...formData, facultyCount: e.target.value })
                }
                className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink font-mono focus:outline-none focus:border-clay-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="field-11" className="text-ink-soft font-medium">
                Required Faculty (1:20 Norm)
              </label>
              <input
                id="field-11"
                type="number"
                value={formData.requiredFacultyCount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requiredFacultyCount: e.target.value,
                  })
                }
                className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink font-mono focus:outline-none focus:border-clay-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="field-12" className="text-ink-soft font-medium">
                Applicant / Reviewer Intake Notes
              </label>
              <textarea
                id="field-12"
                rows={2}
                placeholder="Initial case briefing, regional office notes, or special dispensation..."
                value={formData.reviewerNotes}
                onChange={(e) =>
                  setFormData({ ...formData, reviewerNotes: e.target.value })
                }
                className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-clay-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-lg bg-sand-100 hover:bg-surface-50 text-ink-soft text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-clay-600 hover:bg-clay-700 text-white text-xs font-semibold shadow-md shadow-clay-900/10 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Registering Case...</span>
                </>
              ) : (
                <span>Register Case</span>
              )}
            </button>
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}
