import { and, asc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { tags, type NewTag } from "../../db/schema/tag.js";
import { taskTags } from "../../db/schema/task-tag.js";
import { tasks } from "../../db/schema/task.js";
import { projectMembers } from "../../db/schema/project-member.js";

export const tagRepository = {
  findProjectMember(projectId: string, userId: string) {
    return db.query.projectMembers.findFirst({
      where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)),
    });
  },

  findTaskById(taskId: string) {
    return db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  },

  async createTag(input: NewTag) {
    const [tag] = await db.insert(tags).values(input).returning();
    return tag!;
  },

  findTagById(id: string) {
    return db.query.tags.findFirst({ where: eq(tags.id, id) });
  },

  findByProjectAndName(projectId: string, name: string) {
    return db.query.tags.findFirst({ where: and(eq(tags.projectId, projectId), eq(tags.name, name)) });
  },

  listByProject(projectId: string) {
    return db.query.tags.findMany({ where: eq(tags.projectId, projectId), orderBy: asc(tags.name) });
  },

  async updateTag(id: string, patch: Partial<NewTag>) {
    const [tag] = await db.update(tags).set(patch).where(eq(tags.id, id)).returning();
    return tag!;
  },

  async deleteTag(id: string): Promise<void> {
    await db.delete(tags).where(eq(tags.id, id));
  },

  async attachToTask(taskId: string, tagId: string): Promise<void> {
    await db
      .insert(taskTags)
      .values({ taskId, tagId })
      .onConflictDoNothing({ target: [taskTags.taskId, taskTags.tagId] });
  },

  async detachFromTask(taskId: string, tagId: string): Promise<void> {
    await db.delete(taskTags).where(and(eq(taskTags.taskId, taskId), eq(taskTags.tagId, tagId)));
  },

  listByTask(taskId: string) {
    return db
      .select({
        id: tags.id,
        projectId: tags.projectId,
        name: tags.name,
        color: tags.color,
        createdAt: tags.createdAt,
      })
      .from(taskTags)
      .innerJoin(tags, eq(taskTags.tagId, tags.id))
      .where(eq(taskTags.taskId, taskId))
      .orderBy(asc(tags.name));
  },
};
