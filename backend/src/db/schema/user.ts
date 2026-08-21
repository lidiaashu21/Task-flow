import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { randomUUID } from "node:crypto";
import { citext } from "../custom-types.js";

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  email: citext("email").notNull().unique(),
  passwordHash: text("password_hash"),
  avatarUrl: text("avatar_url"),
  /** Not in the ERD (auth plumbing) — kept so email verification keeps working. */
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  /** Not in the ERD — kept for profile-update bookkeeping. */
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
