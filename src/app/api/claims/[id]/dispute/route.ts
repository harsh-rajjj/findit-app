import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { claims, reports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

/**
 * POST /api/claims/[id]/dispute
 * The claimer can dispute a claim (withdraw it) if they realize they claimed the wrong item.
 * This sets the claim status to "WITHDRAWN".
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [claim] = await db
      .select()
      .from(claims)
      .where(eq(claims.id, id))
      .limit(1);

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Only the claimer can withdraw their own claim
    if (claim.claimerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (claim.status === "WITHDRAWN") {
      return NextResponse.json({ error: "Claim already withdrawn" }, { status: 400 });
    }

    const [report] = await db
      .select({ title: reports.title, userId: reports.userId })
      .from(reports)
      .where(eq(reports.id, claim.reportId))
      .limit(1);

    // If it was previously approved, re-activate the report
    if (claim.status === "APPROVED") {
      await db.update(reports).set({ status: "ACTIVE" }).where(eq(reports.id, claim.reportId));
    }

    await db.update(claims).set({ status: "WITHDRAWN" }).where(eq(claims.id, id));

    // Notify the report owner
    if (report) {
      createNotification({
        userId: report.userId,
        type: "CLAIM",
        title: "↩️ Claim Withdrawn",
        message: `A claim on "${report.title}" has been withdrawn by the claimer.`,
        linkUrl: `/report/${claim.reportId}`,
      }).catch(() => {});
    }

    return NextResponse.json({ message: "Claim withdrawn successfully" });
  } catch (error) {
    console.error("Dispute claim error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
