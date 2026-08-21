import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(255).optional(),
    /** Explicit null clears the avatar; omitting the field leaves it untouched. */
    avatarUrl: z.url("Enter a valid URL").max(2048).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Provide at least one field to update" });

export const changePasswordSchema = z.object({
  /** Not required for an account that has no password yet (e.g. a Google-only account setting one for the first time). */
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const deleteAccountSchema = z.object({
  /** Not required for a Google-only account with no password set. */
  password: z.string().optional(),
});

export const userIdParamSchema = z.object({
  userId: z.uuid("Invalid user id"),
});

export const listUsersQuerySchema = z.object({
  search: z.string().trim().max(255).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
