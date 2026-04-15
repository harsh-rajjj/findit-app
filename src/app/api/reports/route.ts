import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { createReportSchema } from "@/lib/validators/report";
import { runMatchingAlgorithm, generateAndStoreEmbedding } from "@/lib/matching";
import { and, eq, gte } from "drizzle-orm";

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

    // Server-side duplicate guard for accidental rapid double-submits.
    const duplicateWindow = new Date(Date.now() - 45_000);
    const [existingRecent] = await db
      .select({ id: reports.id })
      .from(reports)
      .where(
        and(
          eq(reports.userId, session.user.id),
          eq(reports.type, validated.type),
          eq(reports.title, validated.title),
          eq(reports.description, validated.description),
          gte(reports.createdAt, duplicateWindow)
        )
      )
      .limit(1);

    if (existingRecent) {
      return NextResponse.json(
        { message: "Report already submitted", id: existingRecent.id },
        { status: 200 }
      );
    }

    const [report] = await db
      .insert(reports)
      .values({
        type: validated.type,
        title: validated.title,
        description: validated.description,
        categoryId: validated.categoryId,
        userId: session.user.id,
        locationDescription: validated.locationDescription ?? null,
        lostFoundDate: new Date(validated.lostFoundDate),
        verificationQuestion: validated.verificationQuestion ?? null,
        imageUrl: validated.imageUrl ?? null,
      })
      .returning({ id: reports.id });

    // Generate ML embedding and run matching in background
    generateAndStoreEmbedding(report.id)
      .then(() => runMatchingAlgorithm(report.id))
      .catch((err) => {
        console.error("Embedding/matching error:", err);
      });

    return NextResponse.json(
      { message: "Report created successfully", id: report.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create report error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
