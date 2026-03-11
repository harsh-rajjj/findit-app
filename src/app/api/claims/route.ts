import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { claims, reports } from "@/db/schema";
import { createClaimSchema } from "@/lib/validators/report";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = createClaimSchema.parse(body);

    // Get the report
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, validated.reportId))
      .limit(1);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.type !== "FOUND") {
      return NextResponse.json(
        { error: "Can only claim found items" },
        { status: 400 }
      );
    }

    if (report.userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot claim your own item" },
        { status: 400 }
      );
    }

    // Check for existing claim
    const [existing] = await db
      .select()
      .from(claims)
      .where(
        and(
          eq(claims.reportId, validated.reportId),
          eq(claims.claimerId, session.user.id)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "You have already submitted a claim for this item" },
        { status: 400 }
      );
    }

    const [claim] = await db
      .insert(claims)
      .values({
        reportId: validated.reportId,
        claimerId: session.user.id,
        proofText: validated.proofText,
        verificationAnswer: validated.verificationAnswer ?? null,
      })
      .returning({ id: claims.id });

    return NextResponse.json(
      { message: "Claim submitted successfully", id: claim.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create claim error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
