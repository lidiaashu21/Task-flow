import type { Response } from "express";
import { messageService } from "./message.service.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/utils/response.js";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import type {
  AddMemberInput,
  ConversationIdParam,
  CreateChannelInput,
  EditMessageInput,
  ListMessagesQuery,
  MarkReadInput,
  MessageIdParam,
  SendMessageInput,
  SetMutedInput,
  StartDmInput,
} from "./message.schema.js";

export const messageController = {
  listConversations: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const conversations = await messageService.listConversations(req.user!.id);
    sendSuccess(res, { conversations });
  }),

  getConversation: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId } = req.params as unknown as ConversationIdParam;
    const conversation = await messageService.getConversation(conversationId, req.user!.id);
    sendSuccess(res, { conversation });
  }),

  startDm: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.body as StartDmInput;
    const conversation = await messageService.startDm(req.user!.id, userId);
    sendSuccess(res, { conversation }, 201);
  }),

  createChannel: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const conversation = await messageService.createChannel(req.user!.id, req.body as CreateChannelInput);
    sendSuccess(res, { conversation }, 201);
  }),

  listMessages: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId } = req.params as unknown as ConversationIdParam;
    const query = req.query as unknown as ListMessagesQuery;
    const result = await messageService.listMessages(conversationId, req.user!.id, query);
    sendSuccess(res, result);
  }),

  sendMessage: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId } = req.params as unknown as ConversationIdParam;
    const { body } = req.body as SendMessageInput;
    const message = await messageService.sendMessage(conversationId, req.user!.id, body);
    sendSuccess(res, { message }, 201);
  }),

  editMessage: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { messageId } = req.params as unknown as MessageIdParam;
    const { body } = req.body as EditMessageInput;
    const message = await messageService.editMessage(messageId, req.user!.id, body);
    sendSuccess(res, { message });
  }),

  deleteMessage: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { messageId } = req.params as unknown as MessageIdParam;
    await messageService.deleteMessage(messageId, req.user!.id);
    sendSuccess(res, { deleted: true });
  }),

  markRead: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId } = req.params as unknown as ConversationIdParam;
    const { messageId } = req.body as MarkReadInput;
    await messageService.markRead(conversationId, req.user!.id, messageId);
    sendSuccess(res, { read: true });
  }),

  addMember: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId } = req.params as unknown as ConversationIdParam;
    const { userId } = req.body as AddMemberInput;
    await messageService.addMember(conversationId, req.user!.id, userId);
    sendSuccess(res, { added: true }, 201);
  }),

  leaveChannel: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId } = req.params as unknown as ConversationIdParam;
    await messageService.leaveChannel(conversationId, req.user!.id);
    sendSuccess(res, { left: true });
  }),

  setMuted: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId } = req.params as unknown as ConversationIdParam;
    const { muted } = req.body as SetMutedInput;
    await messageService.setMuted(conversationId, req.user!.id, muted);
    sendSuccess(res, { muted });
  }),

  listMessageReads: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { messageId } = req.params as unknown as MessageIdParam;
    const reads = await messageService.listMessageReads(messageId, req.user!.id);
    sendSuccess(res, { reads });
  }),
};
