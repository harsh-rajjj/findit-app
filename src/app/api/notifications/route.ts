import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    const unreadCount = items.filter((n) => !n.isRead).length;

    return NextResponse.json({ notifications: items, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, markAll } = body;

    if (markAll) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, session.user.id),
            eq(notifications.isRead, false)
          )
        );
    } else if (id) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, id),
            eq(notifications.userId, session.user.id)
          )
        );
    }

    return NextResponse.json({ message: "Notifications updated" });
  } catch (error) {
    console.error("Update notifications error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
