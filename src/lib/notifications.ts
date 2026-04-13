import { db } from "@/db";
import { notifications } from "@/db/schema";

/**
 * Create an in-app notification for a user.
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  linkUrl,
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
}) {
  try {
    await db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      linkUrl: linkUrl ?? null,
    });
  } catch (error) {
    // Non-critical — log but don't throw
    console.error("Failed to create notification:", error);
  }
}
