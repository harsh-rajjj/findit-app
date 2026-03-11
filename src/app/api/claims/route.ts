import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClaimSchema } from "@/lib/validators/report";

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
    const report = await prisma.report.findUnique({
      where: { id: validated.reportId },
      include: { user: true },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Can only claim FOUND items
    if (report.type !== "FOUND") {
      return NextResponse.json(
        { error: "Can only claim found items" },
        { status: 400 }
      );
    }

    // Can't claim your own item
    if (report.userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot claim your own item" },
        { status: 400 }
      );
    }

    // Check for existing claim
    const existingClaim = await prisma.claim.findUnique({
      where: {
        reportId_claimerId: {
          reportId: validated.reportId,
          claimerId: session.user.id,
        },
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        { error: "You have already submitted a claim for this item" },
        { status: 400 }
      );
    }

    // Create the claim
    const claim = await prisma.claim.create({
      data: {
        reportId: validated.reportId,
        claimerId: session.user.id,
        proofText: validated.proofText,
        verificationAnswer: validated.verificationAnswer ?? null,
      },
    });

    return NextResponse.json(
      { message: "Claim submitted successfully", id: claim.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create claim error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
