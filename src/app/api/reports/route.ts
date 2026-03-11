import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { reports } from "@/db/schema";
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
      })
      .returning({ id: reports.id });

    // Run matching algorithm in background
    runMatchingAlgorithm(report.id).catch((err) => {
      console.error("Matching algorithm error:", err);
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
