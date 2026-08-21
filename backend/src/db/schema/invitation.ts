import { pgTable, uuid, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { randomUUID } from "node:crypto";
import { users } from "./user.js";
import { projects } from "./project.js";
import { citext } from "../custom-types.js";

export const invitationStatusEnum = pgEnum("invite_status", ["pending", "accepted", "expired", "revoked"]);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    email: citext("email").notNull(),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /**
     * Column is named `token` to match the ERD, but stores a SHA-256 hash —
     * the raw value is only ever emailed, never persisted.
     */
    token: text("token").notNull().unique(),
    status: invitationStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("invitations_project_email_idx").on(table.projectId, table.email)]
);

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
