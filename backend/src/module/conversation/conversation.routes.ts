import { Router } from "express";
import { conversationController } from "./conversation.controller.js";
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
} from "./conversation.schema.js";

const router = Router();

router.use(requireAuth);

router.get("/conversations", conversationController.listConversations);
router.post("/conversations/dm", validate(startDmSchema), conversationController.startDm);
router.post("/conversations/channels", validate(createChannelSchema), conversationController.createChannel);

router.get(
  "/conversations/:conversationId",
  validate(conversationIdParamSchema, "params"),
  conversationController.getConversation
);

router.get(
  "/conversations/:conversationId/messages",
  validate(conversationIdParamSchema, "params"),
  validate(listMessagesQuerySchema, "query"),
  conversationController.listMessages
);

router.post(
  "/conversations/:conversationId/messages",
  validate(conversationIdParamSchema, "params"),
  validate(sendMessageSchema),
  conversationController.sendMessage
);

router.post(
  "/conversations/:conversationId/read",
  validate(conversationIdParamSchema, "params"),
  validate(markReadSchema),
  conversationController.markRead
);

router.post(
  "/conversations/:conversationId/members",
  validate(conversationIdParamSchema, "params"),
  validate(addMemberSchema),
  conversationController.addMember
);

router.delete(
  "/conversations/:conversationId/members/me",
  validate(conversationIdParamSchema, "params"),
  conversationController.leaveChannel
);

router.patch(
  "/conversations/:conversationId/mute",
  validate(conversationIdParamSchema, "params"),
  validate(setMutedSchema),
  conversationController.setMuted
);

router.get(
  "/messages/:messageId/reads",
  validate(messageIdParamSchema, "params"),
  conversationController.listMessageReads
);

router.patch(
  "/messages/:messageId",
  validate(messageIdParamSchema, "params"),
  validate(editMessageSchema),
  conversationController.editMessage
);

router.delete(
  "/messages/:messageId",
  validate(messageIdParamSchema, "params"),
  conversationController.deleteMessage
);

export const conversationRoutes = router;
