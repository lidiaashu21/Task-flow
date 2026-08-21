import { z } from "zod";

export const createCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(5000, "Comment is too long"),
});

export const updateCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(5000, "Comment is too long"),
});

export const listCommentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(50),
});

export const projectIdParamSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
});

export const taskIdParamSchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
});

export const listTaskCommentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
});

export const commentIdParamSchema = z.object({
  commentId: z.string().uuid("Invalid comment ID"),
});

export const projectCommentParamsSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  commentId: z.string().uuid("Invalid comment ID"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type ListCommentsQuery = z.infer<typeof listCommentsQuerySchema>;
export type ListTaskCommentsQuery = z.infer<typeof listTaskCommentsQuerySchema>;
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
export type TaskIdParam = z.infer<typeof taskIdParamSchema>;
export type CommentIdParam = z.infer<typeof commentIdParamSchema>;
export type ProjectCommentParams = z.infer<typeof projectCommentParamsSchema>;