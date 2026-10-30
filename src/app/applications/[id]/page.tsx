"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { Dialog } from "@/components/ui/Dialog";
import { AppShell } from "@/components/layout/AppShell";
import {
  GraduationCap,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  Play,
  Share2,
  Building2,
  Copy,
  Check,
  Eye,
  FileCheck,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  X,
  FileSpreadsheet,
  Download,
} from "lucide-react";

interface ApplicationDetail {
  id: string;
  applicationNumber: string;
  institutionName: string;
  permanentId: string;
  applicationCategory: string;
  academicYear: string;
  previousApprovalRef: string | null;
  previousApprovalStatus: string;
  institutionRecordStatus: string;
  terFeeStatus: string;
  terFeeReference: string | null;
  approvedIntake: number;
  requestedIntake: number;
  facultyCount: number;
  requiredFacultyCount: number;
  infrastructureSubmitted: boolean;
  validationStatus: string;
  complianceScore: number;
  rulesetVersion: string;
  reviewerNotes: string | null;
  lastValidatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  documents: Array<{
    id: string;
    category: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    sha256Hash: string;
    issueDate: string | null;
    expiryDate: string | null;
    issuer: string | null;
    referenceNumber: string | null;
    ocrStatus: string;
    ocrText: string | null;
    ocrConfidence: number | null;
    duplicateOfId: string | null;
    createdAt: string;
  }>;
  findings: Array<{
    id: string;
    ruleId: string;
    ruleSource: string;
    rulesetVersion: string;
    severity: string;
    status: string;
    title: string;
    reason: string;
    documentReference: string | null;
    recommendedNextStep: string;
    createdAt: string;
  }>;
  sourceChecks: Array<{
    id: string;
    sourceProvider: string;
    verificationTarget: string;
    status: string;
    summary: string;
    detailsJson: string | null;
    verifiedBy: string | null;
    verifiedAt: string;
  }>;
  infrastructureReviews: Array<{
    id: string;
    documentId: string | null;
    evidenceType: string;
    observations: string;
    evidenceGaps: string | null;
    reviewStatus: string;
    reviewedAt: string | null;
    createdAt: string;
  }>;
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { user } = useSession();
  const userRole = user?.role;
  const [actionError, setActionError] = useState("");
  const canReview = ["ADMINISTRATOR", "REVIEWER", "INVESTIGATOR"].includes(
    userRole || "",
  );
  const [application, setApplication] = useState<ApplicationDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "findings" | "documents" | "sourceChecks" | "infrastructure" | "workflow"
  >("findings");
  const [isValidating, setIsValidating] = useState(false);
  const [isSourceChecking, setIsSourceChecking] = useState(false);
  const [validationSuccessMsg, setValidationSuccessMsg] = useState("");

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("AFFIDAVIT");
  const [uploadIssuer, setUploadIssuer] = useState("");
  const [uploadRefNumber, setUploadRefNumber] = useState("");
  const [uploadIssueDate, setUploadIssueDate] = useState("");
  const [uploadExpiryDate, setUploadExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewActionType, setReviewActionType] = useState(
    "REQUEST_RECTIFICATION",
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Manual source verification modal state
  const [showManualSourceModal, setShowManualSourceModal] = useState(false);
  const [manualSourceTarget, setManualSourceTarget] =
    useState("INSTITUTION_RECORD");
  const [manualSourceStatus, setManualSourceStatus] = useState("VERIFIED");
  const [manualSourceNotes, setManualSourceNotes] = useState("");
  const [manualSourceSubmitting, setManualSourceSubmitting] = useState(false);

  // Expanded OCR text states
  const [expandedOcr, setExpandedOcr] = useState<Record<string, boolean>>({});
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchApplication = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch(`/api/institution-applications/${id}`);
      if (!res.ok) {
        if (res.status === 401) {
          setLoadError(
            "Unauthorized: Please sign in with an authorized institutional operator session.",
          );
        } else if (res.status === 404) {
          setLoadError(
            `Institutional application docket '${id}' was not found in the current organization.`,
          );
        } else {
          setLoadError(
            "Failed to retrieve application docket. Please try again.",
          );
        }
        return;
      }
      const json = await res.json();
      if (json.success) {
        setApplication(json.data);
      } else {
        setLoadError(json.error || "Failed to load application details.");
      }
    } catch (err) {
      console.error("Failed to load application details", err);
      setLoadError(
        "Network error while connecting to application docket service.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) void fetchApplication();
  }, [id, fetchApplication]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setSelectedFile(null);
      setFileBase64("");
      setUploadError("File size exceeds maximum permitted limit of 15MB");
      return;
    }

