import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const ACTIVE_APP_STATUSES = ["DRAFT", "SUBMITTED", "VALIDATION_PENDING", "RECTIFICATION_REQUESTED", "OFFICIAL_REVIEW_REQUIRED", "UNDER_REVIEW"];
const CROSS_DOCUMENT_RULE_IDS = ["RULE_CROSS_DOCUMENT_ID_CONSISTENCY", "RULE_DOCUMENT_DATE_METADATA_INTEGRITY"];

function bucketLast14Days(dates: Date[]): { label: string; value: number }[] {
  const buckets: { label: string; key: string; value: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    buckets.push({
      label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      key: d.toISOString().slice(0, 10),
      value: 0,
    });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const date of dates) {
    const key = new Date(date).toISOString().slice(0, 10);
    const bucket = byKey.get(key);
    if (bucket) bucket.value++;
  }
  return buckets.map(({ label, value }) => ({ label, value }));
}

async function buildOperatorDashboard(orgId: string, userId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [myToday, myTotal, mySessions, needsAttention] = await Promise.all([
    prisma.screeningSession.count({ where: { operatorId: userId, createdAt: { gte: todayStart } } }),
    prisma.screeningSession.count({ where: { operatorId: userId } }),
    prisma.screeningSession.findMany({
      where: { operatorId: userId },
      select: { documentType: true, processingTimeMs: true, createdAt: true, ocrResult: { select: { averageConfidence: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.screeningSession.findMany({
      where: {
        operatorId: userId,
        OR: [{ status: "REQUIRES_REVIEW" }, { status: "FLAGGED" }, { ocrResult: { averageConfidence: { lt: 50 } } }],
      },
      select: { id: true, screeningId: true, documentType: true, status: true, riskTier: true, createdAt: true, ocrResult: { select: { averageConfidence: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const recent = mySessions.slice(0, 8);
  const avgProcessingTime = mySessions.length
    ? Math.round(mySessions.reduce((s, r) => s + r.processingTimeMs, 0) / mySessions.length)
    : 0;
  const confidences = mySessions.map((r) => r.ocrResult?.averageConfidence ?? 0).filter((c) => c > 0);
  const avgOcrConfidence = confidences.length ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length) : 0;

  const docDistribution: Record<string, number> = {};
  for (const s of mySessions) {
    docDistribution[s.documentType] = (docDistribution[s.documentType] || 0) + 1;
  }

  const recentScreenings = await prisma.screeningSession.findMany({
    where: { operatorId: userId },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, screeningId: true, documentType: true, status: true, riskTier: true, riskScore: true, createdAt: true },
  });

  return {
    role: "OPERATOR" as const,
    myScreeningsToday: myToday,
    myScreeningsTotal: myTotal,
    avgProcessingTimeMs: avgProcessingTime,
    avgOcrConfidence,
    docDistribution,
    needsAttention,
    recentScreenings,
  };
}

async function buildInvestigatorDashboard(orgId: string) {
  const [riskTierCounts, anomalies, faceVerifications, riskQueue, applications] = await Promise.all([
    prisma.screeningSession.groupBy({ by: ["riskTier"], where: { organizationId: orgId }, _count: true }),
    prisma.forensicAnomaly.findMany({
      where: { screeningSession: { organizationId: orgId } },
      select: { severity: true },
    }),
    prisma.faceVerification.findMany({
      where: { screeningSession: { organizationId: orgId } },
      select: { matchStatus: true },
    }),
    prisma.screeningSession.findMany({
      where: { organizationId: orgId, riskTier: { in: ["HIGH_RISK", "REVIEW_REQUIRED"] } },
      orderBy: { riskScore: "desc" },
      take: 8,
      select: {
        id: true,
        screeningId: true,
        documentType: true,
        riskTier: true,
        riskScore: true,
        createdAt: true,
        operator: { select: { name: true } },
      },
    }),
    prisma.institutionApplication.findMany({
      where: { organizationId: orgId },
      include: { findings: true },
    }),
  ]);

  const riskTierDistribution: Record<string, number> = {};
  for (const r of riskTierCounts) riskTierDistribution[r.riskTier] = r._count;

  const anomalySeverity: Record<string, number> = { INFO: 0, MODERATE: 0, HIGH: 0 };
  for (const a of anomalies) anomalySeverity[a.severity] = (anomalySeverity[a.severity] || 0) + 1;

  const faceMismatchCount = faceVerifications.filter((f) => f.matchStatus === "REVIEW_REQUIRED" || f.matchStatus === "NO_MATCH").length;

  const crossDocumentFlagged = applications
    .filter((app) => app.findings.some((f) => CROSS_DOCUMENT_RULE_IDS.includes(f.ruleId) && f.status !== "PASSED"))
    .map((app) => ({
      id: app.id,
      applicationNumber: app.applicationNumber,
      institutionName: app.institutionName,
      flaggedRules: app.findings.filter((f) => CROSS_DOCUMENT_RULE_IDS.includes(f.ruleId) && f.status !== "PASSED").length,
    }))
    .slice(0, 6);

  return {
    role: "INVESTIGATOR" as const,
    riskTierDistribution,
    anomalySeverity,
    faceMismatchCount,
    faceVerificationsTotal: faceVerifications.length,
    riskQueue,
    crossDocumentFlagged,
  };
}

async function buildReviewerDashboard(orgId: string) {
  const [applications, auditExcerpt] = await Promise.all([
    prisma.institutionApplication.findMany({
      where: { organizationId: orgId },
      include: { findings: true, sourceChecks: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.auditLog.findMany({
      where: {
        organizationId: orgId,
        OR: [{ action: { contains: "UNMASK" } }, { action: { contains: "PARAKH" } }, { action: { contains: "REVIEW" } }],
      },
      orderBy: { timestamp: "desc" },
      take: 8,
    }),
  ]);

  const scoreBuckets = [
    { range: "0-25", min: 0, max: 25, count: 0 },
    { range: "26-50", min: 26, max: 50, count: 0 },
    { range: "51-75", min: 51, max: 75, count: 0 },
    { range: "76-100", min: 76, max: 100, count: 0 },
  ];
  const validatedApps = applications.filter((a) => a.lastValidatedAt !== null);
  for (const app of validatedApps) {
    const bucket = scoreBuckets.find((b) => app.complianceScore >= b.min && app.complianceScore <= b.max);
    if (bucket) bucket.count++;
  }

  const pendingByStatus: Record<string, { count: number; totalAgeDays: number }> = {};
  for (const app of applications) {
    if (!ACTIVE_APP_STATUSES.includes(app.validationStatus)) continue;
    const ageDays = Math.floor((Date.now() - new Date(app.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (!pendingByStatus[app.validationStatus]) pendingByStatus[app.validationStatus] = { count: 0, totalAgeDays: 0 };
    pendingByStatus[app.validationStatus].count++;
    pendingByStatus[app.validationStatus].totalAgeDays += ageDays;
  }
  const pendingBreakdown = Object.entries(pendingByStatus).map(([status, v]) => ({
    status,
    count: v.count,
    avgAgeDays: Math.round(v.totalAgeDays / v.count),
  }));

  const sourceStanding: Record<string, number> = {};
  for (const app of applications) {
    for (const sc of app.sourceChecks) {
      sourceStanding[sc.status] = (sourceStanding[sc.status] || 0) + 1;
    }
  }

  const triageQueue = applications
    .filter((app) => ACTIVE_APP_STATUSES.includes(app.validationStatus))
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
    .slice(0, 8);

  return {
    role: "REVIEWER" as const,
    totalApplications: applications.length,
    scoreDistribution: scoreBuckets,
    pendingBreakdown,
    sourceStanding,
    triageQueue,
    auditExcerpt,
  };
}

async function buildAdministratorDashboard(orgId: string) {
  const [
    usersByRole,
    screenings,
    applications,
    apiKeys,
    ocrResults,
    appDocuments,
    sourceChecks,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], where: { organizationId: orgId }, _count: true }),
    prisma.screeningSession.findMany({ where: { organizationId: orgId }, select: { createdAt: true, riskTier: true } }),
    prisma.institutionApplication.findMany({
      where: { organizationId: orgId },
      select: { createdAt: true, applicationCategory: true, complianceScore: true, lastValidatedAt: true },
    }),
    prisma.apiKey.findMany({ where: { organizationId: orgId }, select: { name: true, isActive: true, lastUsedAt: true, createdAt: true } }),
    prisma.oCRResult.findMany({ where: { screeningSession: { organizationId: orgId } }, select: { averageConfidence: true } }),
    prisma.applicationDocument.findMany({ where: { application: { organizationId: orgId } }, select: { ocrStatus: true } }),
    prisma.sourceVerificationRecord.findMany({ where: { application: { organizationId: orgId } }, select: { status: true } }),
  ]);

  const usersByRoleMap: Record<string, number> = {};
  for (const r of usersByRole) usersByRoleMap[r.role] = r._count;

  const volumeTrend = bucketLast14Days(screenings.map((s) => s.createdAt)).map((pt, i) => {
    const appTrend = bucketLast14Days(applications.map((a) => a.createdAt));
    return { label: pt.label, screenings: pt.value, applications: appTrend[i]?.value ?? 0 };
  });

  const riskTierDistribution: Record<string, number> = {};
  for (const s of screenings) riskTierDistribution[s.riskTier] = (riskTierDistribution[s.riskTier] || 0) + 1;

  const categoryBreakdown: Record<string, number> = {};
  for (const a of applications) categoryBreakdown[a.applicationCategory] = (categoryBreakdown[a.applicationCategory] || 0) + 1;

  const scoreBuckets = [
    { range: "0-25", min: 0, max: 25, count: 0 },
    { range: "26-50", min: 26, max: 50, count: 0 },
    { range: "51-75", min: 51, max: 75, count: 0 },
    { range: "76-100", min: 76, max: 100, count: 0 },
  ];
  for (const a of applications.filter((x) => x.lastValidatedAt !== null)) {
    const bucket = scoreBuckets.find((b) => a.complianceScore >= b.min && a.complianceScore <= b.max);
    if (bucket) bucket.count++;
  }

  const failedOcr = ocrResults.filter((r) => r.averageConfidence === 0).length;
  const ocrFailureRate = ocrResults.length ? Math.round((failedOcr / ocrResults.length) * 100) : 0;

  const unavailableAppDocs = appDocuments.filter((d) => d.ocrStatus === "UNAVAILABLE_MANUAL_REVIEW" || d.ocrStatus === "FAILED").length;
  const appDocOcrFailureRate = appDocuments.length ? Math.round((unavailableAppDocs / appDocuments.length) * 100) : 0;

  const sourceUnavailable = sourceChecks.filter((s) => s.status === "SOURCE_UNAVAILABLE").length;
  const sourceUnavailableRate = sourceChecks.length ? Math.round((sourceUnavailable / sourceChecks.length) * 100) : 0;

  return {
    role: "ADMINISTRATOR" as const,
    totalUsers: Object.values(usersByRoleMap).reduce((a, b) => a + b, 0),
    usersByRole: usersByRoleMap,
    totalScreenings: screenings.length,
    totalApplications: applications.length,
    volumeTrend,
    riskTierDistribution,
    categoryBreakdown,
    scoreDistribution: scoreBuckets,
    apiKeys,
    ocrFailureRate,
    appDocOcrFailureRate,
    sourceUnavailableRate,
  };
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized. Session required." }, { status: 401 });
    }

    const orgId = currentUser.organizationId;
    let data;

    switch (currentUser.role) {
      case "OPERATOR":
        data = await buildOperatorDashboard(orgId, currentUser.id);
        break;
      case "INVESTIGATOR":
        data = await buildInvestigatorDashboard(orgId);
        break;
      case "REVIEWER":
        data = await buildReviewerDashboard(orgId);
        break;
      case "ADMINISTRATOR":
        data = await buildAdministratorDashboard(orgId);
        break;
      default:
        return NextResponse.json({ error: "Unrecognized role." }, { status: 403 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[DASHBOARD_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to compute dashboard insights." }, { status: 500 });
  }
}
