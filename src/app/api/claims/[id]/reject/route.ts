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

    // Only report owner can reject
    if (claim.report.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the report owner can reject claims" },
        { status: 403 }
      );
    }

    // Update claim status
    await prisma.claim.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    return NextResponse.json({ message: "Claim rejected" });
  } catch (error) {
    console.error("Reject claim error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
