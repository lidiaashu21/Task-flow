import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { randomUUID } from "node:crypto";
import { users } from "./user.js";
import { projects } from "./project.js";

export const conversationTypeEnum = pgEnum("conversation_type", [
  "dm",
  "channel",
]);

export const conversations = pgTable("conversations", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  type: conversationTypeEnum("type").notNull(),

  name: text("name"),

  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  dmKey: text("dm_key").unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),

  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
});

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
