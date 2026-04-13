import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { claims, reports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

/**
 * POST /api/claims/[id]/revoke
 * The report owner can revoke an approval if the item was given to the wrong person,
 * or if they made a mistake approving. Resets the claim status to PENDING
 * and the report back to ACTIVE.
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

    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, claim.reportId))
      .limit(1);

    // Only the report owner can revoke approval
    if (!report || report.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (claim.status !== "APPROVED") {
      return NextResponse.json({ error: "Only approved claims can be revoked" }, { status: 400 });
    }

    // Revoke: set claim back to PENDING, report back to ACTIVE
    await db.update(claims).set({ status: "REVOKED" }).where(eq(claims.id, id));
    await db.update(reports).set({ status: "ACTIVE" }).where(eq(reports.id, claim.reportId));

    // Notify the claimer
    createNotification({
      userId: claim.claimerId,
      type: "CLAIM_REJECTED",
      title: "⚠️ Approval Revoked",
      message: `The approval for your claim on "${report.title}" has been revoked. The item is back to active listings.`,
      linkUrl: `/report/${claim.reportId}`,
    }).catch(() => {});

    return NextResponse.json({ message: "Approval revoked successfully" });
  } catch (error) {
    console.error("Revoke claim error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
