import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters").max(255),
  description: z.string().trim().max(5000).optional(),
});

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(2, "Project name must be at least 2 characters").max(255).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Provide at least one field to update" });

export const projectIdParamSchema = z.object({
  projectId: z.uuid("Invalid project id"),
});

export const projectMemberParamsSchema = z.object({
  projectId: z.uuid("Invalid project id"),
  userId: z.uuid("Invalid user id"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["owner", "member"]),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
export type ProjectMemberParams = z.infer<typeof projectMemberParamsSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
