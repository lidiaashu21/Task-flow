import { pgTable, uuid, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { randomUUID } from "node:crypto";
import { users } from "./user.js";
import { tasks } from "./task.js";

export const taskActivityActionEnum = pgEnum("activity_action", [
  "created",
  "status_changed",
  "priority_changed",
  "due_date_changed",
  "assigned",
  "commented",
  "tag_added",
  "deleted",
]);

export const taskActivity = pgTable(
  "task_activity",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    /** Nullable so the log survives the acting user's account being deleted. */
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: taskActivityActionEnum("action").notNull(),
    /** Which field changed, e.g. "status" — mainly useful alongside a generic action. */
    field: text("field"),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("task_activity_task_created_idx").on(table.taskId, table.createdAt)]
);

export type TaskActivity = typeof taskActivity.$inferSelect;
export type NewTaskActivity = typeof taskActivity.$inferInsert;
