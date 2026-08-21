import { and, asc, count, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { invitations, type NewInvitation } from "../../db/schema/invitation.js";
import { projects } from "../../db/schema/project.js";
import { projectMembers } from "../../db/schema/project-member.js";
import { users } from "../../db/schema/user.js";
import type { InvitationStatus } from "./invitation.types.js";

const inviterColumns = { id: true, name: true } as const;

export const invitationRepository = {
  findProjectById(projectId: string) {
    return db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  },

  findMembership(projectId: string, userId: string) {
    return db.query.projectMembers.findFirst({
      where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)),
    });
  },

  async findMemberByEmail(projectId: string, email: string) {
    const [row] = await db
      .select({ userId: projectMembers.userId })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(and(eq(projectMembers.projectId, projectId), eq(users.email, email)))
      .limit(1);
    return row;
  },

  /** Invitations always join as "member" — role-per-invite isn't part of this ERD. */
  async addMember(projectId: string, userId: string): Promise<void> {
    console.log("========================================");
    console.log("DATABASE: ADDING MEMBER");
    console.log("========================================");
    console.log("Project ID:", projectId);
    console.log("User ID:", userId);
    console.log("Role: member");
    console.log("========================================");

    const result = await db
      .insert(projectMembers)
      .values({ projectId, userId, role: "member" })
      .onConflictDoNothing({ target: [projectMembers.projectId, projectMembers.userId] });
    
    console.log("Database insert result:", result);
    console.log("========================================");
  },

  async createInvitation(input: NewInvitation) {
    const [invitation] = await db.insert(invitations).values(input).returning();
    return invitation!;
  },

  findPendingInvitation(projectId: string, email: string) {
    return db.query.invitations.findFirst({
      where: and(
        eq(invitations.projectId, projectId),
        eq(invitations.email, email),
        eq(invitations.status, "pending")
      ),
    });
  },

  findInvitationById(id: string) {
    return db.query.invitations.findFirst({ where: eq(invitations.id, id) });
  },

  findInvitationWithInviter(id: string) {
    return db.query.invitations.findFirst({
      where: eq(invitations.id, id),
      with: { invitedByUser: { columns: inviterColumns } },
    });
  },

  findInvitationByTokenHash(tokenHash: string) {
    return db.query.invitations.findFirst({
      where: eq(invitations.token, tokenHash),
      with: {
        invitedByUser: { columns: inviterColumns },
        project: { columns: { id: true, name: true } },
      },
    });
  },

  async listByProject(projectId: string, status: InvitationStatus | undefined, limit: number, offset: number) {
    const whereClause = status
      ? and(eq(invitations.projectId, projectId), eq(invitations.status, status))
      : eq(invitations.projectId, projectId);

    const [rows, totalRows] = await Promise.all([
      db.query.invitations.findMany({
        where: whereClause,
        with: { invitedByUser: { columns: inviterColumns } },
        orderBy: asc(invitations.createdAt),
        limit,
        offset,
      }),
      db.select({ total: count() }).from(invitations).where(whereClause),
    ]);

    return { rows, total: Number(totalRows[0]?.total ?? 0) };
  },

  async markAccepted(id: string): Promise<void> {
    await db.update(invitations).set({ status: "accepted", acceptedAt: new Date() }).where(eq(invitations.id, id));
  },

  async markExpired(id: string): Promise<void> {
    await db.update(invitations).set({ status: "expired" }).where(eq(invitations.id, id));
  },

  async revoke(id: string): Promise<void> {
    await db.update(invitations).set({ status: "revoked" }).where(eq(invitations.id, id));
  },

  async refresh(id: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await db
      .update(invitations)
      .set({ token: tokenHash, expiresAt, status: "pending" })
      .where(eq(invitations.id, id));
  },
};
