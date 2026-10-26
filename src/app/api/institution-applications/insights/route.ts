import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["DRAFT", "SUBMITTED", "VALIDATION_PENDING", "RECTIFICATION_REQUESTED", "OFFICIAL_REVIEW_REQUIRED", "UNDER_REVIEW"];
const NON_PASSING_FINDING_STATUSES = ["FAILED", "WARNING", "MANUAL_REVIEW_REQUIRED"];
const CROSS_DOCUMENT_RULE_IDS = ["RULE_CROSS_DOCUMENT_ID_CONSISTENCY", "RULE_DOCUMENT_DATE_METADATA_INTEGRITY"];

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await prisma.institutionApplication.findMany({
      where: { organizationId: user.organizationId },
      include: {
        findings: true,
        sourceChecks: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // 1. Application category volume
    const categoryBreakdown: Record<string, number> = {};
    for (const app of applications) {
      categoryBreakdown[app.applicationCategory] = (categoryBreakdown[app.applicationCategory] || 0) + 1;
    }

    // 2. Compliance score distribution (only applications that have been validated at least once)
    const validatedApps = applications.filter((a) => a.lastValidatedAt !== null);
    const scoreBuckets = [
      { range: "0-25", min: 0, max: 25, count: 0 },
      { range: "26-50", min: 26, max: 50, count: 0 },
      { range: "51-75", min: 51, max: 75, count: 0 },
      { range: "76-100", min: 76, max: 100, count: 0 },
    ];
    for (const app of validatedApps) {
      const bucket = scoreBuckets.find((b) => app.complianceScore >= b.min && app.complianceScore <= b.max);
      if (bucket) bucket.count++;
    }

    // 3. Most frequent deficiencies across the entire portfolio (current findings only —
    // findings are replaced on every validate() run, so this reflects the latest state)
    const deficiencyFrequency = new Map<string, { ruleId: string; title: string; severity: string; count: number }>();
    for (const app of applications) {
      for (const f of app.findings) {
        if (!NON_PASSING_FINDING_STATUSES.includes(f.status)) continue;
        const key = f.ruleId;
        const existing = deficiencyFrequency.get(key);
        if (existing) {
          existing.count++;
        } else {
          const label = f.ruleId
            .replace(/^RULE_(MANDATORY_)?/, "")
            .split("_")
            .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
            .join(" ");
          deficiencyFrequency.set(key, { ruleId: f.ruleId, title: label, severity: f.severity, count: 1 });
        }
      }
    }
    const topDeficiencies = Array.from(deficiencyFrequency.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 4. External source-verification standing across the whole portfolio
    const sourceStanding: Record<string, number> = {};
    for (const app of applications) {
      for (const sc of app.sourceChecks) {
        sourceStanding[sc.status] = (sourceStanding[sc.status] || 0) + 1;
      }
    }

    // 5. Cross-document consistency flags (ties the new consistency-check rules
    // into a portfolio-level signal: how many applications have at least one
    // unresolved cross-document ID/date inconsistency right now)
    const crossDocumentFlaggedApps = applications.filter((app) =>
      app.findings.some((f) => CROSS_DOCUMENT_RULE_IDS.includes(f.ruleId) && f.status !== "PASSED")
    );

    // 6. Reviewer triage queue: active (not yet scrutiny-ready/closed) applications,
    // prioritized by severity of outstanding findings first, then by how long they've
    // been waiting — this is the "what should I look at first" signal, not a duplicate
    // of the list view's static counts.
    const triageQueue = applications
      .filter((app) => ACTIVE_STATUSES.includes(app.validationStatus))
      .map((app) => {
        const criticalCount = app.findings.filter((f) => f.severity === "CRITICAL" && f.status === "FAILED").length;
        const ageDays = Math.floor((Date.now() - new Date(app.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: app.id,
          applicationNumber: app.applicationNumber,
          institutionName: app.institutionName,
          validationStatus: app.validationStatus,
          complianceScore: app.complianceScore,
          criticalCount,
          ageDays,
        };
      })
      .sort((a, b) => b.criticalCount - a.criticalCount || b.ageDays - a.ageDays)
      .slice(0, 6);

    return NextResponse.json({
      success: true,
      data: {
        totalApplications: applications.length,
        categoryBreakdown,
        scoreDistribution: scoreBuckets,
        topDeficiencies,
        sourceStanding,
        crossDocumentFlaggedCount: crossDocumentFlaggedApps.length,
        triageQueue,
      },
    });
  } catch (error: any) {
    console.error("[AICTE_INSIGHTS_ERROR]", error);
    return NextResponse.json({ error: "Failed to compute portfolio insights." }, { status: 500 });
  }
}
