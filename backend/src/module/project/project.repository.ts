import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import { projects, type NewProject } from "../../db/schema/project.js";
import { projectMembers } from "../../db/schema/project-member.js";
import { tasks } from "../../db/schema/task.js";
import { users } from "../../db/schema/user.js";
import type { ProjectRole } from "./project.types.js";

export const projectRepository = {
  async createProject(name: string, description: string | null, ownerId: string) {
    const [project] = await db.insert(projects).values({ name, description, ownerId }).returning();
    return project!;
  },

  async addMember(projectId: string, userId: string, role: ProjectRole): Promise<void> {
    await db
      .insert(projectMembers)
      .values({ projectId, userId, role })
      .onConflictDoNothing({ target: [projectMembers.projectId, projectMembers.userId] });
  },

  findProjectById(id: string) {
    return db.query.projects.findFirst({ where: eq(projects.id, id) });
  },

  findMembership(projectId: string, userId: string) {
    return db.query.projectMembers.findFirst({
      where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)),
    });
  },

  listMembers(projectId: string) {
    return db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        role: projectMembers.role,
        joinedAt: projectMembers.joinedAt,
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId))
      .orderBy(asc(projectMembers.joinedAt));
  },

  /** The projects a user belongs to, plus (in bulk, no N+1) their member and task counts. */
  async listMyProjects(userId: string) {
    const rows = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        createdAt: projects.createdAt,
        myRole: projectMembers.role,
      })
      .from(projectMembers)
      .innerJoin(projects, eq(projectMembers.projectId, projects.id))
      .where(eq(projectMembers.userId, userId))
      .orderBy(desc(projects.createdAt));

    if (!rows.length) {
      return { rows, memberCounts: [], taskCounts: [] };
    }

    const projectIds = rows.map((row) => row.id);
    const [memberCounts, taskCounts] = await Promise.all([
      db
        .select({ projectId: projectMembers.projectId, count: count() })
        .from(projectMembers)
        .where(inArray(projectMembers.projectId, projectIds))
        .groupBy(projectMembers.projectId),
      db
        .select({ projectId: tasks.projectId, count: count() })
        .from(tasks)
        .where(inArray(tasks.projectId, projectIds))
        .groupBy(tasks.projectId),
    ]);

    return { rows, memberCounts, taskCounts };
  },

  async updateProject(id: string, patch: Partial<NewProject>) {
    const [project] = await db
      .update(projects)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project!;
  },

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  },

  async countOwners(projectId: string): Promise<number> {
    const [row] = await db
      .select({ total: count() })
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.role, "owner")));
    return Number(row?.total ?? 0);
  },

  async updateMemberRole(projectId: string, userId: string, role: ProjectRole): Promise<void> {
    await db
      .update(projectMembers)
      .set({ role })
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
  },

  async removeMember(projectId: string, userId: string): Promise<void> {
    await db
      .delete(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
  },
};
