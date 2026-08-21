import { Router } from "express";
import { invitationController } from "./invitation.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import {
  acceptInvitationSchema,
  createInvitationSchema,
  invitationTokenParamSchema,
  listInvitationsQuerySchema,
  projectIdParamSchema,
  projectInvitationParamsSchema,
} from "./invitation.schema.js";

const router = Router();

// Public — lets an invitee see what they're accepting before they log in or register.
router.get(
  "/invitations/preview/:token",
  validate(invitationTokenParamSchema, "params"),
  invitationController.preview,
);

router.use(requireAuth);

router.post(
  "/projects/:projectId/invitations",
  validate(projectIdParamSchema, "params"),
  validate(createInvitationSchema),
  invitationController.create,
);

router.get(
  "/projects/:projectId/invitations",
  validate(projectIdParamSchema, "params"),
  validate(listInvitationsQuerySchema, "query"),
  invitationController.list,
);

router.post(
  "/projects/:projectId/invitations/:invitationId/resend",
  validate(projectInvitationParamsSchema, "params"),
  invitationController.resend,
);

router.delete(
  "/projects/:projectId/invitations/:invitationId",
  validate(projectInvitationParamsSchema, "params"),
  invitationController.revoke,
);

router.post(
  "/invitations/accept",
  validate(acceptInvitationSchema),
  invitationController.accept,
);

export const invitationRoutes = router;
