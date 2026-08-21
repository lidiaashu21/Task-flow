import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

export const createInvitationSchema = z.object({
  email: emailField,
});

export const projectIdParamSchema = z.object({
  projectId: z.uuid("Invalid project id"),
});

export const projectInvitationParamsSchema = z.object({
  projectId: z.uuid("Invalid project id"),
  invitationId: z.uuid("Invalid invitation id"),
});

export const invitationTokenParamSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const listInvitationsQuerySchema = z.object({
  status: z.enum(["pending", "accepted", "expired", "revoked"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
export type ProjectInvitationParams = z.infer<typeof projectInvitationParamsSchema>;
export type InvitationTokenParam = z.infer<typeof invitationTokenParamSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type ListInvitationsQuery = z.infer<typeof listInvitationsQuerySchema>;
