"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Network,
  Shield,
  Zap,
  CheckCircle2,
  RefreshCw,
  Server,
  Lock,
  ArrowRight,
  Database,
  Layers,
  Send,
  Radio,
} from "lucide-react";

export default function IntegrationsPage() {
  const [endpoint, setEndpoint] = useState("https://api.parakh-intel.internal/v1/screening/ingest");
  const [apiKeyMasked, setApiKeyMasked] = useState("parakh_live_sec_89204810294****************");
  const [orgCode, setOrgCode] = useState("APEX-VERIF-HQ-09");
  const [transmissionMode, setTransmissionMode] = useState("STRUCTURED_EVIDENCE");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  const handleTestHandshake = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Simulate/probe handshake
      await new Promise((resolve) => setTimeout(resolve, 850));
      setTestResult({
        success: true,
        latencyMs: 38,
        status: "ONLINE",
        clusterId: "PARAKH-CORE-DELHI-01",
        encryption: "TLS 1.3 / ChaCha20-Poly1305",
        evidenceLedgerReady: true,
      });
    } catch (e) {
      setTestResult({ success: false, error: "Connection probe timed out." });
    } finally {
      setTesting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                PARAKH Intelligence Platform Integration
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 font-semibold">
                Central Node Connector
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-0.5">
              Cryptographic evidence handoff to the primary PARAKH Criminal Network Analysis platform.
            </p>
          </div>

          <button
            onClick={handleTestHandshake}
            disabled={testing}
            className="px-3.5 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-50 border border-border text-xs font-semibold text-ink-soft transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${testing ? "animate-spin text-blue-400" : ""}`} />
            <span>{testing ? "Testing Handshake..." : "Probe Node Handshake"}</span>
          </button>
        </div>

        {/* Handshake Result Banner */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center justify-between animate-in fade-in ${
              testResult.success
                ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                : "bg-rose-950/40 border-rose-800 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                <strong>PARAKH Central Cluster Responding:</strong> Latency {testResult.latencyMs}ms &bull; Cluster {testResult.clusterId} &bull; {testResult.encryption}
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold">STATE: VERIFIED</span>
          </div>
        )}

        {/* Architecture Pipeline Flow Diagram */}
        <div className="p-6 rounded-2xl bg-surface-100 border border-border space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-400" />
              <span>Identity Evidence Handoff Pipeline</span>
            </h3>
            <span className="text-[10px] text-ink-faint font-mono">Decoupled Architecture</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-center text-[10px] font-mono">
            {[
              "1. Document Scan",
              "2. OCR Engine",
              "3. Classification",
              "4. Field Extraction",
              "5. Forensics Check",
              "6. Biometrics",
              "7. Risk Synthesis",
              "8. PARAKH Hub",
            ].map((step, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border flex flex-col items-center justify-center font-semibold ${
                  idx === 7
                    ? "bg-blue-950/80 border-blue-600 text-blue-300"
                    : "bg-surface-200 border-border text-ink-soft"
                }`}
              >
                <span>{step}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-ink-soft leading-relaxed pt-2">
            The OCR screening application acts as an independent, sovereign intelligence layer. Once an authorized screening is concluded, selecting <strong>Send to PARAKH</strong> generates a SHA-256 sealed payload containing structured demographic records, anomaly flags, and an immutable evidence UUID. The central platform fuses this intelligence with criminal registries, watchlists, and investigation graphs.
          </p>
        </div>

        {/* Configuration Console */}
        <div className="p-6 rounded-2xl bg-surface-100 border border-border space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft pb-2 border-b border-border">
            PARAKH Core Endpoint Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-ink-soft font-semibold mb-1">
                Central Intelligence Endpoint URL
              </label>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-border text-ink font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-ink-soft font-semibold mb-1">
                Organization Authority Code
              </label>
              <input
                type="text"
                value={orgCode}
                onChange={(e) => setOrgCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-border text-ink font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-ink-soft font-semibold mb-1">
                PARAKH Gateway API Key
              </label>
              <input
                type="password"
                value={apiKeyMasked}
                disabled
                className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-border text-ink-faint font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-ink-soft font-semibold mb-1">
                Transmission Mode
              </label>
              <select
                value={transmissionMode}
                onChange={(e) => setTransmissionMode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-border text-ink focus:outline-none"
              >
                <option value="STRUCTURED_EVIDENCE">Structured Evidence Record + Anomaly Vectors</option>
                <option value="MINIMAL_METADATA">Minimal Metadata & SHA256 Ledger Hash</option>
                <option value="FULL_DOSSIER">Full Forensic Dossier with Biometric Embeddings</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex justify-end">
            <button
              onClick={() => alert("PARAKH integration settings saved.")}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
