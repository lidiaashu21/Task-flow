import type { Fetcher } from "../api/types";
import type { ConversationDetail, ConversationSummary, MessageReadReceipt, PublicMessage } from "./types";

export async function listConversations(fetcher: Fetcher): Promise<ConversationSummary[]> {
  const { conversations } = await fetcher<{ conversations: ConversationSummary[] }>("/conversations");
  return conversations;
}

export function getConversation(fetcher: Fetcher, conversationId: string): Promise<{ conversation: ConversationDetail }> {
  return fetcher<{ conversation: ConversationDetail }>(`/conversations/${conversationId}`);
}

export function startDm(fetcher: Fetcher, userId: string): Promise<{ conversation: ConversationSummary }> {
  return fetcher<{ conversation: ConversationSummary }>("/conversations/dm", { method: "POST", body: { userId } });
}

export function createChannel(
  fetcher: Fetcher,
  input: { name: string; projectId?: string; memberIds: string[] }
): Promise<{ conversation: ConversationSummary }> {
  return fetcher<{ conversation: ConversationSummary }>("/conversations/channels", { method: "POST", body: input });
}

export function listMessages(
  fetcher: Fetcher,
  conversationId: string,
  before?: string
): Promise<{ messages: PublicMessage[]; hasMore: boolean }> {
  return fetcher<{ messages: PublicMessage[]; hasMore: boolean }>(`/conversations/${conversationId}/messages`, {
    query: { before, limit: "50" },
  });
}

export function sendMessage(fetcher: Fetcher, conversationId: string, body: string): Promise<{ message: PublicMessage }> {
  return fetcher<{ message: PublicMessage }>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: { body },
  });
}

export function editMessage(fetcher: Fetcher, messageId: string, body: string): Promise<{ message: PublicMessage }> {
  return fetcher<{ message: PublicMessage }>(`/messages/${messageId}`, { method: "PATCH", body: { body } });
}

export function deleteMessage(fetcher: Fetcher, messageId: string): Promise<{ deleted: true }> {
  return fetcher<{ deleted: true }>(`/messages/${messageId}`, { method: "DELETE" });
}

export function markConversationRead(
  fetcher: Fetcher,
  conversationId: string,
  messageId?: string
): Promise<{ read: true }> {
  return fetcher<{ read: true }>(`/conversations/${conversationId}/read`, { method: "POST", body: { messageId } });
}

export function addConversationMember(
  fetcher: Fetcher,
  conversationId: string,
  userId: string
): Promise<{ added: true }> {
  return fetcher<{ added: true }>(`/conversations/${conversationId}/members`, { method: "POST", body: { userId } });
}

export function leaveConversation(fetcher: Fetcher, conversationId: string): Promise<{ left: true }> {
  return fetcher<{ left: true }>(`/conversations/${conversationId}/members/me`, { method: "DELETE" });
}

export function setConversationMuted(
  fetcher: Fetcher,
  conversationId: string,
  muted: boolean
): Promise<{ muted: boolean }> {
  return fetcher<{ muted: boolean }>(`/conversations/${conversationId}/mute`, { method: "PATCH", body: { muted } });
}

export async function listMessageReads(fetcher: Fetcher, messageId: string): Promise<MessageReadReceipt[]> {
  const { reads } = await fetcher<{ reads: MessageReadReceipt[] }>(`/messages/${messageId}/reads`);
  return reads;
}
