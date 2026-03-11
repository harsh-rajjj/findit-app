import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the claim with report
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        report: true,
      },
    });

    if (!claim) {
      return NextResponse.json(
        { error: "Claim not found" },
        { status: 404 }
      );
    }

    // Only report owner can approve
    if (claim.report.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the report owner can approve claims" },
        { status: 403 }
      );
    }

    // Update claim status
    await prisma.claim.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    // Mark report as resolved
    await prisma.report.update({
      where: { id: claim.reportId },
      data: { status: "RESOLVED" },
    });

    // Reject other pending claims
    await prisma.claim.updateMany({
      where: {
        reportId: claim.reportId,
        id: { not: id },
        status: "PENDING",
      },
      data: { status: "REJECTED" },
    });

    // Create a conversation for coordination
    await prisma.conversation.create({
      data: {
        claimId: id,
        participants: {
          create: [
            { userId: claim.report.userId },
            { userId: claim.claimerId },
          ],
        },
      },
    });

    return NextResponse.json({ message: "Claim approved" });
  } catch (error) {
    console.error("Approve claim error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
