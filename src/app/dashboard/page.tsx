"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { OperatorDashboard } from "./_components/OperatorDashboard";
import { InvestigatorDashboard } from "./_components/InvestigatorDashboard";
import { ReviewerDashboard } from "./_components/ReviewerDashboard";
import { AdministratorDashboard } from "./_components/AdministratorDashboard";

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        setRole(d.authenticated && d.user ? d.user.role : null);
      })
      .catch(() => setRole(null))
      .finally(() => setResolved(true));
  }, []);

  return (
    <AppShell>
      {!resolved ? (
        <div className="py-24 text-center text-ink-faint text-sm">Loading your dashboard…</div>
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
