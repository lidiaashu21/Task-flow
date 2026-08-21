import type { Request } from "express";
import { authRepository } from "./auth.repository.js";
import { oauthService } from "./oauth.service.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { signAccessToken } from "../../lib/jwt.js";
import {
  generateRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
} from "../../lib/session.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../../lib/email.js";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/error/app-error.js";
import { ErrorCode } from "../../shared/error/error-codes.js";
import {
  toPublicUser,
  type AuthResult,
  type PublicUser,
} from "./auth.types.js";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  ResetPasswordInput,
} from "./auth.schema.js";

/** Generates an opaque token and returns both the raw value (to email/return once) and its hash (to store). */
function newOpaqueToken() {
  const raw = generateRefreshToken();
  return { raw, hash: hashToken(raw) };
}

function emailVerificationExpiry(): Date {
  return new Date(
    Date.now() + env.EMAIL_VERIFICATION_EXPIRES_IN_HOURS * 60 * 60 * 1000,
  );
}

function passwordResetExpiry(): Date {
  return new Date(
    Date.now() + env.PASSWORD_RESET_EXPIRES_IN_MINUTES * 60 * 1000,
  );
}

async function issueTokens(userId: string, email: string, req: Request) {
  const accessToken = signAccessToken({ sub: userId, email });
  const { raw: refreshToken, hash: refreshTokenHash } = newOpaqueToken();
  const refreshTokenExpiresAt = getRefreshTokenExpiry();

  await authRepository.createSession(
    userId,
    refreshTokenHash,
    refreshTokenExpiresAt,
    req.headers["user-agent"] ?? null,
    req.ip ?? null,
  );

  return { accessToken, refreshToken, refreshTokenExpiresAt };
}

export const authService = {
  async register(input: RegisterInput, req: Request): Promise<AuthResult> {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) {
      throw AppError.conflict(
        "An account with this email already exists",
        ErrorCode.EMAIL_ALREADY_IN_USE,
      );
    }

    const passwordHash = await hashPassword(input.password);
    const user = await authRepository.createUser({
      name: input.name,
      email: input.email,
      passwordHash,
    });
    4;
    const { raw, hash } = newOpaqueToken();
    await authRepository.createEmailVerificationToken(
      user.id,
      hash,
      emailVerificationExpiry(),
    );
    await sendVerificationEmail(user.email, raw);

    const tokens = await issueTokens(user.id, user.email, req);
    return { user: toPublicUser(user), tokens };
  },

  async login(input: LoginInput, req: Request): Promise<AuthResult> {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) {
      throw new AppError(
        401,
        ErrorCode.INVALID_CREDENTIALS,
        "Invalid email or password",
      );
    }

    if (!user.passwordHash) {
      throw AppError.badRequest(
        'This account signs in with Google. Use "Continue with Google" instead.',
      );
    }

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError(
        401,
        ErrorCode.INVALID_CREDENTIALS,
        "Invalid email or password",
      );
    }

    const tokens = await issueTokens(user.id, user.email, req);
    return { user: toPublicUser(user), tokens };
  },

  async verifyEmail(token: string): Promise<PublicUser> {
    const tokenHash = hashToken(token);
    const record =
      await authRepository.findValidEmailVerificationToken(tokenHash);
    if (!record) {
      throw new AppError(
        400,
        ErrorCode.INVALID_OR_EXPIRED_TOKEN,
        "This verification link is invalid or has expired",
      );
    }

    await authRepository.markEmailVerified(record.userId);
    await authRepository.consumeEmailVerificationToken(record.id);

    const user = await authRepository.findUserById(record.userId);
    return toPublicUser(user!);
  },

  /** Always resolves silently — existence of the email is never revealed to the caller. */
  async resendVerification(input: ResendVerificationInput): Promise<void> {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user || user.emailVerifiedAt) return;

    const { raw, hash } = newOpaqueToken();
    await authRepository.createEmailVerificationToken(
      user.id,
      hash,
      emailVerificationExpiry(),
    );
    await sendVerificationEmail(user.email, raw);
  },

  /** Always resolves silently — existence of the email is never revealed to the caller. */
  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) return;

    const { raw, hash } = newOpaqueToken();
    await authRepository.createPasswordResetToken(
      user.id,
      hash,
      passwordResetExpiry(),
    );
    await sendPasswordResetEmail(user.email, raw);
  },

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const tokenHash = hashToken(input.token);
    const record = await authRepository.findValidPasswordResetToken(tokenHash);
    if (!record) {
      throw new AppError(
        400,
        ErrorCode.INVALID_OR_EXPIRED_TOKEN,
        "This reset link is invalid or has expired",
      );
    }

    const passwordHash = await hashPassword(input.password);
    await authRepository.updatePassword(record.userId, passwordHash);
    await authRepository.consumePasswordResetToken(record.id);
    // Force re-login everywhere once the password changes.
    await authRepository.revokeAllUserSessions(record.userId);
  },

  /** Rotates the refresh token on every use so a stolen (but already-used) token stops working. */
  async refresh(refreshToken: string, req: Request): Promise<AuthResult> {
    const tokenHash = hashToken(refreshToken);
    const session =
      await authRepository.findActiveSessionByTokenHash(tokenHash);
    if (!session) {
      throw AppError.unauthorized("Invalid or expired session");
    }

    await authRepository.revokeSession(session.id);

    const user = await authRepository.findUserById(session.userId);
    if (!user) {
      throw AppError.unauthorized("Invalid or expired session");
    }

    const tokens = await issueTokens(user.id, user.email, req);
    return { user: toPublicUser(user), tokens };
  },

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    const session =
      await authRepository.findActiveSessionByTokenHash(tokenHash);
    if (session) {
      await authRepository.revokeSession(session.id);
    }
  },

  async loginWithGoogle(code: string, req: Request): Promise<AuthResult> {
    const profile = await oauthService.getGoogleProfile(code);

    const identity = await authRepository.findAuthIdentity(
      "google",
      profile.sub,
    );
    if (identity) {
      const user = await authRepository.findUserById(identity.userId);
      if (!user) throw AppError.unauthorized("Account no longer exists");
      const tokens = await issueTokens(user.id, user.email, req);
      return { user: toPublicUser(user), tokens };
    }

    // No identity yet — link to an existing account with the same email, or create a new one.
    let user = await authRepository.findUserByEmail(profile.email);

    if (!user) {
      user = await authRepository.createUser({
        name: profile.name,
        email: profile.email,
        passwordHash: null,
        avatarUrl: profile.picture ?? null,
        emailVerifiedAt: new Date(),
      });
    } else if (!user.emailVerifiedAt) {
      // Google already verified this email address on our behalf.
      await authRepository.markEmailVerified(user.id);
      user.emailVerifiedAt = new Date();
    }

    await authRepository.createAuthIdentity(user.id, "google", profile.sub);

    const tokens = await issueTokens(user.id, user.email, req);
    return { user: toPublicUser(user), tokens };
  },
};
