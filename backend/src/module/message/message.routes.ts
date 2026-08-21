import { Router } from "express";
import { messageController } from "./message.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import {
  addMemberSchema,
  conversationIdParamSchema,
  createChannelSchema,
  editMessageSchema,
  listMessagesQuerySchema,
  markReadSchema,
  messageIdParamSchema,
  sendMessageSchema,
  setMutedSchema,
  startDmSchema,
} from "./message.schema.js";

const router = Router();

router.use(requireAuth);

router.get("/conversations", messageController.listConversations);
router.post("/conversations/dm", validate(startDmSchema), messageController.startDm);
router.post("/conversations/channels", validate(createChannelSchema), messageController.createChannel);

router.get(
  "/conversations/:conversationId",
  validate(conversationIdParamSchema, "params"),
  messageController.getConversation
);

router.get(
  "/conversations/:conversationId/messages",
  validate(conversationIdParamSchema, "params"),
  validate(listMessagesQuerySchema, "query"),
  messageController.listMessages
);

router.post(
  "/conversations/:conversationId/messages",
  validate(conversationIdParamSchema, "params"),
  validate(sendMessageSchema),
  messageController.sendMessage
);

router.post(
  "/conversations/:conversationId/read",
  validate(conversationIdParamSchema, "params"),
  validate(markReadSchema),
  messageController.markRead
);

router.post(
  "/conversations/:conversationId/members",
  validate(conversationIdParamSchema, "params"),
  validate(addMemberSchema),
  messageController.addMember
);

router.delete(
  "/conversations/:conversationId/members/me",
  validate(conversationIdParamSchema, "params"),
  messageController.leaveChannel
);

router.patch(
  "/conversations/:conversationId/mute",
  validate(conversationIdParamSchema, "params"),
  validate(setMutedSchema),
  messageController.setMuted
);

router.get(
  "/messages/:messageId/reads",
  validate(messageIdParamSchema, "params"),
  messageController.listMessageReads
);

router.patch(
  "/messages/:messageId",
  validate(messageIdParamSchema, "params"),
  validate(editMessageSchema),
  messageController.editMessage
);

router.delete("/messages/:messageId", validate(messageIdParamSchema, "params"), messageController.deleteMessage);

export const messageRoutes = router;
