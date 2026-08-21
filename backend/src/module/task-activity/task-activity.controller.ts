import type { Response } from "express";
import { taskActivityService } from "./task-activity.service.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/utils/response.js";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import type { ListActivityQuery, TaskIdParam } from "./task-activity.schema.js";

export const taskActivityController = {
  list: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params as unknown as TaskIdParam;
    const query = req.query as unknown as ListActivityQuery;
    const result = await taskActivityService.list(taskId, req.user!.id, query);
    sendSuccess(res, result);
  }),
};
