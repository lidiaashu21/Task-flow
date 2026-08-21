import type { Request, Response } from "express";
import { invitationService } from "./invitation.service.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/utils/response.js";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import type {
  AcceptInvitationInput,
  CreateInvitationInput,
  InvitationTokenParam,
  ListInvitationsQuery,
  ProjectIdParam,
  ProjectInvitationParams,
} from "./invitation.schema.js";

export const invitationController = {
  create: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params as unknown as ProjectIdParam;
    const invitation = await invitationService.create(projectId, req.user!.id, req.body as CreateInvitationInput);
    sendSuccess(res, { invitation }, 201);
  }),

  list: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params as unknown as ProjectIdParam;
    const query = req.query as unknown as ListInvitationsQuery;
    const result = await invitationService.list(projectId, req.user!.id, query);
    sendSuccess(res, result);
  }),

  resend: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId, invitationId } = req.params as unknown as ProjectInvitationParams;
    const invitation = await invitationService.resend(projectId, invitationId, req.user!.id);
    sendSuccess(res, { invitation });
  }),

  revoke: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId, invitationId } = req.params as unknown as ProjectInvitationParams;
    await invitationService.revoke(projectId, invitationId, req.user!.id);
    sendSuccess(res, { revoked: true });
  }),

  preview: asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params as unknown as InvitationTokenParam;
    const invitation = await invitationService.preview(token);
    sendSuccess(res, { invitation });
  }),

  accept: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { token } = req.body as AcceptInvitationInput;
    const invitation = await invitationService.accept(token, req.user!.id, req.user!.email);
    sendSuccess(res, { invitation });
  }),
};
