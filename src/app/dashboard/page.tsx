"use client";

import React from "react";
import { useSession } from "@/components/providers/SessionProvider";
import { AppShell } from "@/components/layout/AppShell";
import { OperatorDashboard } from "./_components/OperatorDashboard";
import { InvestigatorDashboard } from "./_components/InvestigatorDashboard";
import { ReviewerDashboard } from "./_components/ReviewerDashboard";
import { AdministratorDashboard } from "./_components/AdministratorDashboard";

export default function DashboardPage() {
  const { user, loading, error, refresh } = useSession();
  const role = user?.role;

  return (
    <AppShell>
      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-border bg-white p-12 text-center"
        >
          <h1 className="text-xl font-semibold text-ink">
            Dashboard unavailable
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            We could not confirm your session. Please try again.
          </p>
          <button
            className="mt-5 rounded-lg bg-clay-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => void refresh()}
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <div role="status" className="py-24 text-center text-ink-faint text-sm">
          Loading your dashboard…
        </div>
      ) : !role ? (
        <div
          role="status"
          className="rounded-2xl border border-border bg-white p-12 text-center text-sm text-ink-soft"
        >
          Sign in to view your workspace.
        </div>
      ) : role === "ADMINISTRATOR" ? (
        <AdministratorDashboard />
      ) : role === "REVIEWER" ? (
        <ReviewerDashboard />
      ) : role === "INVESTIGATOR" ? (
        <InvestigatorDashboard />
      ) : (
        <OperatorDashboard />
      )}
    </AppShell>
  );
}
