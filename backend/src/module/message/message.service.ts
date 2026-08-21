import { messageRepository } from "./message.repository.js";
import { AppError } from "../../shared/error/app-error.js";
import {
  toPublicMessage,
  type ConversationDetail,
  type ConversationParticipant,
  type ConversationSummary,
  type ConversationType,
  type MessageReadReceipt,
  type PublicMessage,
} from "./message.types.js";
import type { CreateChannelInput, ListMessagesQuery } from "./message.schema.js";

interface ConversationRow {
  id: string;
  type: ConversationType;
  name: string | null;
  projectId: string | null;
  createdAt: Date;
}

interface OtherParticipantRow {
  conversationId: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
}

interface LastMessageRow {
  conversationId: string;
  id: string;
  body: string;
  senderId: string;
  createdAt: Date;
  deletedAt: Date | null;
}

interface UnreadCountRow {
  conversationId: string;
  unreadCount: number;
}

/** Deterministic key for a DM pair — order-independent, so find-or-create is a single unique lookup. */
function buildDmKey(userAId: string, userBId: string): string {
  return [userAId, userBId].sort().join(":");
}

function buildSummaries(
  rows: ConversationRow[],
  otherParticipants: OtherParticipantRow[],
  lastMessages: LastMessageRow[],
  unreadCounts: UnreadCountRow[]
): ConversationSummary[] {
  const participantByConversation = new Map<string, ConversationParticipant>();
  for (const participant of otherParticipants) {
    if (!participantByConversation.has(participant.conversationId)) {
      participantByConversation.set(participant.conversationId, {
        id: participant.userId,
        name: participant.name,
        avatarUrl: participant.avatarUrl,
      });
    }
  }

  const lastMessageByConversation = new Map(lastMessages.map((message) => [message.conversationId, message]));
  const unreadByConversation = new Map(unreadCounts.map((row) => [row.conversationId, row.unreadCount]));

  return rows.map((row) => {
    const lastMessage = lastMessageByConversation.get(row.id);

    return {
      id: row.id,
      type: row.type,
      name: row.name,
      projectId: row.projectId,
      otherParticipant: row.type === "dm" ? (participantByConversation.get(row.id) ?? null) : null,
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            body: lastMessage.deletedAt ? "[deleted]" : lastMessage.body,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt,
            isDeleted: lastMessage.deletedAt !== null,
          }
        : null,
      unreadCount: unreadByConversation.get(row.id) ?? 0,
      createdAt: row.createdAt,
    };
  });
}

/** Confirms the conversation exists and the user is one of its members. */
async function assertConversationAccess(conversationId: string, userId: string) {
  const conversation = await messageRepository.findConversationById(conversationId);
  if (!conversation) {
    throw AppError.notFound("Conversation not found");
  }

  const membership = await messageRepository.findMembership(conversationId, userId);
  if (!membership) {
    throw AppError.forbidden("You are not a participant in this conversation");
  }

  return conversation;
}

