"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LoadingState } from "@/components/ui/LoadingState";
import { AppShell } from "@/components/layout/AppShell";
import {
  History,
  Search,
  Filter,
  Shield,
  Clock,
  RefreshCw,
  Lock,
} from "lucide-react";

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (appliedSearch) params.set("search", appliedSearch);
      if (actionFilter !== "ALL") params.set("action", actionFilter);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data);
      } else {
        setLogs([]);
        setErrorMessage(json.error || "Failed to load audit logs.");
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("Network error while loading audit logs.");
    } finally {
      setLoading(false);
    }
  }, [actionFilter, appliedSearch]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
                Activity log
              </h1>
              <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                Audit events
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-0.5">
              Review screening events, protected-field access, image purges, and
              handoffs.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-xl bg-white border border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              aria-label="Search activity log"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  if (search === appliedSearch) fetchLogs();
                  else setAppliedSearch(search);
                }
              }}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit actions, operators, or resource IDs..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-200 border border-border text-xs text-ink placeholder-ink-faint focus:outline-none focus:border-clay-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Filter by event type"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-200 border border-border text-xs text-ink-soft focus:outline-none"
            >
              <option value="ALL">All Event Types</option>
              <option value="SCREENING_PROCESSED">Screening Ingestion</option>
              <option value="SENSITIVE_PII_UNMASKED">
                Sensitive PII Unmasked
              </option>
              <option value="DOCUMENT_IMAGE_PURGED">Document Purged</option>
              <option value="PARAKH_INTELLIGENCE_DISPATCHED">
                PARAKH Dispatches
              </option>
            </select>

            <button
              onClick={() => {
                if (search === appliedSearch) fetchLogs();
                else setAppliedSearch(search);
              }}
              className="p-2 rounded-lg bg-surface-200 hover:bg-surface-50 border border-border text-ink-soft transition-colors"
              aria-label="Search or refresh activity log"
              title="Search or refresh"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="p-5 rounded-xl bg-white border border-border">
          {loading ? (
            <LoadingState label="Loading audit events…" />
          ) : errorMessage ? (
            <div
              role="alert"
              className="py-12 text-center text-xs text-rose-600 flex flex-col items-center gap-2"
            >
              <Lock className="h-5 w-5 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-ink-faint">
              No matching audit logs found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                aria-label="Operational audit events"
                className="w-full min-w-[760px] text-left text-xs"
              >
                <thead>
                  <tr className="border-b border-border text-ink-soft uppercase font-mono text-[11px]">
                    <th scope="col" className="pb-2.5">
                      Timestamp
                    </th>
                    <th scope="col" className="pb-2.5">
                      Action Event
                    </th>
                    <th scope="col" className="pb-2.5">
                      Actor / Operator
                    </th>
                    <th scope="col" className="pb-2.5">
                      Resource Target
                    </th>
                    <th scope="col" className="pb-2.5">
                      Operational Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-surface-200/50 transition-colors"
                    >
                      <td className="py-3 font-mono text-ink-soft text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                            log.action.includes("UNMASK")
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : log.action.includes("PURGE")
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-blue-50 text-clay-700 border border-blue-200"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 text-ink-soft font-mono text-[11px]">
                        {log.userEmail || "System"}
                      </td>
                      <td className="py-3 text-ink-soft font-mono text-[11px]">
                        {log.resourceId || "-"}
                      </td>
                      <td className="py-3 text-ink-soft text-[11px] max-w-md truncate">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
