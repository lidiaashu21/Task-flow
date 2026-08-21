import type { Request, Response } from "express";
import { userService } from "./user.service.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/utils/response.js";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import type {
  ChangePasswordInput,
  DeleteAccountInput,
  ListUsersQuery,
  UpdateProfileInput,
  UserIdParam,
} from "./user.schema.js";

export const userController = {
  getMe: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await userService.getMyProfile(req.user!.id);
    sendSuccess(res, { user });
  }),

  updateMe: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await userService.updateProfile(req.user!.id, req.body as UpdateProfileInput);
    sendSuccess(res, { user });
  }),

  changePassword: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await userService.changePassword(req.user!.id, req.body as ChangePasswordInput);
    sendSuccess(res, { changed: true });
  }),

  deleteMe: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await userService.deleteAccount(req.user!.id, req.body as DeleteAccountInput);
    sendSuccess(res, { deleted: true });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params as unknown as UserIdParam;
    const user = await userService.getPublicProfile(userId);
    sendSuccess(res, { user });
  }),

  list: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = req.query as unknown as ListUsersQuery;
    const result = await userService.list(query, req.user!.id);
    sendSuccess(res, result);
  }),
};