    setSelectedFile(file);
    setUploadError("");

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileBase64) {
      setUploadError("Please select a valid PDF, PNG, or JPG document file");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const res = await fetch(`/api/institution-applications/${id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: uploadCategory,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          fileSize: selectedFile.size,
          base64Data: fileBase64,
          issuer: uploadIssuer || null,
          referenceNumber: uploadRefNumber || null,
          issueDate: uploadIssueDate || null,
          expiryDate: uploadExpiryDate || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowUploadModal(false);
        setSelectedFile(null);
        setFileBase64("");
        setUploadIssuer("");
        setUploadRefNumber("");
        setUploadIssueDate("");
        setUploadExpiryDate("");
        await fetchApplication();
      } else {
        setUploadError(json.error || "Failed to upload document");
      }
    } catch {
      setUploadError("Network communication error during document upload");
    } finally {
      setUploading(false);
    }
  };

  const handleRunValidation = async () => {
    setIsValidating(true);
    setValidationSuccessMsg("");
    setActionError("");
    try {
      const res = await fetch(`/api/institution-applications/${id}/validate`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(
          json.error || "The action could not be completed. Please try again.",
        );
      if (json.success) {
        setValidationSuccessMsg(
          `Regulatory checklist executed successfully: Score ${json.data.complianceScore}%, ${json.data.passedCount} Passed, ${json.data.failedCount} Failed.`,
        );
        await fetchApplication();
        setActiveTab("findings");
      }
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Connection failed. Please try again.",
      );
      console.error("Validation error", err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSourceCheck = async () => {
    setIsSourceChecking(true);
    setActionError("");
    try {
      const res = await fetch(
        `/api/institution-applications/${id}/source-check`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: "ALL" }),
        },
      );
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(
          json.error || "The action could not be completed. Please try again.",
        );
      if (json.success) {
        await fetchApplication();
        setActiveTab("sourceChecks");
      }
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Connection failed. Please try again.",
      );
      console.error("Source check error", err);
    } finally {
      setIsSourceChecking(false);
    }
  };

  const handleReviewActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setActionError("");
    try {
      const res = await fetch(`/api/institution-applications/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: reviewActionType,
          observationNotes: reviewNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(
          json.error || "The action could not be completed. Please try again.",
        );
      if (json.success) {
        setShowReviewModal(false);
        setReviewNotes("");
        await fetchApplication();
      }
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Connection failed. Please try again.",
      );
      console.error("Review action error", err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleManualSourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSourceSubmitting(true);
    setActionError("");
    try {
      const res = await fetch(
        `/api/institution-applications/${id}/source-check`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            manualDecision: {
              target: manualSourceTarget,
              status: manualSourceStatus,
              notes: manualSourceNotes,
              sourceProvider: "Authorized Official Reviewer Scrutiny",
            },
          }),
        },
      );
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(
          json.error || "The action could not be completed. Please try again.",
        );
      if (json.success) {
        setShowManualSourceModal(false);
        setManualSourceNotes("");
        await fetchApplication();
      }
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Connection failed. Please try again.",
      );
      console.error("Manual source verification error", err);
    } finally {
      setManualSourceSubmitting(false);
    }
  };

  const handleExportDossier = async () => {
    setActionError("");
    try {
      const res = await fetch(`/api/institution-applications/${id}/report`);
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(
          json.error || "The action could not be completed. Please try again.",
        );
      if (json.success) {
        // Download as JSON report or display
        const blob = new Blob([JSON.stringify(json.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${json.data.dossierId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Connection failed. Please try again.",
      );
      console.error("Failed to export dossier", err);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(key);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch {
      setActionError(
        "Clipboard access is unavailable. Select and copy the reference manually.",
      );
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div
          role="status"
          className="rounded-2xl border border-border bg-white p-16 text-center text-ink-soft"
        >
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-clay-700" />
          <p className="text-sm">
            Retrieving institutional docket and regulatory evidence...
          </p>
        </div>
      </AppShell>
    );
  }

  if (loadError || !application) {
    return (
      <AppShell>
        <div
          role="alert"
          className="p-12 max-w-lg mx-auto text-center space-y-4"
        >
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-ink">
            Application Docket Unavailable
          </h2>
          <p className="text-xs text-ink-soft leading-relaxed">
            {loadError ||
              "The requested application docket could not be retrieved or does not exist."}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/applications"
              className="px-4 py-2 rounded-lg bg-clay-600 hover:bg-clay-700 text-white text-xs font-semibold transition-colors"
            >
              Return to Applications List
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const passedFindings = application.findings.filter(
    (f) => f.status === "PASSED",
  );
  const failedFindings = application.findings.filter(
    (f) => f.status === "FAILED",
  );
  const warningFindings = application.findings.filter(
    (f) => f.status === "WARNING" || f.status === "MANUAL_REVIEW_REQUIRED",
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {actionError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {actionError}
          </div>
        )}
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-ink-soft">
          <Link
            href="/applications"
            className="hover:text-ink transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Applications</span>
          </Link>
          <span>/</span>
          <span className="text-ink font-mono font-medium">
            {application.applicationNumber}
          </span>
        </div>

        {/* Case Dossier Header */}
        <div className="p-6 rounded-2xl bg-white border border-border shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-clay-50 text-clay-700 border border-clay-200">
                  {application.applicationNumber}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-sand-100 text-ink-soft font-medium">
                  {application.applicationCategory.replace(/_/g, " ")}
                </span>
                <span className="text-xs font-mono text-ink-soft">
                  AY {application.academicYear}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold border bg-sand-200 text-ink-soft border-border">
                  {application.validationStatus.replace(/_/g, " ")}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
                {application.institutionName}
              </h1>
              <p className="text-xs font-mono text-ink-soft mt-1 flex flex-wrap items-center gap-3">
                <span>
                  AICTE Permanent ID:{" "}
                  <strong className="text-ink">
                    {application.permanentId}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  TER Fee:{" "}
                  <strong
                    className={
                      application.terFeeStatus === "PAID"
                        ? "text-teal-700"
                        : "text-amber-700"
                    }
                  >
                    {application.terFeeStatus}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Intake:{" "}
                  <strong className="text-ink">
                    {application.approvedIntake} &rarr;{" "}
                    {application.requestedIntake}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Faculty:{" "}
                  <strong className="text-ink">
                    {application.facultyCount} /{" "}
                    {application.requiredFacultyCount}
                  </strong>
                </span>
              </p>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleRunValidation}
                disabled={isValidating}
                className="px-4 py-2 rounded-lg bg-clay-600 hover:bg-clay-700 text-white text-xs font-semibold shadow-md shadow-clay-900/10 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Play
                  className={`h-3.5 w-3.5 ${isValidating ? "animate-spin" : ""}`}
                />
                <span>
                  {isValidating ? "Evaluating Rules..." : "Run Validation"}
                </span>
              </button>

              <button
                onClick={handleSourceCheck}
                disabled={isSourceChecking}
                className="px-3.5 py-2 rounded-lg bg-sand-100 hover:bg-surface-50 text-ink border border-border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isSourceChecking ? "animate-spin" : ""}`}
                />
                <span>External Source Check</span>
              </button>

              <button
                disabled={!canReview}
                title={
                  !canReview
                    ? "Reviewer, investigator, or administrator access required"
                    : undefined
                }
                onClick={() => {
                  setActionError("");
                  setShowReviewModal(true);
                }}
                className="px-3.5 py-2 rounded-lg bg-sand-100 hover:bg-surface-50 text-ink border border-border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-clay-700" />
                <span>Reviewer Action</span>
              </button>

              <button
                onClick={handleExportDossier}
                className="px-3.5 py-2 rounded-lg bg-sand-100 hover:bg-surface-50 text-ink-soft border border-border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Export JSON Dossier"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Dossier</span>
              </button>
            </div>
          </div>

          {/* Preliminary Compliance Score & Gauge */}
          <div className="pt-4 border-t border-border grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="p-3 rounded-xl bg-sand-100/50 border border-border flex items-center gap-3.5">
              <div className="relative flex items-center justify-center shrink-0">
                <div
                  className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-mono font-bold text-sm ${
                    !application.lastValidatedAt
                      ? "border-border text-ink-soft"
                      : application.complianceScore >= 80
                        ? "border-teal-500 text-teal-700"
                        : application.complianceScore >= 50
                          ? "border-amber-500 text-amber-700"
                          : "border-rose-500 text-rose-700"
                  }`}
                >
                  {application.lastValidatedAt
                    ? `${application.complianceScore}%`
                    : "—"}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider block">
                  Checklist Score
                </span>
                <span className="text-xs font-bold text-ink">
                  {!application.lastValidatedAt
                    ? "Validation not run"
                    : application.complianceScore >= 80
                      ? "Preliminary Compliant"
                      : application.complianceScore >= 50
                        ? "Observations Flagged"
                        : "Deficiencies Detected"}
                </span>
                <span className="text-[10px] text-ink-faint block font-mono">
                  Ruleset: {application.rulesetVersion}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-sand-100/50 border border-border text-xs">
              <span className="text-[10px] text-ink-soft uppercase tracking-wider block font-semibold mb-1">
                Checklist Results
              </span>
              <div className="flex flex-wrap items-center gap-3 font-mono font-bold">
                <span className="text-teal-700">
                  {passedFindings.length} Passed
                </span>
                <span className="text-rose-700">
                  {failedFindings.length} Failed
                </span>
                <span className="text-amber-700">
                  {warningFindings.length} Warning
                </span>
              </div>
              <span className="text-[10px] text-ink-faint block mt-1">
                {application.findings.length} total regulatory checks evaluated
              </span>
            </div>

            <div className="p-3 rounded-xl bg-sand-100/50 border border-border text-xs">
              <span className="text-[10px] text-ink-soft uppercase tracking-wider block font-semibold mb-1">
                Evidence Manifest
              </span>
              <div className="font-mono font-bold text-ink">
                {application.documents.length} Supporting Files Uploaded
              </div>
              <span className="text-[10px] text-ink-faint block mt-1">
                {application.documents.filter((d) => d.duplicateOfId).length > 0
                  ? "Hash collisions detected"
                  : "All document SHA-256 hashes unique"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-sand-100/50 border border-border text-xs">
              <span className="text-[10px] text-ink-soft uppercase tracking-wider block font-semibold mb-1">
                External Source Standing
              </span>
              <div className="font-mono font-bold text-amber-700">
                {application.sourceChecks.length > 0
                  ? `${application.sourceChecks.filter((s) => s.status === "VERIFIED").length} Verified / ${application.sourceChecks.length} Checked`
                  : "Checks Pending"}
              </div>
              <span className="text-[10px] text-ink-faint block mt-1">
                AICTE Registry & Treasury Connectors
              </span>
            </div>
          </div>

          {/* Validation Success Banner */}
          {validationSuccessMsg && (
            <div
              role="status"
              className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-700" />
                <span>{validationSuccessMsg}</span>
              </div>
              <button
                aria-label="Dismiss validation result"
                onClick={() => setValidationSuccessMsg("")}
                className="text-teal-700 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Workspace Tab Bar */}
        <div className="flex items-center gap-2 border-b border-border overflow-x-auto">
          <button
            aria-pressed={activeTab === "findings"}
            onClick={() => setActiveTab("findings")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "findings"
                ? "border-clay-600 text-clay-700"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Compliance Findings ({application.findings.length})</span>
          </button>

          <button
            aria-pressed={activeTab === "documents"}
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "documents"
                ? "border-clay-600 text-clay-700"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Evidence Documents ({application.documents.length})</span>
          </button>

          <button
            aria-pressed={activeTab === "sourceChecks"}
            onClick={() => setActiveTab("sourceChecks")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "sourceChecks"
                ? "border-clay-600 text-clay-700"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>
              Issuing Authority Verification ({application.sourceChecks.length})
            </span>
          </button>

          <button
            aria-pressed={activeTab === "infrastructure"}
            onClick={() => setActiveTab("infrastructure")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "infrastructure"
                ? "border-clay-600 text-clay-700"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>
              Infrastructure Scrutiny (
              {application.infrastructureReviews.length})
            </span>
          </button>

          <button
            aria-pressed={activeTab === "workflow"}
            onClick={() => setActiveTab("workflow")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "workflow"
                ? "border-clay-600 text-clay-700"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Official Scrutiny Workflow</span>
          </button>
        </div>

        {/* Tab 1: Compliance Findings */}
        {activeTab === "findings" && (
          <div className="space-y-4">
            {application.findings.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-white border border-border space-y-3">
                <ShieldCheck className="h-8 w-8 mx-auto text-ink-faint" />
                <h3 className="text-sm font-semibold text-ink">
                  No Regulatory Findings Yet
                </h3>
                <p className="text-xs text-ink-soft max-w-md mx-auto">
                  Click the <strong>Run Validation</strong> button above to
                  evaluate this case against AICTE Approval Process Handbook
                  (APH 2024-2027) regulatory checklists.
                </p>
                <button
                  onClick={handleRunValidation}
                  disabled={isValidating}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-clay-600 hover:bg-clay-700 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Execute Validation Engine</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {application.findings.map((f) => {
                  const isFailed = f.status === "FAILED";
                  const isWarning =
                    f.status === "WARNING" ||
                    f.status === "MANUAL_REVIEW_REQUIRED";
                  const isPassed = f.status === "PASSED";

                  return (
                    <div
                      key={f.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isFailed
                          ? "bg-rose-50 border-rose-200/50"
                          : isWarning
                            ? "bg-amber-50 border-amber-200/50"
                            : "bg-white border-border"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {isFailed ? (
                            <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />
                          ) : isWarning ? (
                            <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
                          )}
                          <h4 className="text-xs font-bold text-ink tracking-tight">
                            {f.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold ${
                              f.severity === "CRITICAL"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : f.severity === "HIGH"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-sand-100 text-ink-soft"
                            }`}
                          >
                            {f.severity}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-sand-100 text-ink-soft">
                            {f.status}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-ink-soft leading-relaxed mb-2.5">
                        {f.reason}
                      </p>

                      <div className="pt-2.5 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                        <span className="text-ink-soft">
                          <strong className="text-ink-soft">
                            Statutory Norm:
                          </strong>{" "}
                          {f.ruleSource}
                        </span>
                        <span className="text-clay-700 font-medium">
                          Next Step: {f.recommendedNextStep}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Evidence Documents Manifest */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-ink">
                  Attached Institutional Evidence
                </h3>
                <p className="text-xs text-ink-soft">
                  Authenticated supporting documents, cryptographic checksums,
                  and OCR telemetry.
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-3.5 py-2 rounded-lg bg-clay-600 hover:bg-clay-700 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Upload Supporting Document</span>
              </button>
            </div>

            {application.documents.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-white border border-border space-y-3">
                <UploadCloud className="h-8 w-8 mx-auto text-ink-faint" />
                <h3 className="text-sm font-semibold text-ink">
                  No Supporting Documents Uploaded
                </h3>
                <p className="text-xs text-ink-soft max-w-md mx-auto">
                  Upload affidavits, previous approval letters, faculty
                  declarations, and infrastructure evidence to satisfy
                  regulatory checklists.
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-clay-600 hover:bg-clay-700 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload Document</span>
                </button>
              </div>
            ) : (
              <div className="rounded-xl bg-white border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-sand-100/50 text-ink-soft uppercase text-[10px] font-semibold tracking-wider border-b border-border">
                      <tr>
                        <th scope="col" className="px-4 py-3">
                          Category
                        </th>
                        <th scope="col" className="px-4 py-3">
                          File Name & Size
                        </th>
                        <th scope="col" className="px-4 py-3">
                          SHA-256 Hash
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Validity / Dates
                        </th>
                        <th scope="col" className="px-4 py-3">
                          OCR Extraction
                        </th>
                        <th scope="col" className="px-4 py-3 text-right">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-ink-soft">
                      {application.documents.map((doc) => {
                        const isExpired =
                          doc.expiryDate &&
                          new Date(doc.expiryDate) < new Date();
                        const isDupe = Boolean(doc.duplicateOfId);
                        const isExpanded = Boolean(expandedOcr[doc.id]);

                        return (
                          <React.Fragment key={doc.id}>
                            <tr className="hover:bg-surface-50/50 transition-colors">
                              <td className="px-4 py-3.5">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-sand-100 text-ink-soft">
                                  {doc.category.replace(/_/g, " ")}
                                </span>
                                {isDupe && (
                                  <span className="block mt-1 text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />{" "}
                                    Duplicate Hash
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="font-semibold text-ink">
                                  {doc.fileName}
                                </div>
                                <div className="text-[10px] text-ink-faint font-mono">
                                  {(doc.fileSize / 1024).toFixed(1)} KB •{" "}
                                  {doc.mimeType}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 font-mono text-[10px] text-ink-soft">
                                <div className="flex items-center gap-1.5">
                                  <span>{doc.sha256Hash.slice(0, 16)}...</span>
                                  <button
                                    onClick={() =>
                                      copyToClipboard(doc.sha256Hash, doc.id)
                                    }
                                    className="p-1 hover:text-ink transition-colors"
                                    title="Copy SHA-256 hash"
                                    aria-label={`Copy SHA-256 hash for ${doc.fileName}`}
                                  >
                                    {copiedHash === doc.id ? (
                                      <Check className="h-3 w-3 text-teal-700" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-[11px]">
                                {doc.expiryDate ? (
                                  <div>
                                    <span
                                      className={
                                        isExpired
                                          ? "text-rose-700 font-semibold"
                                          : "text-slate-700"
                                      }
                                    >
                                      Exp: {doc.expiryDate.split("T")[0]}
                                    </span>
                                    {isExpired && (
                                      <span className="text-[10px] text-rose-700 block font-semibold">
                                        Expired
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-ink-faint">
                                    Not specified
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    doc.ocrStatus === "EXTRACTED"
                                      ? "bg-teal-50 text-teal-700 border border-teal-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  {doc.ocrStatus.replace(/_/g, " ")}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                {doc.ocrText && (
                                  <button
                                    aria-expanded={!!expandedOcr[doc.id]}
                                    onClick={() =>
                                      setExpandedOcr((prev) => ({
                                        ...prev,
                                        [doc.id]: !prev[doc.id],
                                      }))
                                    }
                                    className="p-1.5 rounded-lg bg-sand-100 hover:bg-surface-50 text-ink-soft text-xs inline-flex items-center gap-1 transition-colors"
                                  >
                                    <span>OCR</span>
                                    {isExpanded ? (
                                      <ChevronUp className="h-3 w-3" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3" />
                                    )}
                                  </button>
                                )}
                              </td>
                            </tr>
                            {isExpanded && doc.ocrText && (
                              <tr className="bg-sand-100/30">
                                <td colSpan={6} className="p-4 text-xs">
                                  <div className="p-3 rounded-lg bg-sand-100 border border-border font-mono text-[11px] text-ink-soft max-h-48 overflow-y-auto whitespace-pre-wrap">
                                    {doc.ocrText}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Issuing Authority Verification */}
        {activeTab === "sourceChecks" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-ink">
                  External Authority Verification
                </h3>
                <p className="text-xs text-ink-soft">
                  Issuing-authority adapters, master registry corroboration, and
                  manual reviewer verification logs.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={!canReview}
                  title={
                    !canReview
                      ? "Reviewer, investigator, or administrator access required"
                      : undefined
                  }
                  onClick={() => {
                    setActionError("");
                    setShowManualSourceModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-sand-100 hover:bg-surface-50 text-ink border border-border text-xs font-semibold transition-colors cursor-pointer"
                >
                  Record Manual Verification
                </button>
                <button
                  onClick={handleSourceCheck}
                  disabled={isSourceChecking}
                  className="px-3.5 py-1.5 rounded-lg bg-clay-600 hover:bg-clay-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isSourceChecking ? "animate-spin" : ""}`}
                  />
                  <span>Execute Gateway Checks</span>
                </button>
              </div>
            </div>

            {application.sourceChecks.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-white border border-border space-y-3">
                <Building2 className="h-8 w-8 mx-auto text-ink-faint" />
                <h3 className="text-sm font-semibold text-ink">
                  No External Source Checks Dispatched
                </h3>
                <p className="text-xs text-ink-soft max-w-md mx-auto">
                  Execute the institutional gateway check to verify standing
                  against the AICTE Central Registry or record manual
                  verification.
                </p>
                <button
                  onClick={handleSourceCheck}
                  disabled={isSourceChecking}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-clay-600 hover:bg-clay-700 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Execute Source Checks</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {application.sourceChecks.map((sc) => (
                  <div
                    key={sc.id}
                    className="p-4 rounded-xl bg-white border border-border space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-clay-700 shrink-0" />
                        <h4 className="text-xs font-bold text-ink">
                          {sc.sourceProvider}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sand-100 text-ink-soft">
                          {sc.verificationTarget}
                        </span>
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          sc.status === "VERIFIED"
                            ? "bg-teal-50 text-teal-700 border border-teal-200"
                            : sc.status === "SOURCE_UNAVAILABLE"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {sc.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <p className="text-xs text-ink-soft leading-relaxed">
                      {sc.summary}
                    </p>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-ink-faint font-mono">
                      <span>
                        Verified By: {sc.verifiedBy || "SYSTEM_GATEWAY"}
                      </span>
                      <span>
                        {sc.verifiedAt.replace("T", " ").slice(0, 19)} UTC
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Infrastructure Scrutiny */}
        {activeTab === "infrastructure" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-ink">
                Instructional & Physical Infrastructure Scrutiny
              </h3>
              <p className="text-xs text-ink-soft">
                Evaluation of classroom, laboratory, floor plan, and
                barrier-free facility submissions.
              </p>
            </div>

            {application.infrastructureReviews.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-white border border-border space-y-3">
                <Layers className="h-8 w-8 mx-auto text-ink-faint" />
                <h3 className="text-sm font-semibold text-ink">
                  No Infrastructure Evidence Logged
                </h3>
                <p className="text-xs text-ink-soft max-w-md mx-auto">
                  Upload geo-tagged photographs or floor plan blueprints under
                  category <strong>INFRASTRUCTURE_EVIDENCE</strong> in the
                  Evidence Documents tab.
                </p>
                <button
                  onClick={() => {
                    setUploadCategory("INFRASTRUCTURE_EVIDENCE");
                    setShowUploadModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-clay-600 hover:bg-clay-700 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload Infrastructure Photo</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {application.infrastructureReviews.map((ir) => (
                  <div
                    key={ir.id}
                    className="p-4 rounded-xl bg-white border border-border space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs font-bold text-ink flex items-center gap-2">
                        <Layers className="h-4 w-4 text-clay-700" />
                        <span>{ir.evidenceType.replace(/_/g, " ")}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sand-100 text-ink-soft">
                        {ir.reviewStatus.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-ink-soft">{ir.observations}</p>
                    {ir.evidenceGaps && (
                      <p className="text-xs text-amber-700">
                        Gaps: {ir.evidenceGaps}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Review Workflow & Audit Log */}
        {activeTab === "workflow" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white border border-border space-y-3">
              <h3 className="text-sm font-bold text-ink">
                Reviewer Scrutiny Notes & Status History
              </h3>
              {application.reviewerNotes ? (
                <div className="p-3 rounded-lg bg-sand-100/50 border border-border text-xs text-ink-soft whitespace-pre-wrap font-mono leading-relaxed">
                  {application.reviewerNotes}
                </div>
              ) : (
                <p className="text-xs text-ink-faint">
                  No reviewer observations recorded yet.
                </p>
              )}

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-ink-soft">
                  Current Status:{" "}
                  <strong className="text-ink">
                    {application.validationStatus}
                  </strong>
                </span>
                <button
                  disabled={!canReview}
                  title={
                    !canReview
                      ? "Reviewer, investigator, or administrator access required"
                      : undefined
                  }
                  onClick={() => {
                    setActionError("");
                    setShowReviewModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-clay-600 hover:bg-clay-700 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Update Scrutiny Status
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      <Dialog
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        title="Upload regulatory evidence"
        className="max-w-lg"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-5 pt-5 text-sm">
          {uploadError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs"
            >
              {uploadError}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="field-1" className="text-ink-soft font-medium">
              Document Category *
            </label>
            <select
              id="field-1"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-clay-500"
            >
              <option value="AFFIDAVIT">Affidavit / Undertaking</option>
              <option value="PREVIOUS_EOA">
                Previous Academic Year EoA Letter
              </option>
              <option value="FACULTY_DECLARATION">
                Faculty Roster Declaration
              </option>
              <option value="TER_FEE_RECEIPT">
                TER Processing Fee Receipt
              </option>
              <option value="INFRASTRUCTURE_EVIDENCE">
                Infrastructure Evidence (Photos/Plans)
              </option>
              <option value="NOC_PERMISSION">
                State Government NoC / Affiliation
              </option>
              <option value="LEASE_PROPERTY_EVIDENCE">
                Land / Property Deed
              </option>
              <option value="PROGRAMME_INTAKE_EVIDENCE">
                Curriculum & Intake Justification
              </option>
              <option value="ACCREDITATION_CERTIFICATE">
                Accreditation Certificate (NBA/NAAC)
              </option>
              <option value="OTHER">Other Supporting Document</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="field-2" className="text-ink-soft font-medium">
              Select File (PDF, PNG, JPG &mdash; Max 15MB) *
            </label>
            <input
              id="field-2"
              type="file"
              required
              accept=".pdf,image/png,image/jpeg,image/jpg"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-clay-500 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-clay-600 file:text-white hover:file:bg-clay-600"
            />
            {selectedFile && (
              <p className="text-[11px] text-ink-soft font-mono">
                Selected: {selectedFile.name} (
                {(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="field-3" className="text-ink-soft font-medium">
                Issuing Authority
              </label>
              <input
                id="field-3"
                type="text"
                placeholder="e.g. AICTE, State Govt, Bank"
                value={uploadIssuer}
                onChange={(e) => setUploadIssuer(e.target.value)}
                className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-clay-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="field-4" className="text-ink-soft font-medium">
                Reference Number
              </label>
              <input
                id="field-4"
                type="text"
                placeholder="e.g. F.No. / Receipt No."
                value={uploadRefNumber}
                onChange={(e) => setUploadRefNumber(e.target.value)}
                className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink font-mono focus:outline-none focus:border-clay-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="field-5" className="text-ink-soft font-medium">
                Issue Date
              </label>
              <input
                id="field-5"
                type="date"
                value={uploadIssueDate}
                onChange={(e) => setUploadIssueDate(e.target.value)}
                className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-clay-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="field-6" className="text-ink-soft font-medium">
                Expiry Date (if any)
              </label>
              <input
                id="field-6"
                type="date"
                value={uploadExpiryDate}
                onChange={(e) => setUploadExpiryDate(e.target.value)}
                className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-clay-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="px-4 py-2 rounded-lg bg-sand-100 hover:bg-surface-50 text-ink-soft text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2 rounded-lg bg-clay-600 hover:bg-clay-700 text-white text-xs font-semibold shadow-md shadow-clay-900/10 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Hashing & Storing...</span>
                </>
              ) : (
                <span>Upload & Process Evidence</span>
              )}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Reviewer Action Modal */}
      <Dialog
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        title="Record review action"
        className="max-w-lg"
      >
        <form
          onSubmit={handleReviewActionSubmit}
          className="space-y-5 pt-5 text-sm"
        >
          {actionError && (
            <p
              role="alert"
              className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
            >
              {actionError}
            </p>
          )}
          <div className="space-y-1.5">
            <label htmlFor="field-7" className="text-ink-soft font-medium">
              Scrutiny Action *
            </label>
            <select
              id="field-7"
              value={reviewActionType}
              onChange={(e) => setReviewActionType(e.target.value)}
              className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-clay-500"
            >
              <option value="REQUEST_RECTIFICATION">
                Request Rectification (Deficiency Flagged)
              </option>
              <option value="MARK_UNDER_REVIEW">
                Mark Under Official Scrutiny Review
              </option>
              <option value="ESCALATE_FOR_SCRUTINY">
                Escalate — Ready for Scrutiny Committee
              </option>
              <option value="RECORD_OBSERVATION">
                Record Observation (Keep Status)
              </option>
              {userRole === "ADMINISTRATOR" && (
                <option value="CLOSE_CASE">Administrative case closure</option>
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="field-8" className="text-ink-soft font-medium">
              Observations / Deficiency Notice *
            </label>
            <textarea
              id="field-8"
              rows={4}
              required
              placeholder="Detail specific observations, missing statutory documents, or reasons for status progression..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-clay-500"
            />
          </div>

          <div className="p-3 rounded-lg bg-clay-50 border border-clay-200 text-[11px] text-clay-700">
            All status transitions and observations are cryptographically
            recorded in the immutable audit log with reviewer credentials.
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="px-4 py-2 rounded-lg bg-sand-100 hover:bg-surface-50 text-ink-soft text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reviewSubmitting}
              className="px-5 py-2 rounded-lg bg-clay-600 hover:bg-clay-700 text-white text-xs font-semibold shadow-md shadow-clay-900/10 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reviewSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Submit Review Action</span>
              )}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Manual Source Verification Modal */}
      <Dialog
        open={showManualSourceModal}
        onOpenChange={setShowManualSourceModal}
        title="Record manual source verification"
        className="max-w-lg"
      >
        <form
          onSubmit={handleManualSourceSubmit}
          className="space-y-5 pt-5 text-sm"
        >
          {actionError && (
            <p
              role="alert"
              className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
            >
              {actionError}
            </p>
          )}
          <div className="space-y-1.5">
            <label htmlFor="field-9" className="text-ink-soft font-medium">
              Verification Target *
            </label>
            <select
              id="field-9"
              value={manualSourceTarget}
              onChange={(e) => setManualSourceTarget(e.target.value)}
              className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-clay-500"
            >
              <option value="INSTITUTION_RECORD">
                AICTE Institutional Master Record
              </option>
              <option value="TER_PAYMENT">TER Fee Bank Transaction UTR</option>
              <option value="EOA_RECORD">
                Previous Academic Year EoA Letter
              </option>
              <option value="ACCREDITATION">
                NBA / NAAC Accreditation Standing
              </option>
              <option value="NOC_VERIFICATION">
                State Government NoC Gazette
              </option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="field-10" className="text-ink-soft font-medium">
              Verification Result *
            </label>
            <select
              id="field-10"
              value={manualSourceStatus}
              onChange={(e) => setManualSourceStatus(e.target.value)}
              className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-clay-500"
            >
              <option value="VERIFIED">
                VERIFIED (Authenticity Corroborated)
              </option>
              <option value="MISMATCH_DETECTED">
                MISMATCH DETECTED (Discrepancy with Portal Record)
              </option>
              <option value="EXPIRED">EXPIRED (Validity Date Elapsed)</option>
              <option value="MANUAL_REVIEW_REQUIRED">
                MANUAL REVIEW REQUIRED (Pending Physical Inspection)
              </option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="field-11" className="text-ink-soft font-medium">
              Verification Notes / Dispatch Order *
            </label>
            <textarea
              id="field-11"
              rows={3}
              required
              placeholder="Record order number, verification method, portal lookup reference, or inspector notes..."
              value={manualSourceNotes}
              onChange={(e) => setManualSourceNotes(e.target.value)}
              className="w-full bg-sand-100 border border-border rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-clay-500"
            />
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowManualSourceModal(false)}
              className="px-4 py-2 rounded-lg bg-sand-100 hover:bg-surface-50 text-ink-soft text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={manualSourceSubmitting}
              className="px-5 py-2 rounded-lg bg-clay-600 hover:bg-clay-700 text-white text-xs font-semibold shadow-md shadow-clay-900/10 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {manualSourceSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <span>Record Verification</span>
              )}
            </button>
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}
