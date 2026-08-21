import { Router } from "express";
import { commentController } from "./comment.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import {
  commentIdParamSchema,
  createCommentSchema,
  listCommentsQuerySchema,
  listTaskCommentsQuerySchema,
  projectIdParamSchema,
  taskIdParamSchema,
  updateCommentSchema,
} from "./comment.schema.js";

const router = Router();

router.use(requireAuth);

router.post(
  "/projects/:projectId/comments",
  validate(projectIdParamSchema, "params"),
  validate(createCommentSchema),
  commentController.createProjectComment,
);

router.get(
  "/projects/:projectId/comments",
  validate(projectIdParamSchema, "params"),
  validate(listCommentsQuerySchema, "query"),
  commentController.listProjectComments,
);

router.post(
  "/tasks/:taskId/comments",
  validate(taskIdParamSchema, "params"),
  validate(createCommentSchema),
  commentController.create,
);

router.get(
  "/tasks/:taskId/comments",
  validate(taskIdParamSchema, "params"),
  validate(listTaskCommentsQuerySchema, "query"),
  commentController.list,
);

router.patch(
  "/comments/:commentId",
  validate(commentIdParamSchema, "params"),
  validate(updateCommentSchema),
  commentController.update,
);

router.delete(
  "/comments/:commentId",
  validate(commentIdParamSchema, "params"),
  commentController.delete,
);

export const commentRoutes = router;