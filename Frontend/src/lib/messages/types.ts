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
  otherParticipant: ConversationParticipant | null;
  lastMessage: {
    id: string;
    body: string;
    senderId: string;
    createdAt: string;
    isDeleted: boolean;
  } | null;
  unreadCount: number;
  createdAt: string;
}

export interface ConversationDetail {
  id: string;
  type: ConversationType;
  name: string | null;
  projectId: string | null;
  createdAt: string;
  members: Array<{ id: string; name: string; avatarUrl: string | null; joinedAt: string; muted: boolean }>;
}

export interface MessageReadReceipt {
  userId: string;
  name: string;
  avatarUrl: string | null;
  readAt: string;
}

export interface PublicMessage {
  id: string;
  conversationId: string;
  body: string;
  sender: ConversationParticipant;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
}
