import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { claims, reports, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

/**
 * POST /api/claims/[id]/reclaim
 * Allows the claimer to reopen a REJECTED / WITHDRAWN / REVOKED claim back to PENDING.
 * This supports "appeal" after rejection, "reclaim" after withdrawal, and re-appeal after revocation.
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

    if (claim.claimerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (claim.status !== "REJECTED" && claim.status !== "WITHDRAWN" && claim.status !== "REVOKED") {
      return NextResponse.json(
        { error: "Only rejected, withdrawn, or revoked claims can be reopened" },
        { status: 400 }
      );
    }

    const [report] = await db
      .select({ id: reports.id, title: reports.title, status: reports.status, userId: reports.userId })
      .from(reports)
      .where(eq(reports.id, claim.reportId))
      .limit(1);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Don't allow reopening if the report is already resolved.
    if (report.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This item is no longer active" },
        { status: 400 }
      );
    }

    await db.update(claims).set({ status: "PENDING" }).where(eq(claims.id, id));

    const [claimer] = await db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    // Notify the report owner that a claim was reopened.
    createNotification({
      userId: report.userId,
      type: "CLAIM",
      title: "🔁 Claim Reopened",
      message: `@${claimer?.username || "Someone"} reopened a claim on "${report.title}"`,
      linkUrl: `/claim/${claim.id}`,
    }).catch(() => {});

    return NextResponse.json({ message: "Claim reopened" });
  } catch (error) {
    console.error("Reclaim claim error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

