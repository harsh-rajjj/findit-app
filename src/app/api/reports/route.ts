import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReportSchema } from "@/lib/validators/report";
import { runMatchingAlgorithm } from "@/lib/matching";

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
    const validated = createReportSchema.parse(body);

    // Create the report
    const report = await prisma.report.create({
      data: {
        type: validated.type,
        title: validated.title,
        description: validated.description,
        categoryId: validated.categoryId,
        userId: session.user.id,
        latitude: validated.latitude ?? null,
        longitude: validated.longitude ?? null,
        locationDescription: validated.locationDescription ?? null,
        lostFoundDate: validated.lostFoundDate,
        images: validated.images,
        verificationQuestion: validated.verificationQuestion ?? null,
      },
    });

    // Run matching algorithm in background (non-blocking)
    runMatchingAlgorithm(report.id).catch((err) => {
      console.error("Matching algorithm error:", err);
    });

    return NextResponse.json(
      { message: "Report created successfully", id: report.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create report error:", error);

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const where: Record<string, unknown> = {
      status: "ACTIVE",
      deletedAt: null,
    };

    if (type === "LOST" || type === "FOUND") {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          category: true,
          user: { select: { username: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get reports error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
