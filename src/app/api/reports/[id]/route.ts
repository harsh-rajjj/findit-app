import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReportSchema } from "@/lib/validators/report";

// GET /api/reports/[id] - Get a single report
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        category: true,
        user: { select: { id: true, username: true } },
      },
    });

    if (!report || report.deletedAt) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Get report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/reports/[id] - Update a report
export async function PATCH(
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

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    if (report.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the report owner can edit it" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createReportSchema.partial().parse(body);

    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.description && { description: validated.description }),
        ...(validated.categoryId && { categoryId: validated.categoryId }),
        ...(validated.locationDescription !== undefined && {
          locationDescription: validated.locationDescription ?? null,
        }),
        ...(validated.latitude !== undefined && {
          latitude: validated.latitude ?? null,
        }),
        ...(validated.longitude !== undefined && {
          longitude: validated.longitude ?? null,
        }),
        ...(validated.lostFoundDate && { lostFoundDate: validated.lostFoundDate }),
        ...(validated.images && { images: validated.images }),
        ...(validated.verificationQuestion !== undefined && {
          verificationQuestion: validated.verificationQuestion ?? null,
        }),
      },
    });

    return NextResponse.json({
      message: "Report updated successfully",
      id: updatedReport.id,
    });
  } catch (error) {
    console.error("Update report error:", error);

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

// DELETE /api/reports/[id] - Soft delete a report
export async function DELETE(
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

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    if (report.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the report owner can delete it" },
        { status: 403 }
      );
    }

    await prisma.report.update({
      where: { id },
      data: { deletedAt: new Date(), status: "DELETED" },
    });

    return NextResponse.json({ message: "Report deleted" });
  } catch (error) {
    console.error("Delete report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
