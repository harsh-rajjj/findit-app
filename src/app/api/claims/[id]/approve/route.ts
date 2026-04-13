import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { claims, reports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

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

    // Get the claim with its report
    const [claim] = await db
      .select()
      .from(claims)
      .where(eq(claims.id, id))
      .limit(1);

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Get the report to verify ownership
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, claim.reportId))
      .limit(1);

    if (!report || report.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Approve the claim and resolve the report
    await db.update(claims).set({ status: "APPROVED" }).where(eq(claims.id, id));
    await db.update(reports).set({ status: "RESOLVED" }).where(eq(reports.id, claim.reportId));

    // Notify the claimer
    createNotification({
      userId: claim.claimerId,
      type: "CLAIM_APPROVED",
      title: "✅ Claim Approved!",
      message: `Your claim on "${report.title}" has been approved! Coordinate pickup now.`,
      linkUrl: `/claim/${id}`,
    }).catch(() => {});

    return NextResponse.json({ message: "Claim approved" });
  } catch (error) {
    console.error("Approve claim error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
