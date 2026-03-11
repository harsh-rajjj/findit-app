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

    // Get the match
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        lostReport: true,
        foundReport: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Only involved users can dismiss
    const isInvolved =
      match.lostReport.userId === session.user.id ||
      match.foundReport.userId === session.user.id;

    if (!isInvolved) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Dismiss the match
    await prisma.match.update({
      where: { id },
      data: { dismissed: true },
    });

    return NextResponse.json({ message: "Match dismissed" });
  } catch (error) {
    console.error("Dismiss match error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
