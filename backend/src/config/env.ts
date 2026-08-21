import { config as loadDotenv } from "dotenv";
import { z } from "zod";

// `quiet: true` suppresses dotenv's promotional "tip" line (e.g. ads for unrelated third-party
// products) that it otherwise prints to stdout on every load.
loadDotenv({ quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(30),

  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("TaskFlow <no-reply@taskflow.dev>"),

  EMAIL_VERIFICATION_EXPIRES_IN_HOURS: z.coerce.number().int().positive().default(24),
  PASSWORD_RESET_EXPIRES_IN_MINUTES: z.coerce.number().int().positive().default(30),
  INVITATION_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(7),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
