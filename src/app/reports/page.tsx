"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LoadingState } from "@/components/ui/LoadingState";
import { AppShell } from "@/components/layout/AppShell";
import {
  FileBarChart,
  ArrowUpRight,
  Download,
  Printer,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";

export default function ReportsPage() {
  const [screenings, setScreenings] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/screenings?limit=50")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setScreenings(data.data);
        else setErrorMessage(data.error || "Unable to load dossiers.");
      })
      .catch(() =>
        setErrorMessage("Unable to connect. Refresh this page to try again."),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
              Screening dossiers
            </h1>
            <p className="text-xs text-ink-soft mt-0.5">
              Review an assessment, inspect its evidence, and prepare a
              printable record.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-border">
          {loading ? (
            <LoadingState label="Loading dossiers…" />
          ) : errorMessage ? (
            <p role="alert" className="py-12 text-center text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : screenings.length === 0 ? (
            <div className="py-16 text-center">
              <FileBarChart className="mx-auto mb-4 h-8 w-8 text-clay-600" />
              <h2 className="font-display text-2xl text-ink">
                No dossiers yet
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                A completed screening creates a record here.
              </p>
              <Link
                className="mt-5 inline-flex rounded-lg bg-clay-600 px-4 py-2 text-sm font-medium text-white"
                href="/scanner"
              >
                Start a screening
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {screenings.map((sc) => (
                <div
                  key={sc.id}
                  className="p-4 rounded-xl bg-surface-200 border border-border/80 hover:border-border transition-colors flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-clay-700 text-xs">
                        {sc.screeningId}
                      </span>
                      <span
                        className={`text-[11px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          sc.riskTier === "LOW_RISK"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : sc.riskTier === "REVIEW_REQUIRED"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {sc.riskTier.replace("_", " ")}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-ink">
                      {sc.documentType.replace(/_/g, " ")}
                    </h4>

                    <p className="text-[11px] text-ink-soft">
                      Operator: {sc.operator?.name || "Operator"} &bull; Score:{" "}
                      {sc.riskScore}/100
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-ink-faint font-mono">
                      {new Date(sc.createdAt).toLocaleDateString()}
                    </span>

                    <Link
                      href={`/reports/${sc.screeningId}`}
                      className="text-clay-700 hover:text-clay-700 font-semibold inline-flex items-center gap-1"
                    >
                      <span>Open Dossier</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
