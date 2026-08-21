import type { Response } from "express";
import { tagService } from "./tag.service.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/utils/response.js";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import type {
  AttachTagInput,
  CreateTagInput,
  ProjectIdParam,
  TagIdParam,
  TaskIdParam,
  TaskTagParams,
  UpdateTagInput,
} from "./tag.schema.js";

export const tagController = {
  create: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params as unknown as ProjectIdParam;
    const tag = await tagService.create(projectId, req.user!.id, req.body as CreateTagInput);
    sendSuccess(res, { tag }, 201);
  }),

  list: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params as unknown as ProjectIdParam;
    const tags = await tagService.list(projectId, req.user!.id);
    sendSuccess(res, { tags });
  }),

  update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tagId } = req.params as unknown as TagIdParam;
    const tag = await tagService.update(tagId, req.user!.id, req.body as UpdateTagInput);
    sendSuccess(res, { tag });
  }),

  remove: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tagId } = req.params as unknown as TagIdParam;
    await tagService.remove(tagId, req.user!.id);
    sendSuccess(res, { deleted: true });
  }),

  listForTask: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params as unknown as TaskIdParam;
    const tags = await tagService.listForTask(taskId, req.user!.id);
    sendSuccess(res, { tags });
  }),

  attachToTask: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params as unknown as TaskIdParam;
    const { tagId } = req.body as AttachTagInput;
    await tagService.attachToTask(taskId, tagId, req.user!.id);
    sendSuccess(res, { attached: true }, 201);
  }),

  detachFromTask: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId, tagId } = req.params as unknown as TaskTagParams;
    await tagService.detachFromTask(taskId, tagId, req.user!.id);
    sendSuccess(res, { detached: true });
  }),
};
