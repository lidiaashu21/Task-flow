import { randomBytes } from "node:crypto";
import { buildGoogleAuthUrl, exchangeGoogleCode, fetchGoogleProfile, type GoogleProfile } from "../../lib/oauth.js";
import { isGoogleOAuthConfigured } from "../../config/oauth.js";
import { AppError } from "../../shared/error/app-error.js";

/** Google-specific OAuth orchestration: builds the consent URL and resolves a code to a profile. */
export const oauthService = {
  isConfigured(): boolean {
    return isGoogleOAuthConfigured;
  },

  /** CSRF guard — stored in a short-lived cookie and checked against the callback's `state`. */
  createState(): string {
    return randomBytes(16).toString("hex");
  },

  getGoogleAuthUrl(state: string): string {
    if (!isGoogleOAuthConfigured) {
      throw AppError.internal("Google OAuth is not configured on the server");
    }
    return buildGoogleAuthUrl(state);
  },

  async getGoogleProfile(code: string): Promise<GoogleProfile> {
    const tokens = await exchangeGoogleCode(code);
    const profile = await fetchGoogleProfile(tokens.access_token);

    if (!profile.email_verified) {
      throw AppError.badRequest("Your Google account's email is not verified");
    }

    return profile;
  },
};
