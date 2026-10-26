"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Scan,
  CheckCircle2,
  Lock,
  ArrowRight,
  FileCheck,
  X,
} from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export default function LandingPage() {
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("OPERATOR");
  const [emailInput, setEmailInput] = useState("operator@parakh-intel.org");
  const [passwordInput, setPasswordInput] = useState("Parakh@Enterprise2026");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          password: passwordInput,
        }),
      });
      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        const json = await res.json().catch(() => ({}));
        alert(json.error || "Authentication failed. Please verify institutional credentials.");
      }
    } catch {
      alert("Sign in network error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-ink selection:bg-clay-200 selection:text-clay-900">
      {/* Top Navigation */}
      <header className="border-b border-border bg-background/90 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-clay-500 flex items-center justify-center text-white shadow-soft">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display font-bold tracking-tight text-base text-ink">PARAKH</span>
              <span className="text-ink-faint text-xs block -mt-1 font-medium">Document Intelligence</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-7 text-xs font-medium text-ink-soft">
            <Link href="#platform" className="hover:text-ink transition-colors">Platform</Link>
            <Link href="/scanner" className="hover:text-ink transition-colors">Document Scanner</Link>
            <Link href="/verification" className="hover:text-ink transition-colors">Verification</Link>
            <Link href="/reports" className="hover:text-ink transition-colors">Reports</Link>
            <Link href="/activity" className="hover:text-ink transition-colors">Activity</Link>
            <Link href="/api-access" className="hover:text-ink transition-colors">API</Link>
            <Link href="/security" className="hover:text-ink transition-colors">Security</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSignInModal(true)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-sand-200 border border-border text-xs font-semibold text-ink transition-colors duration-200"
            >
              Sign In
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl bg-clay-500 hover:bg-clay-600 text-xs font-semibold text-white shadow-soft hover:shadow-card transition-all duration-200 flex items-center gap-1.5"
            >
              <span>Operational Console</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-paper opacity-60 pointer-events-none" />
        <motion.div
          className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-clay-100 blur-3xl opacity-60"
          animate={{ y: [0, 18, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-10 right-0 h-80 w-80 rounded-full bg-sage-100 blur-3xl opacity-50"
          animate={{ y: [0, -22, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div
            {...fadeUp(0)}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-clay-50 border border-clay-200 text-clay-700 text-xs font-medium mb-6"
          >
            <span className="h-2 w-2 rounded-full bg-clay-500 animate-pulse" />
            <span>Authorized Enterprise Identity Screening Platform</span>
          </motion.div>

          <motion.h1
            {...fadeUp(0.08)}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink max-w-4xl mx-auto leading-[1.15] text-balance"
          >
            Secure Document Intelligence for{" "}
            <span className="text-clay-500">Authorized Verification</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.16)}
            className="mt-6 text-base sm:text-lg text-ink-soft max-w-2xl mx-auto leading-relaxed"
          >
            Scan, analyze and securely process identity documents with AI-powered OCR and document intelligence.
            Engineered for hotels, financial institutions, enterprises, verification desks, and investigation teams.
          </motion.p>

          <motion.div
            {...fadeUp(0.24)}
            className="mt-8 flex flex-wrap items-center justify-center gap-3.5"
          >
            <Link
              href="/scanner"
              className="px-6 py-3 rounded-xl bg-clay-500 hover:bg-clay-600 text-white font-semibold text-sm shadow-card hover:shadow-lift transition-all duration-200 flex items-center gap-2"
            >
              <Scan className="h-4 w-4" />
              <span>Launch Document Scanner</span>
            </Link>

            <button
              onClick={() => setShowSignInModal(true)}
              className="px-6 py-3 rounded-xl bg-white hover:bg-sand-200 border border-border text-ink font-semibold text-sm transition-colors duration-200 flex items-center gap-2"
            >
              <Lock className="h-4 w-4 text-ink-faint" />
              <span>Access Institutional Portal</span>
            </button>
          </motion.div>

          <motion.div
            {...fadeUp(0.32)}
            className="mt-14 pt-8 border-t border-border max-w-3xl mx-auto"
          >
            <p className="text-xs uppercase font-semibold tracking-wider text-ink-faint mb-4">
              Supported Statutory Identity Standards
            </p>
            <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-xs text-ink-soft font-medium">
              {["Aadhaar (UIDAI)", "PAN Card (ITD)", "Passport (ICAO 9303)", "Driving Licence", "Voter ID (EPIC)"].map(
                (label) => (
                  <span key={label} className="px-3 py-1.5 rounded-lg bg-white border border-border shadow-soft">
                    {label}
                  </span>
                )
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pipeline */}
      <section id="platform" className="py-20 border-b border-border bg-surface-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              Enterprise Document Screening Architecture
            </h2>
            <p className="mt-3 text-sm text-ink-soft">
              An end-to-end operational pipeline combining optical character recognition, structural verification,
              forensic inspection, and explainable risk assessment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Scan,
                tone: "clay",
                title: "1. Capture & Image Enhancement",
                desc: "Browser camera stream with real-time alignment framing guides, glare detection, blur estimation (Laplacian variance), and contrast normalization before OCR ingestion.",
              },
              {
                icon: FileCheck,
                tone: "dusk",
                title: "2. OCR & Structured Parsing",
                desc: "Multi-provider abstraction supporting Tesseract and Cloud Vision. Automatic classification with mathematical checksum validation (Verhoeff and ICAO 9303 MRZ).",
              },
              {
                icon: Shield,
                tone: "sage",
                title: "3. Forensics & PARAKH Handoff",
                desc: "Visual anomaly mapping, biometric face similarity comparison, explainable 0-100 risk scoring, and cryptographic transmission to the PARAKH intelligence ecosystem.",
              },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const }}
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl bg-white border border-border shadow-soft hover:shadow-card transition-shadow duration-300"
              >
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${
                    step.tone === "clay"
                      ? "bg-clay-50 text-clay-600"
                      : step.tone === "dusk"
                      ? "bg-dusk-50 text-dusk-600"
                      : "bg-sage-50 text-sage-600"
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-xs text-ink-soft leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section id="security" className="py-16 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="p-8 rounded-3xl bg-white border border-border shadow-card grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-clay-50 text-clay-700 text-xs font-semibold border border-clay-200 mb-3">
                <Lock className="h-3.5 w-3.5" />
                <span>Enterprise Data Governance</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-ink tracking-tight">
                Designed for Strict Regulatory &amp; PII Compliance
              </h3>
              <p className="mt-3 text-sm text-ink-soft leading-relaxed">
                Personal identifiable information (PII) is automatically masked across all user interfaces (e.g.,
                Aadhaar <span className="font-mono text-ink">XXXX XXXX 1234</span>). Controlled unmasking requires
                verified role authorization and is immutably logged to the institutional audit trail.
              </p>

              <div className="mt-6 space-y-2 text-xs text-ink-soft">
                {[
                  "Configurable data retention policies (instant purge or institutional archiving)",
                  "Role-based access control (Operator, Investigator, Reviewer, Administrator)",
                  "No storage of unmasked government identifiers without cryptographic audit seals",
                ].map((line) => (
                  <div key={line} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sage-500 shrink-0" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-sand-100 p-5 rounded-2xl border border-border font-mono text-xs text-ink-soft space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-border text-ink-faint">
                <span>SECURITY AUDIT STREAM</span>
                <span className="text-sage-600">ACTIVE LOGGING</span>
              </div>
              <p>
                <span className="text-clay-600">[2026-09-15T09:18:22Z]</span> SCREENING_PROCESSED: UID Verhoeff
                checksum verified.
              </p>
              <p>
                <span className="text-clay-600">[2026-09-15T09:18:24Z]</span> PII_MASK: Aadhaar displayed as XXXX
                XXXX 3841.
              </p>
              <p>
                <span className="text-clay-600">[2026-09-15T09:18:30Z]</span> PARAKH_HANDOFF: Cryptographic hash
                7f9a2d... queued.
              </p>
              <p className="text-sage-600">
                <span className="text-clay-600">[2026-09-15T09:18:32Z]</span> RETENTION_DAEMON: Ephemeral buffer
                cleared.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-surface-100 text-ink-faint text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Shield className="h-4 w-4 text-clay-500" />
            <span className="font-semibold text-ink-soft">PARAKH Document Intelligence</span>
            <span>&mdash; Enterprise Verification Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/security" className="hover:text-ink">Security & Privacy</Link>
            <Link href="/api-access" className="hover:text-ink">API Documentation</Link>
            <Link href="/dashboard" className="hover:text-ink">Console</Link>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4 text-center sm:text-left text-[11px] text-ink-faint">
          This system is restricted to authorized operational personnel for lawful identity screening and compliance purposes.
        </div>
      </footer>

      {/* Sign In Modal */}
      <AnimatePresence>
        {showSignInModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
              className="w-full max-w-md bg-white border border-border rounded-3xl p-6 shadow-lift space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-clay-500" />
                  <h3 className="font-display font-bold text-ink text-base">Operator Authentication</h3>
                </div>
                <button
                  onClick={() => setShowSignInModal(false)}
                  className="text-ink-faint hover:text-ink transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">
                    Institutional Operator ID / Email
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-sand-100 border border-border text-xs text-ink placeholder-ink-faint focus:outline-none focus:border-clay-400 focus:ring-2 focus:ring-clay-100 transition-all font-mono"
                    placeholder="operator@organization.org"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Password</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-sand-100 border border-border text-xs text-ink placeholder-ink-faint focus:outline-none focus:border-clay-400 focus:ring-2 focus:ring-clay-100 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                    Select Active Operational Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["OPERATOR", "INVESTIGATOR", "REVIEWER", "ADMINISTRATOR"] as const).map((role) => (
                      <button
                        type="button"
                        key={role}
                        onClick={() => {
                          setSelectedRole(role);
                          setEmailInput(
                            role === "ADMINISTRATOR" ? "admin@parakh-intel.org" : `${role.toLowerCase()}@parakh-intel.org`
                          );
                        }}
                        className={`px-3 py-2 rounded-xl border text-xs font-mono font-medium transition-all duration-200 text-left ${
                          selectedRole === role
                            ? "bg-clay-50 border-clay-300 text-clay-700 font-bold"
                            : "bg-sand-100 border-border text-ink-faint hover:bg-sand-200 hover:text-ink-soft"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-clay-500 hover:bg-clay-600 text-white font-semibold text-xs transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isLoading ? "Authenticating..." : "Authorize & Enter Console"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
