"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LoadingState } from "@/components/ui/LoadingState";
import { AppShell } from "@/components/layout/AppShell";
import {
  Shield,
  Printer,
  Download,
  Send,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  User,
  Building2,
  Lock,
  ArrowLeft,
  RefreshCw,
  Hash,
  ExternalLink,
} from "lucide-react";

export default function ReportDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [session, setSession] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPurging, setIsPurging] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecord() {
      try {
        const res = await fetch(`/api/screenings/${id}`);
        const json = await res.json();
        if (json.success) {
          setSession(json.data);
        } else {
          setErrorMessage(json.error || "This screening could not be loaded.");
        }
      } catch (err) {
        setErrorMessage(
          "Unable to load this dossier. Check your connection and refresh.",
        );
      } finally {
        setLoading(false);
      }
    }
    loadRecord();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDispatch = async () => {
    if (!session) return;
    setDispatchStatus("TRANSMITTING");
    try {
      const res = await fetch(`/api/screenings/${session.id}/parakh-dispatch`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setDispatchStatus(
          `${json.receipt.status} (${json.receipt.parakhTransactionId})`,
        );
        setSession({
          ...session,
          parakhHandoff: {
            parakhTransactionId: json.receipt.parakhTransactionId,
            dispatchStatus: json.receipt.status,
          },
        });
      } else {
        setDispatchStatus("FAILED");
      }
    } catch {
      setDispatchStatus("FAILED");
    }
  };

  const handlePurge = async () => {
    if (
      !confirm(
        "Are you sure you want to permanently purge this document image in accordance with organizational privacy retention policy? This action cannot be undone.",
      )
    ) {
      return;
    }
    setIsPurging(true);
    try {
      const res = await fetch(`/api/screenings/${session.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        alert("Document image payload purged successfully.");
        window.location.reload();
      } else {
        alert(json.error || "Purge failed.");
      }
    } catch (e) {
      alert("Error purging document.");
    } finally {
      setIsPurging(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <LoadingState label="Loading screening dossier…" />
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell>
        <div className="py-24 text-center text-xs text-ink-faint">
          <p className="text-sm font-semibold text-ink-soft">
            {errorMessage || "Screening record not found"}
          </p>
          <Link
            href="/documents"
            className="mt-3 text-clay-700 hover:underline block"
          >
            Return to registry
          </Link>
        </div>
      </AppShell>
    );
  }

  const positiveSignals =
    session.analysisVersion === 2 && session.riskAssessment?.positiveSignalsJson
      ? JSON.parse(session.riskAssessment.positiveSignalsJson)
      : [];
  const reviewIndicators =
    session.analysisVersion === 2 &&
    session.riskAssessment?.reviewIndicatorsJson
      ? JSON.parse(session.riskAssessment.reviewIndicatorsJson)
      : [];

  return (
    <AppShell>
      <div className="space-y-8 max-w-5xl mx-auto">
        {session.analysisVersion !== 2 && (
          <p
            role="status"
            className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            Legacy analysis: stored field confidence, visual findings and risk
            scores lack current evidence provenance. Re-scan the original
            document before relying on these results.
          </p>
        )}
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border no-print">
          <Link
            href="/documents"
            className="flex items-center gap-1 text-xs text-ink-soft hover:text-ink transition-colors w-fit"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Screening Registry</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-50 border border-border text-xs font-semibold text-ink-soft transition-colors flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5 text-ink-soft" />
              <span>Print / Export PDF</span>
            </button>

            <button
              onClick={handleDispatch}
              disabled={
                Boolean(session.parakhHandoff) ||
                dispatchStatus === "TRANSMITTING"
              }
              className="px-3.5 py-1.5 rounded-lg bg-clay-600 hover:bg-clay-700 disabled:bg-blue-900/60 disabled:text-white/70 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                {session.parakhHandoff
                  ? session.parakhHandoff.dispatchStatus === "DELIVERED"
                    ? "Delivered to PARAKH"
                    : session.parakhHandoff.dispatchStatus === "QUEUED"
                      ? "Queued for delivery"
                      : `Handoff: ${session.parakhHandoff.dispatchStatus}`
                  : dispatchStatus === "TRANSMITTING"
                    ? "Sending..."
                    : "Send to PARAKH"}
              </span>
            </button>

            <button
              onClick={handlePurge}
              disabled={isPurging || session.document?.isPurged}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>
                {session.document?.isPurged ? "Image Purged" : "Purge Image"}
              </span>
            </button>
          </div>
        </div>

        {dispatchStatus && (
          <p role="status" className="text-sm text-ink-soft">
            Handoff: {dispatchStatus}
          </p>
        )}
        {/* Printable dossier */}
        <div
          id="printable-dossier"
          className="p-6 sm:p-8 rounded-2xl bg-white border border-border space-y-6 shadow-sm"
        >
          {/* Header Strip with Institutional Brand */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-clay-600 flex items-center justify-center text-white shadow-md">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg text-ink font-mono tracking-wider">
                    PARAKH
                  </h1>
                  <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-blue-50 text-clay-700 border border-blue-200 font-semibold">
                    Document Intelligence
                  </span>
                </div>
                <p className="text-xs text-ink-soft">
                  Identity screening dossier · advisory assessment
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-0.5">
              <div className="text-sm font-bold text-clay-700 font-mono">
                {session.screeningId}
              </div>
              <div className="text-[11px] text-ink-soft font-mono">
                {new Date(session.createdAt).toUTCString()}
              </div>
              <div className="text-[11px] text-ink-faint font-mono">
                SHA256: {session.document?.sha256Hash?.slice(0, 16)}...
              </div>
            </div>
          </div>

          {/* Screening Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-surface-200 text-xs">
            <div>
              <span className="text-[11px] uppercase font-mono text-ink-faint block">
                Document Standard
              </span>
              <span className="font-bold text-ink">
                {session.documentType.replace(/_/g, " ")}
              </span>
            </div>
            <div>
              <span className="text-[11px] uppercase font-mono text-ink-faint block">
                OCR Confidence
              </span>
              <span className="font-bold text-emerald-700 font-mono">
                {session.ocrConfidenceAvailable
                  ? `${session.ocrResult?.averageConfidence}%`
                  : "Unavailable · re-scan"}
              </span>
            </div>
            <div>
              <span className="text-[11px] uppercase font-mono text-ink-faint block">
                Operator Identity
              </span>
              <span className="font-medium text-ink-soft">
                {session.operator?.name || "Operator"}
              </span>
            </div>
            <div>
              <span className="text-[11px] uppercase font-mono text-ink-faint block">
                Organization
              </span>
              <span className="font-medium text-ink-soft">
                {session.organization?.name || "Apex Verification Hub"}
              </span>
            </div>
          </div>

          {/* Risk Assessment Score Card */}
          <div className="p-4 rounded-xl bg-surface-200 border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`h-14 w-14 rounded-full border-4 flex flex-col items-center justify-center font-mono shrink-0 ${
                  session.riskScore <= 25
                    ? "border-emerald-500 text-emerald-700"
                    : session.riskScore <= 65
                      ? "border-amber-500 text-amber-700"
                      : "border-rose-500 text-rose-700"
                }`}
              >
                <span className="text-base font-bold leading-none">
                  {session.riskScore}
                </span>
                <span className="text-[7px] uppercase tracking-tighter text-ink-soft">
                  Score
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink">
                    Screening Assessment:
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      session.riskTier === "LOW_RISK"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : session.riskTier === "REVIEW_REQUIRED"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {session.riskTier.replace("_", " ")}
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft mt-1">
                  Heuristic triage based on OCR readability and implemented text
                  checks. Pixel-level tampering and issuer records are not
                  verified. Legacy records require a fresh scan.
                </p>
              </div>
            </div>

            {session.parakhHandoff && (
              <div className="text-right shrink-0">
                <span className="text-[11px] font-mono uppercase text-clay-700 block font-semibold">
                  PARAKH Intelligence Handoff
                </span>
                <span className="text-xs font-mono text-ink-soft">
                  {session.parakhHandoff.parakhTransactionId}
                </span>
              </div>
            )}
          </div>

          {/* Extracted Statutory Information Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft pb-1 border-b border-border">
              Extracted Statutory Data Fields
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {session.extractedFields?.map((field: any) => (
                <div
                  key={field.id}
                  className="p-3 rounded-lg bg-surface-200 flex justify-between items-center"
                >
                  <div>
                    <span className="text-[11px] text-ink-faint block">
                      {field.fieldLabel}
                    </span>
                    <span className="font-mono text-ink font-semibold">
                      {field.maskedValue}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      field.validationStatus === "VALID"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {field.validationStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Forensic & Quality Findings */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft pb-1 border-b border-border">
              Forensic & Analytical Factors
            </h3>

            <div className="space-y-2 text-xs">
              {positiveSignals.map((sig: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-ink-soft">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-tight">{sig}</span>
                </div>
              ))}

              {reviewIndicators.map((sig: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-amber-700"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-tight">{sig}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Biometric Face Verification (If Attached) */}
          {session.faceVerification && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft pb-1 border-b border-border">
                Biometric Facial Comparison Record
              </h3>
              <div className="p-3 rounded-lg bg-surface-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] text-ink-faint block">
                    Facial Landmark Similarity
                  </span>
                  <span className="font-mono text-ink font-semibold">
                    {session.faceVerification.similarityScore}% &bull;{" "}
                    {session.faceVerification.matchStatus}
                  </span>
                </div>
                <span className="text-[11px] text-ink-soft font-mono">
                  Auxiliary Operational Signal
                </span>
              </div>
            </div>
          )}

          {/* Verification Gateway & Institutional Disclaimers */}
          <div className="pt-4 border-t border-border/80 text-[11px] text-ink-faint space-y-1.5">
            <p>
              <strong className="text-ink-soft">Institutional Notice:</strong>{" "}
              This document screening report is generated by PARAKH Document
              Intelligence for authorized identity triage and operational
              record-keeping. Optical character recognition metrics describe
              text recognition only; pixel forensics is unavailable. Text
              validation indicators do not substitute for statutory government
              certifications.
            </p>
            <p className="text-[11px] font-mono text-ink-faint">
              Generated by PARAKH Document Intelligence &bull; Screening
              reference: {session.id}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
