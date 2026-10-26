import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { ParakhIntegrationClient } from "@/lib/parakh/parakh-client";
import { recordAuditLog } from "@/lib/audit/logger";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await prisma.screeningSession.findFirst({
      where: { OR: [{ id }, { screeningId: id }] },
    });

    if (!session) {
      return NextResponse.json({ error: "Screening record not found." }, { status: 404 });
    }

    const client = new ParakhIntegrationClient();
    const receipt = await client.dispatchScreeningRecord(session.id);

    const currentUser = await getCurrentUser();
    await recordAuditLog({
      organizationId: session.organizationId,
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      action: "PARAKH_INTELLIGENCE_DISPATCHED",
      resourceType: "SCREENING_SESSION",
      resourceId: session.screeningId,
      details: `Structured evidence package dispatched to PARAKH Hub. Transaction ID: ${receipt.parakhTransactionId}`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      receipt,
      message: "Screening intelligence successfully transmitted to PARAKH Intelligence Platform.",
    });
  } catch (error: any) {
    console.error("[PARAKH_DISPATCH_ERROR]", error);
    return NextResponse.json({ error: "Failed to dispatch to PARAKH Platform." }, { status: 500 });
  }
}
