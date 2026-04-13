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

    if (!report || report.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await db.update(claims).set({ status: "REJECTED" }).where(eq(claims.id, id));

    // Notify the claimer
    createNotification({
      userId: claim.claimerId,
      type: "CLAIM_REJECTED",
      title: "❌ Claim Rejected",
      message: `Your claim on "${report.title}" was rejected.`,
      linkUrl: `/report/${claim.reportId}`,
    }).catch(() => {});

    return NextResponse.json({ message: "Claim rejected" });
  } catch (error) {
    console.error("Reject claim error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
