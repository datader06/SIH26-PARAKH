"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { LoadingState } from "@/components/ui/LoadingState";
import { AppShell } from "@/components/layout/AppShell";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Code2,
  Shield,
  Clock,
  Terminal,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export default function ApiAccessPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKeyData, setNewKeyData] = useState<any | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/api-keys");
      const json = await res.json();
      if (json.success) setApiKeys(json.data);
      else setErrorMessage(json.error || "Unable to load credentials.");
    } catch (e) {
      setErrorMessage("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim() || creating) return;
    setCreating(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName }),
      });
      const json = await res.json();
      if (json.success) {
        setNewKeyData(json.data);
        setShowCreateModal(false);
        setKeyName("");
        fetchKeys();
      } else {
        setErrorMessage(json.error || "Unable to generate the key.");
      }
    } catch (e) {
      setErrorMessage("Unable to connect. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this API credential? Integrations using this key will immediately fail.",
      )
    )
      return;
    try {
      const res = await fetch(`/api/api-keys?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setErrorMessage(json.error || "Unable to revoke key.");
        return;
      }
      fetchKeys();
    } catch (e) {
      setErrorMessage("Unable to connect. Please try again.");
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
                API access
              </h1>
              <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-blue-50 text-clay-700 border border-blue-200 font-semibold">
                REST v1
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-0.5">
              Manage credentials for programmatic document screening. Keep each
              integration independently revocable.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-clay-600 hover:bg-clay-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 w-fit"
          >
            <Plus className="h-4 w-4" />
            <span>Generate New API Key</span>
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {errorMessage}
          </div>
        )}
        {/* Once-displayed secret */}
        {newKeyData && (
          <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700">
                New API Credential Generated: {newKeyData.name}
              </span>
              <button
                onClick={() => setNewKeyData(null)}
                className="text-xs text-ink-soft hover:text-ink"
              >
                Dismiss
              </button>
            </div>
            <p className="text-xs text-ink-soft">
              Copy this private key immediately. It is shown only in this
              response; store it securely.
            </p>
            <div className="p-3 rounded-lg bg-surface-200 border border-emerald-700 flex items-center justify-between font-mono text-xs text-emerald-700">
              <span className="min-w-0 break-all">{newKeyData.secretKey}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(newKeyData.secretKey);
                  setCopiedSecret(true);
                  setTimeout(() => setCopiedSecret(false), 2000);
                }}
                className="px-2.5 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-white text-xs flex items-center gap-1"
              >
                {copiedSecret ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>{copiedSecret ? "Copied" : "Copy Secret"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Existing API Keys Table */}
        <div className="p-5 rounded-xl bg-white border border-border space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft pb-2 border-b border-border">
            Active Institutional API Keys
          </h3>

          {loading ? (
            <LoadingState label="Loading credentials…" />
          ) : apiKeys.length === 0 ? (
            <div className="py-12 text-center text-xs text-ink-faint">
              No API keys configured yet. Generate a key to integrate PARAKH
              Document Intelligence with external services.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-ink-soft uppercase font-mono text-[11px]">
                    <th scope="col" className="pb-2.5">
                      Key Name / Identifier
                    </th>
                    <th scope="col" className="pb-2.5">
                      Prefix Token
                    </th>
                    <th scope="col" className="pb-2.5">
                      Authorized Scopes
                    </th>
                    <th scope="col" className="pb-2.5">
                      Last Activity
                    </th>
                    <th scope="col" className="pb-2.5">
                      Status
                    </th>
                    <th scope="col" className="pb-2.5 text-right">
                      Revoke
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {apiKeys.map((k) => (
                    <tr key={k.id} className="hover:bg-surface-200/50">
                      <td className="py-3 font-semibold text-ink">{k.name}</td>
                      <td className="py-3 font-mono text-ink-soft">
                        {k.keyPrefix}
                      </td>
                      <td className="py-3 font-mono text-ink-soft text-[11px]">
                        {k.scopes}
                      </td>
                      <td className="py-3 text-ink-faint font-mono text-[11px]">
                        {k.lastUsedAt
                          ? new Date(k.lastUsedAt).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                            k.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {k.isActive ? "ACTIVE" : "REVOKED"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {k.isActive && (
                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            className="p-1 rounded text-rose-700 hover:bg-rose-50"
                            aria-label={`Revoke ${k.name}`}
                            title="Revoke Key"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Interactive API Endpoint Documentation */}
        <div className="p-6 rounded-2xl bg-white border border-border space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft flex items-center gap-2">
              <Code2 className="h-4 w-4 text-clay-700" />
              <span>Programmatic Document Screening Endpoint</span>
            </h3>
            <span className="font-mono text-[11px] text-clay-700 font-bold">
              POST /api/v1/screening/analyze
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <p className="text-ink-soft">
              Submit identity document images as base64 JSON payloads to receive
              structured fields, forensic indicators, and risk scores:
            </p>

            {/* Curl Example */}
            <div className="p-4 rounded-xl bg-surface-200 border border-border font-mono text-xs text-ink-soft overflow-x-auto">
              <span className="text-ink-faint"># cURL Ingestion Request</span>
              <pre className="text-clay-700 mt-1">
                {`curl -X POST https://your-domain.com/api/v1/screening/analyze \\
  -H "Authorization: Bearer parakh_live_sec_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "image": "data:image/jpeg;base64,...",
    "documentType": "PAN_CARD"
  }'`}
              </pre>
            </div>
          </div>
        </div>

        {/* Key Creation Modal */}
        <Dialog
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          title="Generate API key"
        >
          {errorMessage && (
            <p
              role="alert"
              className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
            >
              {errorMessage}
            </p>
          )}
          <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
            <div>
              <label
                htmlFor="api-key-name"
                className="block text-ink-soft font-semibold mb-1"
              >
                Key Name / Integration System
              </label>
              <input
                type="text"
                id="api-key-name"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g., Hotel PMS Ingestion Service"
                required
                className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-border text-ink focus:outline-none focus:border-clay-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 rounded-lg bg-surface-200 text-ink-soft font-medium"
              >
                Cancel
              </button>
              <button
                disabled={creating}
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-clay-600 hover:bg-clay-700 text-white font-semibold"
              >
                {creating ? "Generating…" : "Generate credential"}
              </button>
            </div>
          </form>
        </Dialog>
      </div>
    </AppShell>
  );
}
