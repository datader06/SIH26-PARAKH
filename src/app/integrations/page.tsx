"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Network,
  ArrowUpRight,
  ArrowRight,
  FileScan,
  ScanText,
  Fingerprint,
  Send,
  RefreshCw,
  Info,
  Loader2,
} from "lucide-react";
type Health = { parakhHubGateway: string; verificationGateway: string };
export default function IntegrationsPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [organization, setOrganization] = useState("");
  const [preview, setPreview] = useState(false);
  async function loadHealth() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/metrics");
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(
          response.status === 401
            ? "Sign in to inspect deployment configuration."
            : result.error || "Configuration status could not be loaded.",
        );
      setHealth(result.data.systemHealth);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Unable to load configuration status.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void loadHealth();
  }, []);
  const hubConfigured = health?.parakhHubGateway === "CONNECTED";
  const gatewayConfigured = health?.verificationGateway === "OPERATIONAL";
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-clay-600">
              Platform / Connections
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Evidence, connected.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
              Review integration configuration and understand how screening
              records move between systems.
            </p>
          </div>
          <button
            onClick={() => void loadHealth()}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-medium text-ink hover:bg-surface-100 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh configuration
          </button>
        </header>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-600"
          >
            {error}
          </p>
        )}
        <div className="grid gap-5 md:grid-cols-2">
          {[
            {
              title: "PARAKH evidence handoff",
              configured: hubConfigured,
              detail:
                "Structured screening summaries can be dispatched from the scanner or an individual report.",
              icon: Send,
            },
            {
              title: "Verification gateway",
              configured: gatewayConfigured,
              detail:
                "External source checks depend on deployment configuration and available authorized connectors.",
              icon: Network,
            },
          ].map(({ title, configured, detail, icon: Icon }) => (
            <section
              key={title}
              className="rounded-2xl border border-border bg-white p-6 sm:p-7"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-xl bg-clay-50 p-2.5 text-clay-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${loading || !health ? "border-border text-ink-soft" : configured ? "border-sage-200 bg-sage-50 text-sage-600" : "border-amber-100 bg-amber-50 text-amber-600"}`}
                >
                  {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                  {loading
                    ? "Checking configuration"
                    : !health
                      ? "Status unavailable"
                      : configured
                        ? "Configuration present"
                        : "Not configured"}
                </span>
              </div>
              <h2 className="mt-6 font-display text-lg font-semibold text-ink">
                {title}
              </h2>
              <p className="mt-3 text-xs leading-6 text-ink-soft">{detail}</p>
              <p className="mt-5 border-t border-border pt-4 text-[11px] leading-5 text-ink-faint">
                Configuration presence is not a live connectivity or
                credential-validity test.
              </p>
            </section>
          ))}
        </div>
        <section className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="border-b border-border p-6 sm:p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-clay-600">
              The evidence path
            </p>
            <h2 className="mt-3 font-display text-xl font-semibold text-ink">
              From document to accountable handoff.
            </h2>
          </div>
          <div className="grid gap-0 p-6 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">
            {[
              {
                icon: FileScan,
                title: "Capture",
                detail: "Upload or photograph an identity document.",
              },
              {
                icon: ScanText,
                title: "Interpret",
                detail: "Extract text and structured fields with OCR.",
              },
              {
                icon: Fingerprint,
                title: "Assess",
                detail: "Review heuristic signals and risk findings.",
              },
              {
                icon: Send,
                title: "Dispatch",
                detail: "Send the summary and inspect its receipt.",
              },
            ].map(({ icon: Icon, title, detail }, index) => (
              <div key={title} className="relative p-4">
                <div className="flex items-center gap-2 text-clay-600">
                  <Icon className="h-4 w-4" />
                  <span className="font-mono text-[10px]">0{index + 1}</span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-xs leading-6 text-ink-soft">{detail}</p>
                {index < 3 && (
                  <ArrowRight className="absolute right-0 top-4 hidden h-4 w-4 text-ink-faint lg:block" />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-start gap-3 border-t border-border bg-surface-100 p-5 text-xs leading-6 text-ink-soft">
            <Info className="mt-1 h-4 w-4 shrink-0 text-clay-600" />
            <p>
              Unreachable handoffs are recorded as queued. Automatic retries are
              not implemented. A receipt marked delivered is distinct from a
              local record or a payload checksum.
            </p>
          </div>
        </section>
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <section className="rounded-2xl border border-border bg-white p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-ink">
                Connection planning
              </h2>
              <span className="rounded-full bg-surface-200 px-2.5 py-1 text-[10px] text-ink-soft">
                Local preview
              </span>
            </div>
            <p className="mt-3 text-xs leading-6 text-ink-soft">
              Draft connection details here. This form does not save
              credentials, change the deployment, or test a connection.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPreview(true);
              }}
              className="mt-5 space-y-4"
            >
              <label
                htmlFor="integration-endpoint"
                className="block text-xs font-medium text-ink-soft"
              >
                Proposed endpoint
                <input
                  id="integration-endpoint"
                  type="url"
                  value={endpoint}
                  onChange={(e) => {
                    setEndpoint(e.target.value);
                    setPreview(false);
                  }}
                  placeholder="https://your-authorized-endpoint"
                  className="mt-2 w-full rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-ink outline-none focus:border-clay-500 focus:ring-4 focus:ring-clay-100"
                />
              </label>
              <label
                htmlFor="integration-org"
                className="block text-xs font-medium text-ink-soft"
              >
                Organization reference
                <input
                  id="integration-org"
                  value={organization}
                  onChange={(e) => {
                    setOrganization(e.target.value);
                    setPreview(false);
                  }}
                  placeholder="Your authority code"
                  className="mt-2 w-full rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-ink outline-none focus:border-clay-500 focus:ring-4 focus:ring-clay-100"
                />
              </label>
              <button
                type="submit"
                className="rounded-xl bg-ink px-4 py-3 text-xs font-semibold text-white hover:bg-clay-700"
              >
                Review local draft
              </button>
              {preview && (
                <p
                  role="status"
                  className="rounded-xl bg-clay-50 p-3 text-xs leading-5 text-clay-800"
                >
                  Draft reviewed on this page only. No credentials were saved
                  and no network handshake was performed.
                </p>
              )}
            </form>
          </section>
          <aside className="h-fit rounded-2xl border border-border bg-white p-6">
            <h2 className="text-sm font-semibold text-ink">
              Continue your workflow
            </h2>
            <p className="mt-3 text-xs leading-6 text-ink-soft">
              Dispatch from a screening record. Manage issued API credentials in
              the API workspace.
            </p>
            <div className="mt-5 space-y-4 border-t border-border pt-5">
              {[
                { href: "/scanner", title: "Open document scanner" },
                { href: "/reports", title: "Browse screening reports" },
                { href: "/api-access", title: "Manage API access" },
                { href: "/verification", title: "Source verification" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between gap-2 text-xs font-medium text-ink"
                >
                  {item.title}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
