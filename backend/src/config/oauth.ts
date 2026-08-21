import { env } from "./env.js";

export const googleOAuthConfig = {
  clientId: env.GOOGLE_CLIENT_ID ?? "",
  clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
  redirectUri: env.GOOGLE_REDIRECT_URI ?? `http://localhost:${env.PORT}/api/auth/google/callback`,
  scope: ["openid", "email", "profile"].join(" "),
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
} as const;

export const isGoogleOAuthConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
