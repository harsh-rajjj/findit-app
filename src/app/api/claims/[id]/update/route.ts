import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { claims, reports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateClaimSchema } from "@/lib/validators/report";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateClaimSchema.parse(body);

    // Get claim
    const [claim] = await db
      .select({
        claimerId: claims.claimerId,
        reportId: claims.reportId,
      })
      .from(claims)
      .where(eq(claims.id, id))
      .limit(1);

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Get report to check ownership
    const [report] = await db
      .select({ userId: reports.userId })
      .from(reports)
      .where(eq(reports.id, claim.reportId))
      .limit(1);

    // Both claimer and report owner can update pickup details
    if (claim.claimerId !== session.user.id && report?.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validated.pickupTime !== undefined) {
      updateData.pickupTime = validated.pickupTime ? new Date(validated.pickupTime) : null;
    }
    if (validated.pickupLocation !== undefined) {
      updateData.pickupLocation = validated.pickupLocation || null;
    }

    await db
      .update(claims)
      .set(updateData)
      .where(eq(claims.id, id));

    return NextResponse.json({ message: "Claim updated" });
  } catch (error) {
    console.error("Update claim error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
