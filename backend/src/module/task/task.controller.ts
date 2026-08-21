import type { Response } from "express";
import { taskService } from "./task.service.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/utils/response.js";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import type { CreateTaskInput, ListTasksQuery, ProjectIdParam, TaskIdParam, UpdateTaskInput } from "./task.schema.js";

export const taskController = {
  create: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params as unknown as ProjectIdParam;
    const task = await taskService.create(projectId, req.user!.id, req.body as CreateTaskInput);
    sendSuccess(res, { task }, 201);
  }),

  list: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params as unknown as ProjectIdParam;
    const query = req.query as unknown as ListTasksQuery;
    const result = await taskService.list(projectId, req.user!.id, query);
    sendSuccess(res, result);
  }),

  dashboard: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params as unknown as ProjectIdParam;
    const dashboard = await taskService.getDashboard(projectId, req.user!.id);
    sendSuccess(res, { dashboard });
  }),

  get: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params as unknown as TaskIdParam;
    const task = await taskService.get(taskId, req.user!.id);
    sendSuccess(res, { task });
  }),

  update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params as unknown as TaskIdParam;
    const task = await taskService.update(taskId, req.user!.id, req.body as UpdateTaskInput);
    sendSuccess(res, { task });
  }),

  remove: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params as unknown as TaskIdParam;
    await taskService.remove(taskId, req.user!.id);
    sendSuccess(res, { deleted: true });
  }),
};
