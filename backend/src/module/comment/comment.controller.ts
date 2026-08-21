import type { Response } from "express";
import { commentService } from "./comment.service.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { AppError } from "../../shared/error/app-error.js";
import { ErrorCode } from "../../shared/error/error-codes.js";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import type {
  CommentIdParam,
  CreateCommentInput,
  ListCommentsQuery,
  ListTaskCommentsQuery,
  ProjectIdParam,
  TaskIdParam,
  UpdateCommentInput,
} from "./comment.schema.js";

function isNotFound(error: unknown): boolean {
  return error instanceof AppError && error.code === ErrorCode.NOT_FOUND;
}

export const commentController = {
  create: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params as unknown as TaskIdParam;
    const { body } = req.body as CreateCommentInput;
    const comment = await commentService.create(taskId, req.user!.id, body);
    sendSuccess(res, { comment }, 201);
  }),

  list: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params as unknown as TaskIdParam;
    const query = req.query as unknown as ListTaskCommentsQuery;
    const result = await commentService.list(taskId, req.user!.id, query);
    sendSuccess(res, result);
  }),

  createProjectComment: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params as unknown as ProjectIdParam;
    const { body } = req.body as CreateCommentInput;
    const comment = await commentService.createProjectComment(projectId, req.user!.id, body);
    sendSuccess(res, { comment }, 201);
  }),

  listProjectComments: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params as unknown as ProjectIdParam;
    const query = req.query as unknown as ListCommentsQuery;
    const result = await commentService.listProjectComments(projectId, req.user!.id, query);
    sendSuccess(res, result);
  }),

  /**
   * A single `commentId` doesn't say which table it lives in — task comments and project
   * comments share this endpoint on the frontend — so try task comments first and only fall
   * back to project comments on a genuine "not found", not on a 403/other failure.
   */
  update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { commentId } = req.params as unknown as CommentIdParam;
    const { body } = req.body as UpdateCommentInput;

    try {
      const comment = await commentService.update(commentId, req.user!.id, body);
      sendSuccess(res, { comment });
    } catch (error) {
      if (!isNotFound(error)) throw error;
      const comment = await commentService.updateProjectComment(commentId, req.user!.id, body);
      sendSuccess(res, { comment });
    }
  }),

  delete: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { commentId } = req.params as unknown as CommentIdParam;

    try {
      await commentService.remove(commentId, req.user!.id);
    } catch (error) {
      if (!isNotFound(error)) throw error;
      await commentService.deleteProjectComment(commentId, req.user!.id);
    }

    sendSuccess(res, { deleted: true });
  }),
};
