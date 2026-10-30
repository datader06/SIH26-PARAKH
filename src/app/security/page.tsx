"use client";
import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  ShieldCheck,
  LockKeyhole,
  Trash2,
  Clock3,
  ScrollText,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function SecurityPrivacyPage() {
  const [retention, setRetention] = useState("30_DAYS");
  const [reference, setReference] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  async function purge(event: React.FormEvent) {
    event.preventDefault();
    if (!reference.trim() || !confirmed || busy) return;
    setBusy(true);
    setMessage("");
    setError(false);
    try {
      const response = await fetch(
        `/api/screenings/${encodeURIComponent(reference.trim())}`,
        { method: "DELETE" },
      );
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(
          result.error || "The image could not be purged. Please try again.",
        );
      setMessage(
        "Original document image purged. Screening metadata, extracted fields, OCR text and any selfie remain in the record.",
      );
      setReference("");
      setConfirmed(false);
    } catch (failure) {
      setError(true);
      setMessage(
        failure instanceof Error
          ? failure.message
          : "Network error. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-clay-600">
              Governance / Privacy
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Handle evidence with care.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
              Understand the data lifecycle and manage original screening
              images.
            </p>
          </div>
          <Link
            href="/activity"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-medium text-ink hover:bg-surface-100"
          >
            Activity records
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: LockKeyhole,
              title: "Sensitive-field controls",
              detail:
                "The screening interface masks identifiers. Authorized reveal requests require a reason. This is not a claim that stored records are encrypted or masked.",
            },
            {
              icon: Clock3,
              title: "Manual image lifecycle",
              detail:
                "Original document bytes are stored with screening records. Image purging is available on demand; automatic expiry is not currently scheduled.",
            },
            {
              icon: ScrollText,
              title: "Recorded activity",
              detail:
                "Supported actions write audit events to the database. Audit records are not a cryptographically immutable ledger.",
            },
          ].map(({ icon: Icon, title, detail }) => (
            <section
              key={title}
              className="rounded-2xl border border-border bg-white p-6"
            >
              <span className="inline-flex rounded-xl bg-clay-50 p-2.5 text-clay-600">
                <Icon className="h-4 w-4" />
              </span>
              <h2 className="mt-5 text-sm font-semibold text-ink">{title}</h2>
              <p className="mt-3 text-xs leading-6 text-ink-soft">{detail}</p>
            </section>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl border border-border bg-white p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-ink">
                Retention policy preview
              </h2>
              <span className="rounded-full bg-surface-200 px-2.5 py-1 text-[10px] text-ink-soft">
                Local only
              </span>
            </div>
            <p className="mt-3 text-xs leading-6 text-ink-soft">
              Explore a proposed retention window. This selection does not save
              a policy or schedule deletion.
            </p>
            <fieldset className="mt-5 space-y-2">
              <legend className="sr-only">Proposed retention duration</legend>
              {[
                {
                  value: "INSTANT_PURGE",
                  label: "After processing",
                  detail: "Immediate image removal",
                },
                {
                  value: "24_HOURS",
                  label: "24 hours",
                  detail: "Short review window",
                },
                {
                  value: "7_DAYS",
                  label: "7 days",
                  detail: "Weekly review cycle",
                },
                {
                  value: "30_DAYS",
                  label: "30 days",
                  detail: "Extended review window",
                },
                {
                  value: "INDEFINITE",
                  label: "Until manually removed",
                  detail: "No proposed expiry",
                },
              ].map((item) => (
                <label
                  key={item.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 ${retention === item.value ? "border-clay-300 bg-clay-50" : "border-border hover:bg-surface-100"}`}
                >
                  <input
                    type="radio"
                    name="retention"
                    value={item.value}
                    checked={retention === item.value}
                    onChange={(e) => setRetention(e.target.value)}
                    className="accent-clay-600"
                  />
                  <span className="flex flex-1 flex-wrap items-center justify-between gap-1">
                    <span className="text-xs font-medium text-ink">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-ink-soft">
                      {item.detail}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          </section>
          <section className="h-fit rounded-2xl border border-rose-100 bg-white p-6 sm:p-7">
            <span className="inline-flex rounded-xl bg-rose-50 p-2.5 text-rose-600">
              <Trash2 className="h-4 w-4" />
            </span>
            <h2 className="mt-5 font-display text-lg font-semibold text-ink">
              Purge an original image
            </h2>
            <p className="mt-3 text-xs leading-6 text-ink-soft">
              Administrator access is required. The original screening image is
              permanently removed. OCR, extracted fields, metadata and selfies
              are retained.
            </p>
            <form onSubmit={purge} className="mt-6 space-y-5">
              <label
                htmlFor="purge-reference"
                className="block text-xs font-medium text-ink-soft"
              >
                Screening reference
                <input
                  id="purge-reference"
                  required
                  value={reference}
                  onChange={(e) => {
                    setReference(e.target.value);
                    setConfirmed(false);
                  }}
                  placeholder="Screening ID or record ID"
                  disabled={busy}
                  className="mt-2 w-full rounded-xl border border-border bg-white px-3.5 py-3 font-mono text-sm text-ink outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50 disabled:opacity-50"
                />
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-rose-50 p-4">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  disabled={busy}
                  className="mt-0.5 accent-rose-600"
                />
                <span className="text-xs leading-5 text-rose-600">
                  I understand that this permanently removes the original image
                  and cannot be undone.
                </span>
              </label>
              <button
                type="submit"
                disabled={!confirmed || !reference.trim() || busy}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-xs font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {busy ? "Purging image…" : "Permanently purge image"}
              </button>
            </form>
            {message && (
              <div
                role={error ? "alert" : "status"}
                className={`mt-5 flex items-start gap-2 rounded-xl border p-3 text-xs leading-5 ${error ? "border-rose-100 bg-rose-50 text-rose-600" : "border-sage-200 bg-sage-50 text-sage-600"}`}
              >
                {error ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <p>{message}</p>
              </div>
            )}
            <div className="mt-7 flex items-start gap-2 border-t border-border pt-5 text-xs leading-5 text-ink-soft">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-clay-600" />
              <p>
                Check the reference carefully. The server verifies your role and
                organization before permitting a purge.
              </p>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
