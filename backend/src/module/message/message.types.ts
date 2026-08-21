export type ConversationType = "dm" | "channel";

export interface ConversationParticipant {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  name: string | null;
  projectId: string | null;
  /** For DMs, the other participant — the client renders this as the conversation's identity. */
  otherParticipant: ConversationParticipant | null;
  lastMessage: {
    id: string;
    body: string;
    senderId: string;
    createdAt: Date;
    isDeleted: boolean;
  } | null;
  unreadCount: number;
  createdAt: Date;
}

export interface ConversationDetail {
  id: string;
  type: ConversationType;
  name: string | null;
  projectId: string | null;
  createdAt: Date;
  members: Array<{ id: string; name: string; avatarUrl: string | null; joinedAt: Date; muted: boolean }>;
}

export interface MessageReadReceipt {
  userId: string;
  name: string;
  avatarUrl: string | null;
  readAt: Date;
}

export interface PublicMessage {
  id: string;
  conversationId: string;
  body: string;
  sender: ConversationParticipant;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
}

interface MessageWithSender {
  id: string;
  conversationId: string;
  body: string;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  sender: ConversationParticipant;
}

export function toPublicMessage(message: MessageWithSender): PublicMessage {
  return {
    id: message.id,
    conversationId: message.conversationId,
    body: message.deletedAt ? "[deleted]" : message.body,
    sender: message.sender,
    isEdited: message.editedAt !== null,
    isDeleted: message.deletedAt !== null,
    createdAt: message.createdAt,
  };
}
