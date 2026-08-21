import { z } from "zod";

export const startDmSchema = z.object({
  userId: z.uuid("Invalid user id"),
});

export const createChannelSchema = z.object({
  name: z.string().trim().min(2, "Channel name must be at least 2 characters").max(100),
  projectId: z.uuid("Invalid project id").optional(),
  memberIds: z.array(z.uuid("Invalid user id")).max(200).default([]),
});

export const conversationIdParamSchema = z.object({
  conversationId: z.uuid("Invalid conversation id"),
});

export const messageIdParamSchema = z.object({
  messageId: z.uuid("Invalid message id"),
});

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty").max(10000, "Message is too long"),
});

export const editMessageSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty").max(10000, "Message is too long"),
});

export const listMessagesQuerySchema = z.object({
  before: z.uuid("Invalid cursor").optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const markReadSchema = z.object({
  messageId: z.uuid("Invalid message id").optional(),
});

export const addMemberSchema = z.object({
  userId: z.uuid("Invalid user id"),
});

export const setMutedSchema = z.object({
  muted: z.boolean(),
});

export type StartDmInput = z.infer<typeof startDmSchema>;
export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type ConversationIdParam = z.infer<typeof conversationIdParamSchema>;
export type MessageIdParam = z.infer<typeof messageIdParamSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type SetMutedInput = z.infer<typeof setMutedSchema>;
