import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema/user.js";
import { logger } from "../../lib/logger.js";
import { realtime } from "../../realtime/socket.js";

export interface NotificationInput {
  type: "task_assigned" | "task_updated" | "comment_added";
  title: string;
  body: string;
  /** In-app path the notification opens, e.g. "/tasks/<id>". */
  link: string;
}

async function actorName(userId: string): Promise<string> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { name: true } });
  return user?.name ?? "Someone";
}

/**
 * Notifications are a live push on top of the REST API (see `realtime`), so a failure here must
 * never fail the write that triggered it — errors are logged and swallowed.
 */
export const notificationService = {
  actorName,

  /** Sends to each distinct recipient, skipping the actor (nobody needs to be told about their own action). */
  async notify(recipientIds: Array<string | null | undefined>, actorId: string, input: NotificationInput): Promise<void> {
    try {
      const targets = new Set(recipientIds.filter((id): id is string => !!id && id !== actorId));
      for (const userId of targets) realtime.notification(userId, input);
    } catch (error) {
      logger.error("Failed to send notification", { error: error instanceof Error ? error.message : error });
    }
  },
};
