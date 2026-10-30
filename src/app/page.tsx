"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  FileCheck2,
  FileSearch,
  Fingerprint,
  GraduationCap,
  Layers3,
  Loader2,
  LockKeyhole,
  Menu,
  ScanLine,
  Shield,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { BorderBeam } from "@/components/ui/BorderBeam";
import { useSession } from "@/components/providers/SessionProvider";

const stages = [
  {
    name: "Collect evidence",
    icon: Layers3,
    title: "Every case starts with evidence.",
    description:
      "Bring institutional records, declarations and supporting documents into one case. Category-specific checklists keep the submission grounded in what matters.",
    items: [
      "Four institutional application categories",
      "Document metadata and duplicate checks",
      "Image OCR with explicit PDF manual review",
    ],
    href: "/applications",
    action: "Explore applications",
  },
  {
    name: "Find the signals",
    icon: FileSearch,
    title: "Turn documents into understanding.",
    description:
      "Extract text, compare declared records and surface inconsistencies. Explainable findings keep the reasoning visible, so reviewers can inspect the evidence behind each signal.",
    items: [
      "Structured identity field extraction",
      "Cross-document consistency findings",
      "Clear reasons and recommended next steps",
    ],
    href: "/scanner",
    action: "Open document scanner",
  },
  {
    name: "Review with context",
    icon: ShieldCheck,
    title: "Keep human judgment at the center.",
    description:
      "Review deficiencies, record observations and request rectification. Unavailable sources stay visible as manual-review requirements, never assumed approvals.",
    items: [
      "Reviewer observations and status actions",
      "Source verification with honest availability",
      "Role-specific operational dashboards",
    ],
    href: "/dashboard",
    action: "Explore the workspace",
  },
  {
    name: "Build the dossier",
    icon: FileCheck2,
    title: "A clear record of the assessment.",
    description:
      "Bring the document manifest, regulatory findings and review context together. Export a preliminary dossier for the next stage of official scrutiny.",
    items: [
      "Institutional JSON dossier export",
      "Printable identity screening reports",
      "Document hashes and recorded audit events",
    ],
    href: "/reports",
    action: "Explore reports",
  },
];

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, transform: reduced ? "none" : "translateY(16px)" }}
      whileInView={{ opacity: 1, transform: "none" }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: reduced ? 0.12 : 0.5,
        delay: reduced ? 0 : delay,
        ease: [0.23, 1, 0.32, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

function EvidenceVisual() {
  const reduced = useReducedMotion();
  const sheetMotion = (transform: string, delay: number) => ({
    initial: reduced
      ? (false as const)
      : { opacity: 0, transform: "translate(-50%, -40%) rotate(0deg)" },
    whileInView: { opacity: 1, transform },
    viewport: { once: true, amount: 0.2 },
    transition: {
      duration: reduced ? 0 : 0.65,
      delay: reduced ? 0 : delay,
      ease: [0.23, 1, 0.32, 1] as const,
    },
  });
  return (
    <div
      className="evidence-visual"
      aria-label="Illustration: documents organized into an advisory assessment"
    >
      <div className="orbital orbital-one" />
      <div className="orbital orbital-two" />
      <div className="orbital orbital-three" />
      <div className="orbit-axis axis-one" />
      <div className="orbit-axis axis-two" />
      <motion.div
        className="evidence-sheet sheet-back"
        {...sheetMotion("translate(-35%, -50%) rotate(16deg)", 0.1)}
      >
        <div className="sheet-rule" />
        <div className="sheet-rule short" />
      </motion.div>
      <motion.div
        className="evidence-sheet sheet-middle"
        {...sheetMotion("translate(-44%, -50%) rotate(5deg)", 0.16)}
      >
        <div className="sheet-rule" />
        <div className="sheet-rule short" />
      </motion.div>
      <motion.div
        className="evidence-sheet sheet-front"
        {...sheetMotion("translate(-58%, -50%) rotate(-8deg)", 0.22)}
      >
        <div className="flex items-center justify-between">
          <Shield className="h-6 w-6 text-clay-600" />
          <span className="visual-label">EVIDENCE / 01</span>
        </div>
        <div className="sheet-title">
          The details.
          <br />
          The bigger picture.
        </div>
        <div className="sheet-rule" />
        <div className="sheet-rule" />
        <div className="sheet-rule short" />
        <div className="sheet-assessment">
          <span className="flex items-center gap-2">
            <FileSearch className="h-4 w-4" /> Advisory assessment
          </span>
          <ArrowUpRight className="h-4 w-4" />
        </div>
        <div className="sheet-footer">EVIDENCE → INTELLIGENCE → REVIEW</div>
      </motion.div>
      <div className="visual-coordinate coordinate-top">
        EVIDENCE FIELD / ILLUSTRATION
      </div>
      <div className="visual-coordinate coordinate-bottom">
        <span className="h-1.5 w-1.5 rounded-full bg-clay-600" /> HUMAN
        JUDGMENT, AT THE CENTER
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useSession();
  const [signIn, setSignIn] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [stage, setStage] = useState(0);
  const [animateStage, setAnimateStage] = useState(false);
  const reduced = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const current = stages[stage];
  const enterWorkspace = () => {
    if (user) window.location.assign("/dashboard");
    else setSignIn(true);
  };
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("signin") === "true")
      setSignIn(true);
  }, []);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          result.error || "Please check your credentials and try again.",
        );
      window.location.href = "/dashboard";
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Sign in could not connect. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landing-page">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="landing-nav">
        <Link href="/" aria-label="PARAKH home" className="brand-lockup">
          <span className="brand-symbol">
            <Shield className="h-5 w-5" />
          </span>
          <span>
            PARAKH<span className="brand-caption">DOCUMENT INTELLIGENCE</span>
          </span>
        </Link>
        <nav
          className="hidden md:flex items-center gap-8"
          aria-label="Main navigation"
        >
          <a href="#platform">Platform</a>
          <a href="#workflow">How it works</a>
          <a href="#principles">Our approach</a>
        </nav>
        <div className="flex items-center gap-3">
          <button onClick={enterWorkspace} className="landing-signin">
            {user ? "Workspace" : "Sign in"}{" "}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setMobileNav(true)}
            className="md:hidden p-2"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>
      <main id="main-content">
        <section className="landing-hero">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-content">
            <Reveal>
              <div className="hero-eyebrow">
                <span /> EVIDENCE-LED. HUMAN-CENTERED.
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <h1>
                Clarity before
                <br />
                every <span>decision.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="hero-description">
                From complex documents to considered decisions. A unified
                workspace for institutional compliance and identity
                intelligence.
              </p>
            </Reveal>
            <Reveal delay={0.24} className="hero-actions">
              <button
                className="landing-button primary"
                onClick={enterWorkspace}
              >
                Enter the workspace <ArrowUpRight className="h-4 w-4" />
              </button>
              <a href="#workflow" className="landing-button quiet">
                Discover the process <ArrowDown className="h-4 w-4" />
              </a>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="hero-note">
                <ShieldCheck className="h-4 w-4" /> Built for scrutiny. Designed
                for human oversight.
              </div>
            </Reveal>
          </div>
          <div className="hero-art">
            <EvidenceVisual />
          </div>
          <div className="hero-bottom">
            <span>01 — INTELLIGENCE WITH CONTEXT</span>
            <a href="#platform">
              SCROLL TO EXPLORE <ArrowDown className="h-3 w-3" />
            </a>
          </div>
          <div className="hero-watermark" aria-hidden="true">
            PARAKH
          </div>
        </section>
        <section className="platform-strip" aria-label="Platform capabilities">
          <span>
            <GraduationCap /> Institutional scrutiny
          </span>
          <span>
            <ScanLine /> Document intelligence
          </span>
          <span>
            <Workflow /> Explainable findings
          </span>
          <span>
            <ShieldCheck /> Human oversight
          </span>
        </section>
        <section id="platform" className="landing-section platform-section">
          <Reveal className="section-heading">
            <div className="section-kicker">THE PLATFORM / 01</div>
            <div>
              <h2>
                Complex evidence.
                <br />
                <span>A clear way forward.</span>
              </h2>
              <p>
                Two connected workspaces. One considered approach to
                understanding the information behind every case.
              </p>
            </div>
          </Reveal>
          <div className="platform-bento">
            <Reveal className="capability-card institutional-card">
              <div className="card-topline">
                <span className="card-icon">
                  <GraduationCap />
                </span>
                <span>INSTITUTIONAL INTELLIGENCE</span>
                <span className="card-index">01</span>
              </div>
              <h3>
                See the whole case.
                <br />
                Scrutinize every detail.
              </h3>
              <p>
                Category-aware checklists, evidence consistency checks and
                preliminary compliance findings for AICTE application review.
              </p>
              <div
                className="case-illustration"
                aria-label="Institutional review workflow illustration"
              >
                <div className="case-illustration-heading">
                  <span>
                    <Layers3 className="h-4 w-4" /> Application workspace
                  </span>
                  <span className="illustration-tag">WORKFLOW</span>
                </div>
                {[
                  "Evidence & declarations",
                  "Regulatory findings",
                  "Source verification",
                  "Reviewer observations",
                ].map((item, i) => (
                  <div key={item} className="case-illustration-row">
                    <span className="case-step">0{i + 1}</span>
                    <span>{item}</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                  </div>
                ))}
              </div>
              <Link href="/applications" className="capability-link">
                Explore application review <ArrowUpRight />
              </Link>
            </Reveal>
            <Reveal className="capability-card identity-card" delay={0.08}>
              <div className="card-topline">
                <span className="card-icon">
                  <Fingerprint />
                </span>
                <span>DOCUMENT INTELLIGENCE</span>
                <span className="card-index">02</span>
              </div>
              <h3>
                Read beyond
                <br />
                the surface.
              </h3>
              <p>
                Capture identity documents, extract structured fields and
                examine the signals that need a closer human look.
              </p>
              <div className="identity-illustration" aria-hidden="true">
                <div className="scan-corner top-left" />
                <div className="scan-corner top-right" />
                <div className="scan-corner bottom-left" />
                <div className="scan-corner bottom-right" />
                <Fingerprint className="identity-print" />
                <span>CAPTURE / EXTRACT / ASSESS</span>
              </div>
              <Link href="/scanner" className="capability-link">
                Explore document screening <ArrowUpRight />
              </Link>
            </Reveal>
          </div>
          <Reveal className="platform-footnote">
            <span>One platform, distinct assessments.</span>
            <p>
              Institutional compliance reflects completeness. Identity risk
              highlights concerns. Every result is advisory.
            </p>
          </Reveal>
        </section>
        <section id="workflow" className="landing-section workflow-section">
          <Reveal className="section-heading">
            <div className="section-kicker">THE PROCESS / 02</div>
            <div>
              <h2>
                From evidence
                <br />
                <span>to understanding.</span>
              </h2>
              <p>
                A deliberate path from submission to scrutiny, with context
                preserved at every step.
              </p>
            </div>
          </Reveal>
          <div
            className="workflow-tabs"
            role="tablist"
            aria-label="Explore the assessment workflow"
          >
            {stages.map((item, index) => (
              <button
                id={`workflow-tab-${index}`}
                key={item.name}
                role="tab"
                aria-selected={stage === index}
                aria-controls="workflow-panel"
                tabIndex={stage === index ? 0 : -1}
                onClick={(event) => {
                  setAnimateStage(event.detail > 0);
                  setStage(index);
                }}
                onKeyDown={(event) => {
                  if (
                    ["ArrowRight", "ArrowLeft", "Home", "End"].includes(
                      event.key,
                    )
                  ) {
                    event.preventDefault();
                    setAnimateStage(false);
                    const next =
                      event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? 3
                          : (index + (event.key === "ArrowRight" ? 1 : 3)) % 4;
                    setStage(next);
                    document.getElementById(`workflow-tab-${next}`)?.focus();
                  }
                }}
              >
                <span>0{index + 1}</span>
                {item.name}
                <item.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <div
            id="workflow-panel"
            role="tabpanel"
            aria-labelledby={`workflow-tab-${stage}`}
            tabIndex={0}
            className="workflow-panel"
          >
            <BorderBeam />
            <motion.div
              key={`copy-${stage}`}
              className="workflow-panel-copy"
              initial={
                animateStage && !reduced
                  ? { opacity: 0, transform: "translateY(8px)" }
                  : false
              }
              animate={{ opacity: 1, transform: "none" }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              <span className="section-kicker">
                0{stage + 1} / {current.name.toUpperCase()}
              </span>
              <h3>{current.title}</h3>
              <p>{current.description}</p>
              <Link className="capability-link" href={current.href}>
                {current.action}
                <ArrowUpRight />
              </Link>
            </motion.div>
            <div className="workflow-diagram">
              <div className="workflow-node">
                <current.icon className="h-8 w-8" />
                <span>{current.name}</span>
              </div>
              <div className="workflow-connector" />
              <div className="workflow-checks">
                {current.items.map((item) => (
                  <div key={item}>
                    <span>
                      <Check className="h-3 w-3" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
              <span className="diagram-caption">
                PLATFORM WORKFLOW · ILLUSTRATIVE
              </span>
            </div>
          </div>
        </section>
        <section id="principles" className="landing-section principles-section">
          <Reveal className="section-heading">
            <div className="section-kicker">OUR APPROACH / 03</div>
            <div>
              <h2>
                Intelligence you can inspect.
                <br />
                <span>Judgment you can own.</span>
              </h2>
            </div>
          </Reveal>
          <div className="principles-grid">
            {[
              {
                icon: FileSearch,
                title: "Reasoning, made visible.",
                text: "Findings carry explanations and next steps. Follow the signal back to the evidence, rather than relying on an unexplained score.",
              },
              {
                icon: LockKeyhole,
                title: "Access with purpose.",
                text: "Role-specific workspaces and recorded review actions keep operational responsibilities clear.",
              },
              {
                icon: ShieldCheck,
                title: "Honest by design.",
                text: "Unavailable sources and manual-review requirements stay explicit. A preliminary assessment never replaces an official decision.",
              },
            ].map((item, i) => (
              <Reveal
                key={item.title}
                delay={i * 0.06}
                className="principle-card"
              >
                <item.icon className="h-6 w-6" />
                <span className="principle-number">0{i + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="landing-cta">
          <div className="cta-orbit" aria-hidden="true" />
          <Reveal>
            <span className="section-kicker">
              THE NEXT STEP IS A CLEARER ONE.
            </span>
            <h2>
              Bring the evidence.
              <br />
              <span>Find the clarity.</span>
            </h2>
            <button onClick={enterWorkspace} className="landing-button primary">
              Enter the workspace <ArrowUpRight className="h-4 w-4" />
            </button>
            <p>For authorized institutional and document review teams.</p>
          </Reveal>
        </section>
      </main>
      <footer className="landing-footer">
        <Link className="brand-lockup" href="/">
          <Shield className="h-5 w-5" />
          PARAKH
        </Link>
        <p>Evidence. Intelligence. Clarity.</p>
        <div>
          <Link href="/applications">Applications</Link>
          <Link href="/scanner">Screening</Link>
          <Link href="/security">Privacy & access</Link>
        </div>
        <span className="footer-disclaimer">
          Preliminary decision support. Final authority rests with the competent
          scrutiny committee.
        </span>
      </footer>
      <Dialog
        open={signIn}
        onOpenChange={setSignIn}
        title="Welcome to PARAKH"
        description="Sign in with your authorized institutional credentials."
      >
        <form onSubmit={handleSignIn} className="space-y-5">
          <div>
            <label htmlFor="login-role" className="form-label">
              Workspace role
            </label>
            <select
              id="login-role"
              defaultValue=""
              onChange={(event) => {
                if (event.target.value) {
                  setEmail(
                    `${event.target.value === "administrator" ? "admin" : event.target.value}@parakh-intel.org`,
                  );
                  // Public demo password shared by the accounts in lib/seed.ts.
                  setPassword("Parakh@Enterprise2026");
                  setError("");
                }
              }}
              className="form-control"
            >
              <option value="">Select a demo role (optional)</option>
              {["operator", "investigator", "reviewer", "administrator"].map(
                (role) => (
                  <option key={role} value={role}>
                    {role[0].toUpperCase() + role.slice(1)}
                  </option>
                ),
              )}
            </select>
            <p className="text-xs text-ink-soft mt-2">
              Selecting a demo role fills in its email and password. You can
              then sign in directly.
            </p>
          </div>
          <div>
            <label htmlFor="login-email" className="form-label">
              Institutional email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="form-control"
              placeholder="you@institution.org"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="form-label">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="form-control"
            />
          </div>
          {error && (
            <p role="alert" className="feedback-error">
              {error}
            </p>
          )}
          <button
            disabled={loading}
            type="submit"
            className="workspace-primary w-full justify-center"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LockKeyhole className="h-4 w-4" />
            )}
            {loading ? "Signing in…" : "Sign in to workspace"}
            <ArrowRight className="h-4 w-4 ml-auto" />
          </button>
        </form>
      </Dialog>
      <Dialog
        open={mobileNav}
        onOpenChange={setMobileNav}
        title="Explore PARAKH"
      >
        <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
          {[
            { href: "#platform", label: "Platform" },
            { href: "#workflow", label: "How it works" },
            { href: "#principles", label: "Our approach" },
          ].map((link) => (
            <a
              className="p-4 rounded-xl hover:bg-sand-100 flex justify-between"
              key={link.href}
              href={link.href}
              onClick={() => setMobileNav(false)}
            >
              {link.label}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          ))}
        </nav>
      </Dialog>
    </div>
  );
}
