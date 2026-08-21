import { and, asc, count, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { comments, type NewComment } from "../../db/schema/comment.js";
import { projectComments, type NewProjectComment } from "../../db/schema/project-comment.js";
import { projects } from "../../db/schema/project.js";
import { projectMembers } from "../../db/schema/project-member.js";
import { tasks } from "../../db/schema/task.js";

const authorColumns = { id: true, name: true, avatarUrl: true } as const;

export const commentRepository = {
  findTaskById(taskId: string) {
    return db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  },

  findProjectById(projectId: string) {
    return db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  },

  findProjectMember(projectId: string, userId: string) {
    return db.query.projectMembers.findFirst({
      where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)),
    });
  },

  // ---- Task comments ----

  async createComment(input: NewComment) {
    const [comment] = await db.insert(comments).values(input).returning();
    return comment!;
  },

  findCommentById(commentId: string) {
    return db.query.comments.findFirst({ where: eq(comments.id, commentId) });
  },

  findCommentWithAuthor(commentId: string) {
    return db.query.comments.findFirst({
      where: eq(comments.id, commentId),
      with: { author: { columns: authorColumns } },
    });
  },

  async updateComment(commentId: string, body: string) {
    await db.update(comments).set({ body, updatedAt: new Date() }).where(eq(comments.id, commentId));
    return db.query.comments.findFirst({
      where: eq(comments.id, commentId),
      with: { author: { columns: authorColumns } },
    });
  },

  async deleteComment(commentId: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, commentId));
  },

  async listCommentsByTask(taskId: string, limit: number, offset: number) {
    const whereClause = eq(comments.taskId, taskId);

    const [rows, totalRows] = await Promise.all([
      db.query.comments.findMany({
        where: whereClause,
        with: { author: { columns: authorColumns } },
        orderBy: asc(comments.createdAt),
        limit,
        offset,
      }),
      db.select({ total: count() }).from(comments).where(whereClause),
    ]);

    return { rows, total: Number(totalRows[0]?.total ?? 0) };
  },

  // ---- Project comments (a separate discussion thread per project) ----

  async createProjectComment(input: NewProjectComment) {
    const [comment] = await db.insert(projectComments).values(input).returning();
    return comment!;
  },

  findProjectCommentById(commentId: string) {
    return db.query.projectComments.findFirst({ where: eq(projectComments.id, commentId) });
  },

  findProjectCommentWithAuthor(commentId: string) {
    return db.query.projectComments.findFirst({
      where: eq(projectComments.id, commentId),
      with: { author: { columns: authorColumns } },
    });
  },

  async updateProjectComment(commentId: string, body: string) {
    await db
      .update(projectComments)
      .set({ body, updatedAt: new Date() })
      .where(eq(projectComments.id, commentId));
    return db.query.projectComments.findFirst({
      where: eq(projectComments.id, commentId),
      with: { author: { columns: authorColumns } },
    });
  },

  async deleteProjectComment(commentId: string): Promise<void> {
    await db.delete(projectComments).where(eq(projectComments.id, commentId));
  },

  async listProjectComments(projectId: string, limit: number, offset: number) {
    const whereClause = eq(projectComments.projectId, projectId);

    const [rows, totalRows] = await Promise.all([
      db.query.projectComments.findMany({
        where: whereClause,
        with: { author: { columns: authorColumns } },
        orderBy: asc(projectComments.createdAt),
        limit,
        offset,
      }),
      db.select({ total: count() }).from(projectComments).where(whereClause),
    ]);

    return { rows, total: Number(totalRows[0]?.total ?? 0) };
  },
};
