"use client";
import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  ArrowUpRight,
  Building2,
  ScanLine,
  FileSearch,
  ClipboardCheck,
  ShieldCheck,
  ArrowRight,
  Info,
} from "lucide-react";
export default function VerificationGatewayPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-clay-600">
            Operations / Verification
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Evidence first.
            <br />
            Certainty through review.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-ink-soft">
            Choose the appropriate review workspace. Automated findings support
            scrutiny; they do not replace authorized human judgment.
          </p>
        </header>
        <div className="grid gap-5 md:grid-cols-2">
          {[
            {
              icon: Building2,
              eyebrow: "Institutional evidence",
              title: "Application source review",
              detail:
                "Review AICTE case documents, run available source checks, and record authorized manual verification decisions.",
              href: "/applications",
              action: "Open applications",
              tags: [
                "Source records",
                "Manual decisions",
                "Compliance findings",
              ],
            },
            {
              icon: ScanLine,
              eyebrow: "Identity documents",
              title: "Document screening",
              detail:
                "Extract document fields and review format, OCR and heuristic anomaly signals. A screening result is not an issuer-database verification.",
              href: "/scanner",
              action: "Open scanner",
              tags: ["OCR extraction", "Format checks", "Risk assessment"],
            },
          ].map(
            ({ icon: Icon, eyebrow, title, detail, href, action, tags }) => (
              <section
                key={title}
                className="group flex flex-col rounded-2xl border border-border bg-white p-6 transition hover:border-clay-300 sm:p-8"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-xl bg-clay-50 p-3 text-clay-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    {eyebrow}
                  </span>
                </div>
                <h2 className="mt-8 font-display text-2xl font-semibold tracking-tight text-ink">
                  {title}
                </h2>
                <p className="mt-4 flex-1 text-sm leading-7 text-ink-soft">
                  {detail}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-surface-100 px-2.5 py-1 text-[10px] text-ink-soft"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  href={href}
                  className="mt-8 inline-flex items-center justify-between border-t border-border pt-5 text-sm font-semibold text-ink"
                >
                  {action}
                  <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </section>
            ),
          )}
        </div>
        <section className="rounded-2xl border border-border bg-white p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-clay-600">
                Review protocol
              </p>
              <h2 className="mt-3 font-display text-xl font-semibold text-ink">
                Keep every conclusion traceable.
              </h2>
            </div>
            <Link
              href="/documents"
              className="inline-flex items-center gap-2 text-xs font-medium text-ink-soft"
            >
              Screening registry
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-7 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: FileSearch,
                title: "Inspect the evidence",
                detail:
                  "Check the submitted document, extracted fields, dates and supporting references.",
              },
              {
                icon: ShieldCheck,
                title: "Understand the source",
                detail:
                  "Separate automated checks, unavailable connectors and manual verification records.",
              },
              {
                icon: ClipboardCheck,
                title: "Record the decision",
                detail:
                  "Use the case workflow to capture observations and the next review action.",
              },
            ].map(({ icon: Icon, title, detail }, index) => (
              <div key={title} className="border-t border-border pt-5">
                <div className="flex items-center justify-between text-clay-600">
                  <Icon className="h-4 w-4" />
                  <span className="font-mono text-[10px] text-ink-faint">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-xs leading-6 text-ink-soft">{detail}</p>
              </div>
            ))}
          </div>
        </section>
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <section className="flex items-start gap-3 rounded-2xl border border-clay-200 bg-clay-50 p-6">
            <Info className="mt-1 h-4 w-4 shrink-0 text-clay-600" />
            <div>
              <h2 className="text-sm font-semibold text-clay-800">
                Connector availability
              </h2>
              <p className="mt-3 text-xs leading-6 text-clay-800">
                This page does not provide live Aadhaar, PAN, Passport or
                driving-licence registry queries. Institutional source checks
                may return unavailable or require manual review. Their actual
                results appear in the individual application.
              </p>
              <Link
                href="/integrations"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-clay-800"
              >
                Review integration configuration
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-white p-6">
            <h2 className="text-sm font-semibold text-ink">
              Portfolio perspective
            </h2>
            <p className="mt-3 text-xs leading-6 text-ink-soft">
              See source coverage, recurring deficiencies and the institutional
              review queue.
            </p>
            <Link
              href="/applications/insights"
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-ink"
            >
              Open insights
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
