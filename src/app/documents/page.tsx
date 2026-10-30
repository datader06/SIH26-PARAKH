"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { LoadingState } from "@/components/ui/LoadingState";
import { AppShell } from "@/components/layout/AppShell";
import {
  Search,
  Filter,
  ArrowUpRight,
  Scan,
  RefreshCw,
  FileText,
  Calendar,
  Layers,
} from "lucide-react";

export default function DocumentsPage() {
  const [screenings, setScreenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (appliedSearch) params.set("search", appliedSearch);
      if (docTypeFilter !== "ALL") params.set("documentType", docTypeFilter);
      if (riskFilter !== "ALL") params.set("riskTier", riskFilter);

      const res = await fetch(`/api/screenings?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setScreenings(json.data);
      } else {
        setScreenings([]);
        setErrorMessage(json.error || "Unable to load screening records.");
      }
    } catch (err) {
      setErrorMessage("Unable to connect. Try refreshing the records.");
    } finally {
      setLoading(false);
    }
  }, [docTypeFilter, riskFilter, appliedSearch]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search === appliedSearch) fetchRecords();
    else setAppliedSearch(search);
  };

  const formatDocName = (type: string) => {
    return type.replace(/_/g, " ").replace("CARD", "");
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
              Screening records
            </h1>
            <p className="text-xs text-ink-soft mt-0.5">
              Find previous screenings, compare risk signals, and open an
              evidence dossier.
            </p>
          </div>

          <Link
            href="/scanner"
            className="px-4 py-2 rounded-lg bg-clay-600 hover:bg-clay-700 text-xs font-semibold text-white shadow-md shadow-soft flex items-center gap-2 transition-all w-fit"
          >
            <Scan className="h-4 w-4" />
            <span>New Screening</span>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-xl bg-white border border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="h-4 w-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              aria-label="Search screening records"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Screening ID or document metadata..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-200 border border-border text-xs text-ink placeholder-ink-faint focus:outline-none focus:border-clay-500 font-mono"
            />
          </form>

          <div className="flex items-center gap-2">
            <select
              aria-label="Filter by document type"
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-200 border border-border text-xs text-ink-soft focus:outline-none"
            >
              <option value="ALL">All Documents</option>
              <option value="AADHAAR_CARD">Aadhaar Card</option>
              <option value="PAN_CARD">PAN Card</option>
              <option value="PASSPORT">Passport</option>
              <option value="DRIVING_LICENCE">Driving Licence</option>
              <option value="VOTER_ID">Voter ID</option>
            </select>

            <select
              aria-label="Filter by risk tier"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-200 border border-border text-xs text-ink-soft focus:outline-none"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="LOW_RISK">Low Risk</option>
              <option value="REVIEW_REQUIRED">Review Required</option>
              <option value="HIGH_RISK">High Risk</option>
            </select>

            <button
              onClick={fetchRecords}
              className="p-2 rounded-lg bg-surface-200 hover:bg-surface-50 border border-border text-ink-soft transition-colors"
              aria-label="Refresh screening records"
              title="Refresh"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Screening Table */}
        <div className="p-5 rounded-xl bg-white border border-border">
          {loading ? (
            <LoadingState label="Loading screening records…" />
          ) : errorMessage ? (
            <div
              role="alert"
              className="py-12 text-center text-sm text-rose-700"
            >
              {errorMessage}
              <button onClick={fetchRecords} className="ml-3 underline">
                Try again
              </button>
            </div>
          ) : screenings.length === 0 ? (
            <div className="py-16 text-center text-xs text-ink-faint">
              <p className="text-sm font-semibold text-ink-soft">
                No matching screening records found
              </p>
              <p className="mt-1">
                Adjust your search parameters or run a new document scan.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-ink-soft uppercase font-mono text-[11px]">
                    <th scope="col" className="pb-3">
                      Screening ID
                    </th>
                    <th scope="col" className="pb-3">
                      Document Type
                    </th>
                    <th scope="col" className="pb-3">
                      Protected Identifier
                    </th>
                    <th scope="col" className="pb-3">
                      Risk Assessment
                    </th>
                    <th scope="col" className="pb-3">
                      Operator
                    </th>
                    <th scope="col" className="pb-3">
                      Date & Time
                    </th>
                    <th scope="col" className="pb-3 text-right">
                      Dossier
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {screenings.map((sc) => {
                    const primaryField = sc.extractedFields?.find(
                      (f: any) =>
                        f.fieldKey.includes("number") ||
                        f.fieldKey.includes("epic"),
                    );
                    const maskedId =
                      primaryField?.maskedValue || "Masked Entity";

                    return (
                      <tr
                        key={sc.id}
                        className="hover:bg-surface-200/50 transition-colors"
                      >
                        <td className="py-3 font-mono font-bold text-clay-700">
                          {sc.screeningId}
                        </td>
                        <td className="py-3 text-ink font-medium">
                          {formatDocName(sc.documentType)}
                        </td>
                        <td className="py-3 font-mono text-ink-soft">
                          {maskedId}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                              sc.riskTier === "LOW_RISK"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : sc.riskTier === "REVIEW_REQUIRED"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            Score: {sc.riskScore} &bull;{" "}
                            {sc.riskTier.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 text-ink-soft">
                          {sc.operator?.name || "Operator"}
                        </td>
                        <td className="py-3 text-ink-faint font-mono text-[11px]">
                          {new Date(sc.createdAt).toLocaleString("en-IN", {
                            month: "short",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/reports/${sc.screeningId}`}
                            className="inline-flex items-center gap-1 text-clay-700 hover:text-clay-700 font-semibold"
                          >
                            <span>Inspect</span>
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
        </div>
      </div>
    </AppShell>
  );
}
