import { z } from "zod";

/** Mirrors `module/auth/auth.schema.ts` on the backend, field for field. */
const emailField = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));
const passwordField = z.string().min(8, "Password must be at least 8 characters").max(72);

export const loginFormSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(255),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const forgotPasswordFormSchema = z.object({
  email: emailField,
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export const resendVerificationFormSchema = z.object({
  email: emailField,
});
export type ResendVerificationFormValues = z.infer<typeof resendVerificationFormSchema>;

export const resetPasswordFormSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
