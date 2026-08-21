import { and, asc, desc, eq, inArray, lt, ne, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { conversations, type NewConversation } from "../../db/schema/conversation.js";
import { conversationParticipants } from "../../db/schema/conversation-participant.js";
import { messages, type NewMessage } from "../../db/schema/message.js";
import { messageReads } from "../../db/schema/message-read.js";
import { projectMembers } from "../../db/schema/project-member.js";
import { users } from "../../db/schema/user.js";

const participantColumns = { id: true, name: true, avatarUrl: true } as const;

export const conversationRepository = {
  findUserById(id: string) {
    return db.query.users.findFirst({ where: eq(users.id, id), columns: participantColumns });
  },

  findConversationById(id: string) {
    return db.query.conversations.findFirst({ where: eq(conversations.id, id) });
  },

  findConversationByDmKey(dmKey: string) {
    return db.query.conversations.findFirst({ where: eq(conversations.dmKey, dmKey) });
  },

  findMembership(conversationId: string, userId: string) {
    return db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      ),
    });
  },

  findProjectMembership(projectId: string, userId: string) {
    return db.query.projectMembers.findFirst({
      where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)),
    });
  },

  async findProjectMemberUserIds(projectId: string, userIds: string[]): Promise<string[]> {
    if (!userIds.length) return [];
    const rows = await db
      .select({ userId: projectMembers.userId })
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), inArray(projectMembers.userId, userIds)));
    return rows.map((row) => row.userId);
  },

  async findExistingUserIds(userIds: string[]): Promise<string[]> {
    if (!userIds.length) return [];
    const rows = await db.select({ id: users.id }).from(users).where(inArray(users.id, userIds));
    return rows.map((row) => row.id);
  },

  async createConversation(input: NewConversation) {
    const [conversation] = await db.insert(conversations).values(input).returning();
    return conversation!;
  },

  async addMembers(conversationId: string, userIds: string[]): Promise<void> {
    if (!userIds.length) return;
    await db
      .insert(conversationParticipants)
      .values(userIds.map((userId) => ({ conversationId, userId })))
      .onConflictDoNothing({ target: [conversationParticipants.conversationId, conversationParticipants.userId] });
  },

  async removeMember(conversationId: string, userId: string): Promise<void> {
    await db
      .delete(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId)
        )
      );
  },

  listMembers(conversationId: string) {
    return db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        joinedAt: conversationParticipants.joinedAt,
        muted: conversationParticipants.muted,
      })
      .from(conversationParticipants)
      .innerJoin(users, eq(conversationParticipants.userId, users.id))
      .where(eq(conversationParticipants.conversationId, conversationId))
      .orderBy(asc(conversationParticipants.joinedAt));
  },

  async setMuted(conversationId: string, userId: string, muted: boolean): Promise<void> {
    await db
      .update(conversationParticipants)
      .set({ muted })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId)
        )
      );
  },

  /** Stamps the exact timestamp of the message that triggered this, so `listLastMessages` can join on equality. */
  async touchConversation(conversationId: string, lastMessageAt: Date): Promise<void> {
    await db.update(conversations).set({ lastMessageAt }).where(eq(conversations.id, conversationId));
  },

  /** The conversations a user belongs to — basic columns only; activity/unreads are joined in separately. */
  listMyConversationRows(userId: string) {
    return db
      .select({
        id: conversations.id,
        type: conversations.type,
        name: conversations.name,
        projectId: conversations.projectId,
        createdAt: conversations.createdAt,
      })
      .from(conversationParticipants)
      .innerJoin(conversations, eq(conversationParticipants.conversationId, conversations.id))
      .where(eq(conversationParticipants.userId, userId))
      .orderBy(desc(sql`coalesce(${conversations.lastMessageAt}, ${conversations.createdAt})`));
  },

  async listOtherParticipants(conversationIds: string[], userId: string) {
    if (!conversationIds.length) return [];
    return db
      .select({
        conversationId: conversationParticipants.conversationId,
        userId: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(conversationParticipants)
      .innerJoin(users, eq(conversationParticipants.userId, users.id))
      .where(
        and(
          inArray(conversationParticipants.conversationId, conversationIds),
          ne(conversationParticipants.userId, userId)
        )
      );
  },

  /** Joins each conversation to its last message via the denormalized `lastMessageAt` — no MAX() subquery needed. */
  async listLastMessages(conversationIds: string[]) {
    if (!conversationIds.length) return [];

    const rows = await db
      .select({
        conversationId: messages.conversationId,
        id: messages.id,
        body: messages.body,
        senderId: messages.senderId,
        createdAt: messages.createdAt,
        deletedAt: messages.deletedAt,
      })
      .from(conversations)
      .innerJoin(
        messages,
        and(eq(messages.conversationId, conversations.id), eq(messages.createdAt, conversations.lastMessageAt))
      )
      .where(inArray(conversations.id, conversationIds));

    // Guard against two messages sharing the same microsecond timestamp in one conversation.
    const seen = new Set<string>();
    return rows.filter((row) => {
      if (seen.has(row.conversationId)) return false;
      seen.add(row.conversationId);
      return true;
    });
  },

  /** One query, single GROUP BY + FILTER, for unread counts across every given conversation. */
  async listUnreadCounts(conversationIds: string[], userId: string) {
    if (!conversationIds.length) return [];

    return db
      .select({
        conversationId: messages.conversationId,
        unreadCount: sql<number>`count(*) filter (
          where ${messages.senderId} != ${userId}
          and (${conversationParticipants.lastReadAt} is null or ${messages.createdAt} > ${conversationParticipants.lastReadAt})
        )::int`,
      })
      .from(messages)
      .innerJoin(
        conversationParticipants,
        and(
          eq(conversationParticipants.conversationId, messages.conversationId),
          eq(conversationParticipants.userId, userId)
        )
      )
      .where(inArray(messages.conversationId, conversationIds))
      .groupBy(messages.conversationId);
  },

  async createMessage(input: NewMessage) {
    const [message] = await db.insert(messages).values(input).returning();
    return message!;
  },

  findMessageById(id: string) {
    return db.query.messages.findFirst({ where: eq(messages.id, id) });
  },

  findMessageWithSender(id: string) {
    return db.query.messages.findFirst({
      where: eq(messages.id, id),
      with: { sender: { columns: participantColumns } },
    });
  },

  findLatestMessage(conversationId: string) {
    return db.query.messages.findFirst({
      where: eq(messages.conversationId, conversationId),
      orderBy: desc(messages.createdAt),
    });
  },

  /** Cursor pagination: returns up to `limit` messages older than `beforeMessageId`, oldest-first. */
  async listMessagesPage(conversationId: string, beforeMessageId: string | undefined, limit: number) {
    let cursorCreatedAt: Date | undefined;
    if (beforeMessageId) {
      const cursor = await db.query.messages.findFirst({ where: eq(messages.id, beforeMessageId) });
      cursorCreatedAt = cursor?.createdAt;
    }

    const whereClause = cursorCreatedAt
      ? and(eq(messages.conversationId, conversationId), lt(messages.createdAt, cursorCreatedAt))
      : eq(messages.conversationId, conversationId);

    const rows = await db.query.messages.findMany({
      where: whereClause,
      with: { sender: { columns: participantColumns } },
      orderBy: desc(messages.createdAt),
      limit: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return { messages: page.reverse(), hasMore };
  },

  async updateMessage(id: string, body: string) {
    await db.update(messages).set({ body, editedAt: new Date() }).where(eq(messages.id, id));
    return db.query.messages.findFirst({
      where: eq(messages.id, id),
      with: { sender: { columns: participantColumns } },
    });
  },

  async softDeleteMessage(id: string): Promise<void> {
    await db.update(messages).set({ deletedAt: new Date() }).where(eq(messages.id, id));
  },

  /** Cheap per-conversation unread-badge cursor. The participant row must already exist. */
  async updateReadCursor(conversationId: string, userId: string, lastReadAt: Date): Promise<void> {
    await db
      .update(conversationParticipants)
      .set({ lastReadAt })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId)
        )
      );
  },

  /** Per-message "seen by" receipt — idempotent, safe to call repeatedly for the same message. */
  async recordMessageRead(messageId: string, userId: string): Promise<void> {
    await db
      .insert(messageReads)
      .values({ messageId, userId })
      .onConflictDoNothing({ target: [messageReads.messageId, messageReads.userId] });
  },

  listMessageReads(messageId: string) {
    return db
      .select({
        userId: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        readAt: messageReads.readAt,
      })
      .from(messageReads)
      .innerJoin(users, eq(messageReads.userId, users.id))
      .where(eq(messageReads.messageId, messageId))
      .orderBy(asc(messageReads.readAt));
  },
};