export const messageService = {
  async listConversations(userId: string): Promise<ConversationSummary[]> {
    const rows = await messageRepository.listMyConversationRows(userId);
    if (!rows.length) return [];

    const conversationIds = rows.map((row) => row.id);
    const [otherParticipants, lastMessages, unreadCounts] = await Promise.all([
      messageRepository.listOtherParticipants(conversationIds, userId),
      messageRepository.listLastMessages(conversationIds),
      messageRepository.listUnreadCounts(conversationIds, userId),
    ]);

    return buildSummaries(rows, otherParticipants, lastMessages, unreadCounts);
  },

  async getConversation(conversationId: string, userId: string): Promise<ConversationDetail> {
    const conversation = await assertConversationAccess(conversationId, userId);
    const members = await messageRepository.listMembers(conversationId);

    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      projectId: conversation.projectId,
      createdAt: conversation.createdAt,
      members: members.map((member) => ({
        id: member.id,
        name: member.name,
        avatarUrl: member.avatarUrl,
        joinedAt: member.joinedAt,
        muted: member.muted,
      })),
    };
  },

  async startDm(userId: string, otherUserId: string): Promise<ConversationSummary> {
    if (userId === otherUserId) {
      throw AppError.badRequest("You can't start a conversation with yourself");
    }

    const otherUser = await messageRepository.findUserById(otherUserId);
    if (!otherUser) {
      throw AppError.notFound("User not found");
    }

    const dmKey = buildDmKey(userId, otherUserId);
    const existing = await messageRepository.findConversationByDmKey(dmKey);
    if (existing) {
      const [otherParticipants, lastMessages, unreadCounts] = await Promise.all([
        messageRepository.listOtherParticipants([existing.id], userId),
        messageRepository.listLastMessages([existing.id]),
        messageRepository.listUnreadCounts([existing.id], userId),
      ]);
      const [summary] = buildSummaries(
        [
          {
            id: existing.id,
            type: existing.type,
            name: existing.name,
            projectId: existing.projectId,
            createdAt: existing.createdAt,
          },
        ],
        otherParticipants,
        lastMessages,
        unreadCounts
      );
      return summary!;
    }

    const conversation = await messageRepository.createConversation({
      type: "dm",
      name: null,
      projectId: null,
      createdBy: userId,
      dmKey,
    });
    await messageRepository.addMembers(conversation.id, [userId, otherUserId]);

    return {
      id: conversation.id,
      type: "dm",
      name: null,
      projectId: null,
      otherParticipant: { id: otherUser.id, name: otherUser.name, avatarUrl: otherUser.avatarUrl },
      lastMessage: null,
      unreadCount: 0,
      createdAt: conversation.createdAt,
    };
  },

  async createChannel(creatorId: string, input: CreateChannelInput): Promise<ConversationSummary> {
    if (input.projectId) {
      const membership = await messageRepository.findProjectMembership(input.projectId, creatorId);
      if (!membership) {
        throw AppError.forbidden("You must be a member of this project to create a channel in it");
      }
    }

    const candidateIds = Array.from(new Set([...input.memberIds, creatorId]));
    const validUserIds = input.projectId
      ? await messageRepository.findProjectMemberUserIds(input.projectId, candidateIds)
      : await messageRepository.findExistingUserIds(candidateIds);

    const memberIds = validUserIds.includes(creatorId) ? validUserIds : [...validUserIds, creatorId];

    const conversation = await messageRepository.createConversation({
      type: "channel",
      name: input.name,
      projectId: input.projectId ?? null,
      createdBy: creatorId,
    });
    await messageRepository.addMembers(conversation.id, memberIds);

    return {
      id: conversation.id,
      type: "channel",
      name: conversation.name,
      projectId: conversation.projectId,
      otherParticipant: null,
      lastMessage: null,
      unreadCount: 0,
      createdAt: conversation.createdAt,
    };
  },

  async listMessages(
    conversationId: string,
    userId: string,
    query: ListMessagesQuery
  ): Promise<{ messages: PublicMessage[]; hasMore: boolean }> {
    await assertConversationAccess(conversationId, userId);

    const { messages: page, hasMore } = await messageRepository.listMessagesPage(
      conversationId,
      query.before,
      query.limit
    );

    return { messages: page.map(toPublicMessage), hasMore };
  },

  async sendMessage(conversationId: string, senderId: string, body: string): Promise<PublicMessage> {
    await assertConversationAccess(conversationId, senderId);

    const message = await messageRepository.createMessage({ conversationId, senderId, body });
    await messageRepository.touchConversation(conversationId, message.createdAt);

    const withSender = await messageRepository.findMessageWithSender(message.id);
    return toPublicMessage(withSender!);
  },

  async editMessage(messageId: string, userId: string, body: string): Promise<PublicMessage> {
    const message = await messageRepository.findMessageById(messageId);
    if (!message || message.deletedAt) {
      throw AppError.notFound("Message not found");
    }
    if (message.senderId !== userId) {
      throw AppError.forbidden("You can only edit your own messages");
    }

    const updated = await messageRepository.updateMessage(messageId, body);
    return toPublicMessage(updated!);
  },

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await messageRepository.findMessageById(messageId);
    if (!message || message.deletedAt) {
      throw AppError.notFound("Message not found");
    }
    if (message.senderId !== userId) {
      throw AppError.forbidden("You can only delete your own messages");
    }

    await messageRepository.softDeleteMessage(messageId);
  },

  /**
   * Updates the cheap per-conversation unread cursor, and records a per-message "seen" receipt
   * for the message being marked read up to (or the latest message, if none is specified).
   */
  async markRead(conversationId: string, userId: string, messageId: string | undefined): Promise<void> {
    await assertConversationAccess(conversationId, userId);

    if (messageId) {
      const message = await messageRepository.findMessageById(messageId);
      if (!message || message.conversationId !== conversationId) {
        throw AppError.notFound("Message not found");
      }
      await messageRepository.updateReadCursor(conversationId, userId, message.createdAt);
      await messageRepository.recordMessageRead(message.id, userId);
      return;
    }

    await messageRepository.updateReadCursor(conversationId, userId, new Date());
    const latest = await messageRepository.findLatestMessage(conversationId);
    if (latest) {
      await messageRepository.recordMessageRead(latest.id, userId);
    }
  },

  /** Who has seen a specific message — the caller must be a participant in its conversation. */
  async listMessageReads(messageId: string, userId: string): Promise<MessageReadReceipt[]> {
    const message = await messageRepository.findMessageById(messageId);
    if (!message) {
      throw AppError.notFound("Message not found");
    }

    await assertConversationAccess(message.conversationId, userId);

    const rows = await messageRepository.listMessageReads(messageId);
    return rows.map((row) => ({ userId: row.userId, name: row.name, avatarUrl: row.avatarUrl, readAt: row.readAt }));
  },

  async setMuted(conversationId: string, userId: string, muted: boolean): Promise<void> {
    await assertConversationAccess(conversationId, userId);
    await messageRepository.setMuted(conversationId, userId, muted);
  },

  async addMember(conversationId: string, actingUserId: string, newUserId: string): Promise<void> {
    const conversation = await assertConversationAccess(conversationId, actingUserId);
    if (conversation.type !== "channel") {
      throw AppError.badRequest("You can't add members to a direct message");
    }

    const user = await messageRepository.findUserById(newUserId);
    if (!user) {
      throw AppError.notFound("User not found");
    }

    if (conversation.projectId) {
      const membership = await messageRepository.findProjectMembership(conversation.projectId, newUserId);
      if (!membership) {
        throw AppError.badRequest("This user is not a member of the channel's project");
      }
    }

    await messageRepository.addMembers(conversationId, [newUserId]);
  },

  async leaveChannel(conversationId: string, userId: string): Promise<void> {
    const conversation = await assertConversationAccess(conversationId, userId);
    if (conversation.type !== "channel") {
      throw AppError.badRequest("You can't leave a direct message");
    }

    await messageRepository.removeMember(conversationId, userId);
  },
};
