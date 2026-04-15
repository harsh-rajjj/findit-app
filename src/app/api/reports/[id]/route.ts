import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;

    const [report] = await db
      .select({ id: reports.id, userId: reports.userId })
      .from(reports)
      .where(eq(reports.id, id))
      .limit(1);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await db.delete(reports).where(eq(reports.id, id));

    return NextResponse.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Delete report error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

