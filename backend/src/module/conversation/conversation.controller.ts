import type { Response } from "express";
import { conversationService } from "./conversation.service.js";
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
} from "./conversation.schema.js";

export const conversationController = {
  listConversations: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const conversations = await conversationService.listConversations(req.user!.id);
    sendSuccess(res, { conversations });
  }),

  getConversation: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId } = req.params as unknown as ConversationIdParam;
    const conversation = await conversationService.getConversation(conversationId, req.user!.id);
    sendSuccess(res, { conversation });
  }),

  startDm: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.body as StartDmInput;
    const conversation = await conversationService.startDm(req.user!.id, userId);
    sendSuccess(res, { conversation }, 201);
  }),

  createChannel: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const conversation = await conversationService.createChannel(req.user!.id, req.body as CreateChannelInput);
    sendSuccess(res, { conversation }, 201);
  }),

  listMessages: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId } = req.params as unknown as ConversationIdParam;
    const query = req.query as unknown as ListMessagesQuery;
    const result = await conversationService.listMessages(conversationId, req.user!.id, query);
    sendSuccess(res, result);
  }),

  sendMessage: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId } = req.params as unknown as ConversationIdParam;
    const { body } = req.body as SendMessageInput;
    const message = await conversationService.sendMessage(conversationId, req.user!.id, body);
    sendSuccess(res, { message }, 201);
  }),

  editMessage: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { messageId } = req.params as unknown as MessageIdParam;
    const { body } = req.body as EditMessageInput;
    const message = await conversationService.editMessage(messageId, req.user!.id, body);
    sendSuccess(res, { message });
  }),

  deleteMessage: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { messageId } = req.params as unknown as MessageIdParam;
    await conversationService.deleteMessage(messageId, req.user!.id);
    sendSuccess(res, { deleted: true });
  }),

  markRead: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId } = req.params as unknown as ConversationIdParam;
    const { messageId } = req.body as MarkReadInput;
    await conversationService.markRead(conversationId, req.user!.id, messageId);
    sendSuccess(res, { read: true });
  }),

  addMember: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId } = req.params as unknown as ConversationIdParam;
    const { userId } = req.body as AddMemberInput;
    await conversationService.addMember(conversationId, req.user!.id, userId);
    sendSuccess(res, { added: true }, 201);
  }),

  leaveChannel: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId } = req.params as unknown as ConversationIdParam;
    await conversationService.leaveChannel(conversationId, req.user!.id);
    sendSuccess(res, { left: true });
  }),

  setMuted: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId } = req.params as unknown as ConversationIdParam;
    const { muted } = req.body as SetMutedInput;
    await conversationService.setMuted(conversationId, req.user!.id, muted);
    sendSuccess(res, { muted });
  }),

  listMessageReads: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { messageId } = req.params as unknown as MessageIdParam;
    const reads = await conversationService.listMessageReads(messageId, req.user!.id);
    sendSuccess(res, { reads });
  }),
};
