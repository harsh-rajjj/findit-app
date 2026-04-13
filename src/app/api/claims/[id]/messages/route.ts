import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { claims, reports, messages, users } from "@/db/schema";
import { eq, asc, or, and } from "drizzle-orm";
import { createMessageSchema } from "@/lib/validators/report";
import { createNotification } from "@/lib/notifications";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get claim to verify access
    const [claim] = await db
      .select({
        claimerId: claims.claimerId,
        reportId: claims.reportId,
      })
      .from(claims)
      .where(eq(claims.id, id))
      .limit(1);

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Get report to check ownership
    const [report] = await db
      .select({ userId: reports.userId })
      .from(reports)
      .where(eq(reports.id, claim.reportId))
      .limit(1);

    // Only claimer or report owner can see messages
    if (claim.claimerId !== session.user.id && report?.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const claimMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        senderName: users.username,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.claimId, id))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json(claimMessages);
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = createMessageSchema.parse(body);

    // Get claim to verify access
    const [claim] = await db
      .select({
        claimerId: claims.claimerId,
        reportId: claims.reportId,
      })
      .from(claims)
      .where(eq(claims.id, id))
      .limit(1);

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Get report to check ownership
    const [report] = await db
      .select({ userId: reports.userId })
      .from(reports)
      .where(eq(reports.id, claim.reportId))
      .limit(1);

    // Only claimer or report owner can send messages
    if (claim.claimerId !== session.user.id && report?.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const [message] = await db
      .insert(messages)
      .values({
        claimId: id,
        senderId: session.user.id,
        content: validated.content,
      })
      .returning({ id: messages.id });

    // Notify the other participant
    const recipientId = session.user.id === claim.claimerId ? report?.userId : claim.claimerId;
    if (recipientId) {
      const [sender] = await db.select({ username: users.username }).from(users).where(eq(users.id, session.user.id)).limit(1);
      createNotification({
        userId: recipientId,
        type: "MESSAGE",
        title: "💬 New Message",
        message: `@${sender?.username || "Someone"}: ${validated.content.slice(0, 60)}${validated.content.length > 60 ? "..." : ""}`,
        linkUrl: `/claim/${id}`,
      }).catch(() => {});
    }

    return NextResponse.json(
      { message: "Message sent", id: message.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
