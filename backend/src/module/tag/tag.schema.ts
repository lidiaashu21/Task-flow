import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a hex code like #22C55E");

export const createTagSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required").max(50),
  color: hexColor,
});

export const updateTagSchema = z
  .object({
    name: z.string().trim().min(1, "Tag name is required").max(50).optional(),
    color: hexColor.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Provide at least one field to update" });

export const projectIdParamSchema = z.object({
  projectId: z.uuid("Invalid project id"),
});

export const tagIdParamSchema = z.object({
  tagId: z.uuid("Invalid tag id"),
});

export const taskIdParamSchema = z.object({
  taskId: z.uuid("Invalid task id"),
});

export const taskTagParamsSchema = z.object({
  taskId: z.uuid("Invalid task id"),
  tagId: z.uuid("Invalid tag id"),
});

export const attachTagSchema = z.object({
  tagId: z.uuid("Invalid tag id"),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
export type TagIdParam = z.infer<typeof tagIdParamSchema>;
export type TaskIdParam = z.infer<typeof taskIdParamSchema>;
export type TaskTagParams = z.infer<typeof taskTagParamsSchema>;
export type AttachTagInput = z.infer<typeof attachTagSchema>;
