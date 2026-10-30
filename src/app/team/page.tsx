"use client";
import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ROLE_PERMISSIONS, UserRole } from "@/lib/auth/roles";
import {
  ScanLine,
  SearchCheck,
  ClipboardCheck,
  ShieldCheck,
  Check,
  Minus,
  ArrowUpRight,
} from "lucide-react";
const roles: {
  role: UserRole;
  title: string;
  description: string;
  icon: typeof ScanLine;
}[] = [
  {
    role: "OPERATOR",
    title: "Operator",
    description: "Capture documents and prepare screening records.",
    icon: ScanLine,
  },
  {
    role: "INVESTIGATOR",
    title: "Investigator",
    description: "Inspect anomaly signals and prepare evidence handoffs.",
    icon: SearchCheck,
  },
  {
    role: "REVIEWER",
    title: "Reviewer",
    description:
      "Review findings and request justified access to sensitive fields.",
    icon: ClipboardCheck,
  },
  {
    role: "ADMINISTRATOR",
    title: "Administrator",
    description:
      "Manage credentials, inspect audit records and purge original images.",
    icon: ShieldCheck,
  },
];
const capabilities = [
  { label: "Create & read screenings", permission: "screenings:create" },
  { label: "View & export reports", permission: "reports:export" },
  { label: "Inspect forensic signals", permission: "forensics:view" },
  { label: "Biometric review access", permission: "biometrics:analyze" },
  { label: "Dispatch evidence", permission: "parakh:dispatch" },
  { label: "Request PII unmasking", permission: "pii:unmask" },
  { label: "Purge document images", permission: "screenings:delete" },
  { label: "Manage API keys", permission: "api_keys:manage" },
];
export default function TeamPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-clay-600">
            Governance / Access
          </p>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                The right access. For every role.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
                A reference to the platform’s declared role permissions. Your
                role is assigned to your account.
              </p>
            </div>
            <span className="w-fit rounded-full border border-border bg-white px-3 py-1.5 text-[11px] text-ink-soft">
              Permission reference
            </span>
          </div>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {roles.map(({ role, title, description, icon: Icon }, index) => (
            <section
              key={role}
              className="rounded-2xl border border-border bg-white p-6"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-clay-50 p-2.5 text-clay-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-[11px] text-ink-faint">
                  0{index + 1}
                </span>
              </div>
              <h2 className="mt-6 font-display text-lg font-semibold text-ink">
                {title}
              </h2>
              <p className="mt-2 min-h-[60px] text-xs leading-5 text-ink-soft">
                {description}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs">
                <span className="text-ink-faint">Declared permissions</span>
                <span className="font-mono font-medium text-ink">
                  {ROLE_PERMISSIONS[role].length}
                </span>
              </div>
            </section>
          ))}
        </div>
        <section className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="border-b border-border p-6 sm:p-7">
            <h2 className="font-display text-lg font-semibold text-ink">
              Capability matrix
            </h2>
            <p className="mt-2 text-xs leading-5 text-ink-soft">
              Permission definitions from the application’s role map. Individual
              endpoints also enforce their own authorization checks.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <caption className="sr-only">
                Declared permissions by platform role
              </caption>
              <thead className="bg-surface-100 text-ink-soft">
                <tr>
                  <th scope="col" className="px-6 py-4 font-medium">
                    Capability
                  </th>
                  {roles.map((item) => (
                    <th
                      scope="col"
                      key={item.role}
                      className="px-4 py-4 text-center font-medium"
                    >
                      {item.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {capabilities.map((item) => (
                  <tr
                    key={item.permission}
                    className="transition hover:bg-surface-100"
                  >
                    <th scope="row" className="px-6 py-4 font-medium text-ink">
                      {item.label}
                    </th>
                    {roles.map(({ role }) => (
                      <td key={role} className="px-4 py-4 text-center">
                        {ROLE_PERMISSIONS[role].includes(item.permission) ? (
                          <span className="inline-flex rounded-full bg-sage-50 p-1 text-sage-600">
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="sr-only">Allowed</span>
                          </span>
                        ) : (
                          <span className="inline-flex text-ink-faint">
                            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="sr-only">Not declared</span>
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-border bg-white p-6">
            <h2 className="text-sm font-semibold text-ink">Team directory</h2>
            <p className="mt-3 text-xs leading-6 text-ink-soft">
              A live member directory and account-management controls are not
              connected in this workspace. No demonstration identities are
              presented as current personnel.
            </p>
          </section>
          <section className="rounded-2xl border border-clay-200 bg-clay-50 p-6">
            <h2 className="text-sm font-semibold text-clay-800">
              Access is accountable
            </h2>
            <p className="mt-3 text-xs leading-6 text-clay-800">
              Sensitive-field reveal requires an operational justification.
              Audit access is available to authorized reviewers and
              administrators.
            </p>
            <Link
              href="/activity"
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-clay-800"
            >
              Open activity records
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
