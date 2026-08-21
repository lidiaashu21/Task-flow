import {
  pgTable,
  uuid,
  timestamp,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { users } from "./user.js";
import { conversations } from "./conversation.js";

export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    lastReadAt: timestamp("last_read_at", { withTimezone: true }),
    muted: boolean("muted").notNull().default(false),
  },
  (table) => [primaryKey({ columns: [table.conversationId, table.userId] })],
);

export type ConversationParticipant =
  typeof conversationParticipants.$inferSelect;
export type NewConversationParticipant =
  typeof conversationParticipants.$inferInsert;
