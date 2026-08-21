import { and, asc, count, desc, eq, ilike, lt, ne } from "drizzle-orm";
import { db } from "../../db/index.js";
import { tasks, type NewTask } from "../../db/schema/task.js";
import { projects } from "../../db/schema/project.js";
import { projectMembers } from "../../db/schema/project-member.js";
import type { ListTasksQuery } from "./task.schema.js";

const participantColumns = { id: true, name: true, avatarUrl: true } as const;
const withRelations = {
  assignee: { columns: participantColumns },
  creator: { columns: participantColumns },
} as const;

const sortColumnMap = {
  dueDate: tasks.dueDate,
  priority: tasks.priority,
  status: tasks.status,
  createdAt: tasks.createdAt,
  title: tasks.title,
} as const;

export const taskRepository = {
  findProjectById(projectId: string) {
    return db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  },

  findProjectMember(projectId: string, userId: string) {
    return db.query.projectMembers.findFirst({
      where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)),
    });
  },

  async createTask(input: NewTask) {
    const [task] = await db.insert(tasks).values(input).returning();
    return task!;
  },

  findTaskById(taskId: string) {
    return db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  },

  findTaskWithRelations(taskId: string) {
    return db.query.tasks.findFirst({ where: eq(tasks.id, taskId), with: withRelations });
  },

  async updateTask(taskId: string, patch: Partial<NewTask>) {
    await db
      .update(tasks)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(tasks.id, taskId));
    return db.query.tasks.findFirst({ where: eq(tasks.id, taskId), with: withRelations });
  },

  async deleteTask(taskId: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, taskId));
  },

  async listTasks(projectId: string, query: ListTasksQuery, limit: number, offset: number) {
    const conditions = [eq(tasks.projectId, projectId)];
    if (query.status) conditions.push(eq(tasks.status, query.status));
    if (query.priority) conditions.push(eq(tasks.priority, query.priority));
    if (query.assigneeId) conditions.push(eq(tasks.assigneeId, query.assigneeId));
    if (query.search) conditions.push(ilike(tasks.title, `%${query.search}%`));

    const whereClause = and(...conditions);
    const sortColumn = sortColumnMap[query.sortBy];
    const orderBy = query.sortDir === "asc" ? asc(sortColumn) : desc(sortColumn);

    const [rows, totalRows] = await Promise.all([
      db.query.tasks.findMany({ where: whereClause, with: withRelations, orderBy, limit, offset }),
      db.select({ total: count() }).from(tasks).where(whereClause),
    ]);

    return { rows, total: Number(totalRows[0]?.total ?? 0) };
  },

  countByStatus(projectId: string) {
    return db
      .select({ status: tasks.status, count: count() })
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .groupBy(tasks.status);
  },

  listOverdueForUser(projectId: string, userId: string) {
    return db.query.tasks.findMany({
      where: and(
        eq(tasks.projectId, projectId),
        eq(tasks.assigneeId, userId),
        ne(tasks.status, "done"),
        lt(tasks.dueDate, new Date())
      ),
      with: withRelations,
      orderBy: asc(tasks.dueDate),
    });
  },
};
