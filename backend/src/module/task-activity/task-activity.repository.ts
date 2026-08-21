import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { taskActivity, type NewTaskActivity } from "../../db/schema/task-activity.js";
import { tasks } from "../../db/schema/task.js";
import { projectMembers } from "../../db/schema/project-member.js";

const actorColumns = { id: true, name: true, avatarUrl: true } as const;

export const taskActivityRepository = {
  findTaskById(taskId: string) {
    return db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  },

  findProjectMember(projectId: string, userId: string) {
    return db.query.projectMembers.findFirst({
      where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)),
    });
  },

  async record(entry: NewTaskActivity): Promise<void> {
    await db.insert(taskActivity).values(entry);
  },

  async list(taskId: string, limit: number, offset: number) {
    const whereClause = eq(taskActivity.taskId, taskId);

    const [rows, totalRows] = await Promise.all([
      db.query.taskActivity.findMany({
        where: whereClause,
        with: { actor: { columns: actorColumns } },
        orderBy: desc(taskActivity.createdAt),
        limit,
        offset,
      }),
      db.select({ total: count() }).from(taskActivity).where(whereClause),
    ]);

    return { rows, total: Number(totalRows[0]?.total ?? 0) };
  },
};
