import type { Response } from "express";
import { projectService } from "./project.service.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/utils/response.js";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import type {
  CreateProjectInput,
  ProjectIdParam,
  ProjectMemberParams,
  UpdateMemberRoleInput,
  UpdateProjectInput,
} from "./project.schema.js";

export const projectController = {
  create: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const project = await projectService.create(req.user!.id, req.body as CreateProjectInput);
    sendSuccess(res, { project }, 201);
  }),

  list: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const projects = await projectService.list(req.user!.id);
    sendSuccess(res, { projects });
  }),

  get: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params as unknown as ProjectIdParam;
    const project = await projectService.get(projectId, req.user!.id);
    sendSuccess(res, { project });
  }),

  update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params as unknown as ProjectIdParam;
    const project = await projectService.update(projectId, req.user!.id, req.body as UpdateProjectInput);
    sendSuccess(res, { project });
  }),

  remove: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params as unknown as ProjectIdParam;
    await projectService.remove(projectId, req.user!.id);
    sendSuccess(res, { deleted: true });
  }),

  updateMemberRole: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId, userId } = req.params as unknown as ProjectMemberParams;
    const { role } = req.body as UpdateMemberRoleInput;
    await projectService.updateMemberRole(projectId, req.user!.id, userId, role);
    sendSuccess(res, { updated: true });
  }),

  removeMember: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId, userId } = req.params as unknown as ProjectMemberParams;
    await projectService.removeMember(projectId, req.user!.id, userId);
    sendSuccess(res, { removed: true });
  }),

  leave: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params as unknown as ProjectIdParam;
    await projectService.leave(projectId, req.user!.id);
    sendSuccess(res, { left: true });
  }),
};
