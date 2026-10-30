"use client";
import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Building2,
  Cpu,
  SlidersHorizontal,
  ArrowUpRight,
  Info,
  RotateCcw,
} from "lucide-react";
const field =
  "mt-2 w-full rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-ink outline-none focus:border-clay-500 focus:ring-4 focus:ring-clay-100";
export default function SettingsPage() {
  const [organization, setOrganization] = useState("");
  const [code, setCode] = useState("");
  const [provider, setProvider] = useState("TESSERACT");
  const [low, setLow] = useState(25);
  const [high, setHigh] = useState(66);
  const [feedback, setFeedback] = useState("");
  const invalid = low >= high;
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-clay-600">
              Workspace / Preferences
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              A workspace that fits.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
              Explore organization and screening preferences in a local
              configuration preview.
            </p>
          </div>
          <span className="w-fit rounded-full border border-border bg-white px-3 py-1.5 text-[11px] text-ink-soft">
            Local preview
          </span>
        </header>
        <div className="flex items-start gap-3 rounded-2xl border border-clay-200 bg-clay-50 p-4 text-sm leading-6 text-clay-800">
          <Info className="mt-1 h-4 w-4 shrink-0" />
          <p>
            These controls do not change your organization, OCR provider, or
            scoring engine. Values stay on this page and reset when you leave.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!invalid)
              setFeedback(
                "Local preview updated. No deployment settings were changed.",
              );
          }}
          className="grid gap-6 lg:grid-cols-[1fr_300px]"
        >
          <div className="space-y-5">
            <section className="rounded-2xl border border-border bg-white p-6 sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <span className="rounded-xl bg-clay-50 p-2.5 text-clay-600">
                  <Building2 className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-display text-base font-semibold text-ink">
                    Organization profile
                  </h2>
                  <p className="mt-1 text-xs text-ink-soft">
                    Draft your workspace identity.
                  </p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label
                  htmlFor="preview-org"
                  className="text-xs font-medium text-ink-soft"
                >
                  Organization name
                  <input
                    id="preview-org"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Your institution or organization"
                    className={field}
                  />
                </label>
                <label
                  htmlFor="preview-code"
                  className="text-xs font-medium text-ink-soft"
                >
                  Authority code
                  <input
                    id="preview-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Organization reference"
                    className={`${field} font-mono`}
                  />
                </label>
              </div>
            </section>
            <section className="rounded-2xl border border-border bg-white p-6 sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <span className="rounded-xl bg-clay-50 p-2.5 text-clay-600">
                  <Cpu className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-display text-base font-semibold text-ink">
                    Recognition provider
                  </h2>
                  <p className="mt-1 text-xs text-ink-soft">
                    Supported engines, shown for planning.
                  </p>
                </div>
              </div>
              <fieldset>
                <legend className="sr-only">Preview OCR provider</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      value: "TESSERACT",
                      title: "Tesseract",
                      detail: "Local English and Hindi recognition",
                    },
                    {
                      value: "GOOGLE_CLOUD_VISION",
                      title: "Google Cloud Vision",
                      detail: "Requires a configured cloud API key",
                    },
                  ].map((item) => (
                    <label
                      key={item.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${provider === item.value ? "border-clay-300 bg-clay-50" : "border-border hover:bg-surface-100"}`}
                    >
                      <input
                        type="radio"
                        name="provider"
                        value={item.value}
                        checked={provider === item.value}
                        onChange={(e) => setProvider(e.target.value)}
                        className="mt-1 accent-clay-600"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-ink">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-ink-soft">
                          {item.detail}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>
            <section className="rounded-2xl border border-border bg-white p-6 sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <span className="rounded-xl bg-clay-50 p-2.5 text-clay-600">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-display text-base font-semibold text-ink">
                    Identity risk thresholds
                  </h2>
                  <p className="mt-1 text-xs text-ink-soft">
                    Higher scores indicate greater screening risk.
                  </p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label
                  htmlFor="preview-low"
                  className="text-xs font-medium text-ink-soft"
                >
                  Low risk maximum
                  <input
                    id="preview-low"
                    type="number"
                    min="0"
                    max="99"
                    value={low}
                    onChange={(e) => setLow(Number(e.target.value))}
                    className={field}
                    aria-describedby="threshold-note"
                  />
                </label>
                <label
                  htmlFor="preview-high"
                  className="text-xs font-medium text-ink-soft"
                >
                  High risk starts at
                  <input
                    id="preview-high"
                    type="number"
                    min="1"
                    max="100"
                    value={high}
                    onChange={(e) => setHigh(Number(e.target.value))}
                    className={field}
                    aria-describedby="threshold-note"
                  />
                </label>
              </div>
              <p
                id="threshold-note"
                className={`mt-4 text-xs leading-5 ${invalid ? "text-rose-600" : "text-ink-soft"}`}
              >
                {invalid
                  ? "High risk must start above the low risk maximum."
                  : "Current engine: 0–25 low risk, 26–65 review required, 66–100 high risk. This preview does not change those boundaries."}
              </p>
            </section>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={invalid}
                className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-clay-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Update local preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrganization("");
                  setCode("");
                  setProvider("TESSERACT");
                  setLow(25);
                  setHigh(66);
                  setFeedback("Preview reset.");
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink-soft hover:bg-surface-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
            <p role="status" className="text-sm text-ink-soft">
              {feedback}
            </p>
          </div>
          <aside className="h-fit rounded-2xl border border-border bg-white p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
              Configuration guide
            </p>
            <h2 className="mt-4 font-display text-lg font-semibold text-ink">
              Clear boundaries.
              <br />
              Confident decisions.
            </h2>
            <p className="mt-4 text-xs leading-6 text-ink-soft">
              Reviewer permissions come from your signed-in role. Facial
              comparison currently requires manual review. Neither is changed by
              these preferences.
            </p>
            <div className="mt-6 space-y-3 border-t border-border pt-5">
              <Link
                href="/team"
                className="flex items-center justify-between text-xs font-medium text-ink"
              >
                Role permissions
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/security"
                className="flex items-center justify-between text-xs font-medium text-ink"
              >
                Data & privacy
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </form>
      </div>
    </AppShell>
  );
}
