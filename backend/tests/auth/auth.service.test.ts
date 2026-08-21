import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { Request } from "express";
import type { authRepository } from "../../src/module/auth/auth.repository.js";
import type { oauthService } from "../../src/module/auth/oauth.service.js";
import type * as passwordLib from "../../src/lib/password.js";
import type * as jwtLib from "../../src/lib/jwt.js";
import type * as sessionLib from "../../src/lib/session.js";
import type * as emailLib from "../../src/lib/email.js";
import type { MockOf } from "../mock-types.js";

const mockAuthRepository = {
  findUserByEmail: jest.fn() as MockOf<typeof authRepository.findUserByEmail>,
  findUserById: jest.fn() as MockOf<typeof authRepository.findUserById>,
  createUser: jest.fn() as MockOf<typeof authRepository.createUser>,
  markEmailVerified: jest.fn() as MockOf<typeof authRepository.markEmailVerified>,
  updatePassword: jest.fn() as MockOf<typeof authRepository.updatePassword>,
  createEmailVerificationToken: jest.fn() as MockOf<typeof authRepository.createEmailVerificationToken>,
  findValidEmailVerificationToken: jest.fn() as MockOf<typeof authRepository.findValidEmailVerificationToken>,
  consumeEmailVerificationToken: jest.fn() as MockOf<typeof authRepository.consumeEmailVerificationToken>,
  createPasswordResetToken: jest.fn() as MockOf<typeof authRepository.createPasswordResetToken>,
  findValidPasswordResetToken: jest.fn() as MockOf<typeof authRepository.findValidPasswordResetToken>,
  consumePasswordResetToken: jest.fn() as MockOf<typeof authRepository.consumePasswordResetToken>,
  createSession: jest.fn() as MockOf<typeof authRepository.createSession>,
  findActiveSessionByTokenHash: jest.fn() as MockOf<typeof authRepository.findActiveSessionByTokenHash>,
  revokeSession: jest.fn() as MockOf<typeof authRepository.revokeSession>,
  revokeAllUserSessions: jest.fn() as MockOf<typeof authRepository.revokeAllUserSessions>,
  findAuthIdentity: jest.fn() as MockOf<typeof authRepository.findAuthIdentity>,
  createAuthIdentity: jest.fn() as MockOf<typeof authRepository.createAuthIdentity>,
};

const mockOauthService = {
  getGoogleProfile: jest.fn() as MockOf<typeof oauthService.getGoogleProfile>,
};

const mockPassword = {
  hashPassword: jest.fn(async (plain: string) => `hashed:${plain}`) as MockOf<typeof passwordLib.hashPassword>,
  verifyPassword: jest.fn(async () => true) as MockOf<typeof passwordLib.verifyPassword>,
};

const mockJwt = {
  signAccessToken: jest.fn(() => "signed-access-token") as MockOf<typeof jwtLib.signAccessToken>,
};

const mockSession = {
  generateRefreshToken: jest.fn(() => "raw-refresh-token") as MockOf<typeof sessionLib.generateRefreshToken>,
  hashToken: jest.fn((token: string) => `hash:${token}`) as MockOf<typeof sessionLib.hashToken>,
  getRefreshTokenExpiry: jest.fn(() => new Date("2026-09-01T00:00:00.000Z")) as MockOf<
    typeof sessionLib.getRefreshTokenExpiry
  >,
};

const mockEmail = {
  sendVerificationEmail: jest.fn(async () => {}) as MockOf<typeof emailLib.sendVerificationEmail>,
  sendPasswordResetEmail: jest.fn(async () => {}) as MockOf<typeof emailLib.sendPasswordResetEmail>,
};

jest.unstable_mockModule("../../src/module/auth/auth.repository.js", () => ({
  authRepository: mockAuthRepository,
}));
jest.unstable_mockModule("../../src/module/auth/oauth.service.js", () => ({
  oauthService: mockOauthService,
}));
jest.unstable_mockModule("../../src/lib/password.js", () => mockPassword);
jest.unstable_mockModule("../../src/lib/jwt.js", () => mockJwt);
jest.unstable_mockModule("../../src/lib/session.js", () => mockSession);
jest.unstable_mockModule("../../src/lib/email.js", () => mockEmail);

const { authService } = await import("../../src/module/auth/auth.service.js");
const { ErrorCode } = await import("../../src/shared/error/error-codes.js");

function fakeReq(): Request {
  return { headers: { "user-agent": "jest" }, ip: "127.0.0.1" } as unknown as Request;
}

function fakeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    passwordHash: "stored-hash",
    avatarUrl: null,
    emailVerifiedAt: null,
    lastSeenAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPassword.hashPassword.mockImplementation(async (plain: string) => `hashed:${plain}`);
    mockPassword.verifyPassword.mockResolvedValue(true);
    mockJwt.signAccessToken.mockReturnValue("signed-access-token");
    mockSession.generateRefreshToken.mockReturnValue("raw-refresh-token");
    mockSession.hashToken.mockImplementation((token: string) => `hash:${token}`);
    mockSession.getRefreshTokenExpiry.mockReturnValue(new Date("2026-09-01T00:00:00.000Z"));
    mockAuthRepository.createSession.mockResolvedValue({ id: "session-1" });
  });

  describe("register", () => {
    it("creates a user, sends a verification email, and issues tokens", async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(undefined);
      mockAuthRepository.createUser.mockResolvedValue(fakeUser());

      const result = await authService.register(
        { name: "Ada Lovelace", email: "ada@example.com", password: "supersecret" } as never,
        fakeReq()
      );

      expect(mockAuthRepository.createUser).toHaveBeenCalledWith({
        name: "Ada Lovelace",
        email: "ada@example.com",
        passwordHash: "hashed:supersecret",
      });
      expect(mockEmail.sendVerificationEmail).toHaveBeenCalledWith("ada@example.com", "raw-refresh-token");
      expect(result.user.email).toBe("ada@example.com");
      expect(result.tokens.accessToken).toBe("signed-access-token");
    });

    it("rejects when the email is already registered", async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(fakeUser());

      await expect(
        authService.register({ name: "Ada", email: "ada@example.com", password: "supersecret" } as never, fakeReq())
      ).rejects.toMatchObject({ statusCode: 409, code: ErrorCode.EMAIL_ALREADY_IN_USE });
      expect(mockAuthRepository.createUser).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("returns a token pair for valid credentials", async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(fakeUser());
      mockPassword.verifyPassword.mockResolvedValue(true);

      const result = await authService.login({ email: "ada@example.com", password: "supersecret" } as never, fakeReq());

      expect(result.user.id).toBe("user-1");
      expect(result.tokens.refreshToken).toBe("raw-refresh-token");
    });

    it("rejects an unknown email", async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(undefined);

      await expect(
        authService.login({ email: "nobody@example.com", password: "x" } as never, fakeReq())
      ).rejects.toMatchObject({ statusCode: 401, code: ErrorCode.INVALID_CREDENTIALS });
    });

    it("rejects a Google-only account", async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(fakeUser({ passwordHash: null }));

      await expect(
        authService.login({ email: "ada@example.com", password: "x" } as never, fakeReq())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("rejects an incorrect password", async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(fakeUser());
      mockPassword.verifyPassword.mockResolvedValue(false);

      await expect(
        authService.login({ email: "ada@example.com", password: "wrong" } as never, fakeReq())
      ).rejects.toMatchObject({ statusCode: 401, code: ErrorCode.INVALID_CREDENTIALS });
    });
  });

  describe("verifyEmail", () => {
    it("marks the token owner verified", async () => {
      mockAuthRepository.findValidEmailVerificationToken.mockResolvedValue({ id: "tok-1", userId: "user-1" });
      mockAuthRepository.findUserById.mockResolvedValue(fakeUser({ emailVerifiedAt: new Date() }));

      const result = await authService.verifyEmail("raw-token");

      expect(mockAuthRepository.markEmailVerified).toHaveBeenCalledWith("user-1");
      expect(mockAuthRepository.consumeEmailVerificationToken).toHaveBeenCalledWith("tok-1");
      expect(result.emailVerified).toBe(true);
    });

    it("rejects an invalid or expired token", async () => {
      mockAuthRepository.findValidEmailVerificationToken.mockResolvedValue(undefined);

      await expect(authService.verifyEmail("bad-token")).rejects.toMatchObject({
        statusCode: 400,
        code: ErrorCode.INVALID_OR_EXPIRED_TOKEN,
      });
    });
  });

  describe("resendVerification", () => {
    it("does nothing for an unknown email", async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(undefined);

      await authService.resendVerification({ email: "nobody@example.com" } as never);

      expect(mockEmail.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it("does nothing when the email is already verified", async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(fakeUser({ emailVerifiedAt: new Date() }));

      await authService.resendVerification({ email: "ada@example.com" } as never);

      expect(mockEmail.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it("sends a new token for an unverified account", async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(fakeUser());

      await authService.resendVerification({ email: "ada@example.com" } as never);

      expect(mockEmail.sendVerificationEmail).toHaveBeenCalledWith("ada@example.com", "raw-refresh-token");
    });
  });

  describe("forgotPassword", () => {
    it("does nothing for an unknown email", async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(undefined);

      await authService.forgotPassword({ email: "nobody@example.com" } as never);

      expect(mockEmail.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("sends a reset token for a known email", async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(fakeUser());

      await authService.forgotPassword({ email: "ada@example.com" } as never);

      expect(mockAuthRepository.createPasswordResetToken).toHaveBeenCalled();
      expect(mockEmail.sendPasswordResetEmail).toHaveBeenCalledWith("ada@example.com", "raw-refresh-token");
    });
  });

  describe("resetPassword", () => {
    it("updates the password and revokes all sessions", async () => {
      mockAuthRepository.findValidPasswordResetToken.mockResolvedValue({ id: "tok-1", userId: "user-1" });

      await authService.resetPassword({ token: "raw-token", password: "newpass123" } as never);

      expect(mockAuthRepository.updatePassword).toHaveBeenCalledWith("user-1", "hashed:newpass123");
      expect(mockAuthRepository.consumePasswordResetToken).toHaveBeenCalledWith("tok-1");
      expect(mockAuthRepository.revokeAllUserSessions).toHaveBeenCalledWith("user-1");
    });

    it("rejects an invalid or expired token", async () => {
      mockAuthRepository.findValidPasswordResetToken.mockResolvedValue(undefined);

      await expect(authService.resetPassword({ token: "bad", password: "newpass123" } as never)).rejects.toMatchObject({
        statusCode: 400,
        code: ErrorCode.INVALID_OR_EXPIRED_TOKEN,
      });
    });
  });

  describe("refresh", () => {
    it("rotates the refresh token and issues a new pair", async () => {
      mockAuthRepository.findActiveSessionByTokenHash.mockResolvedValue({ id: "session-1", userId: "user-1" });
      mockAuthRepository.findUserById.mockResolvedValue(fakeUser());

      const result = await authService.refresh("old-refresh-token", fakeReq());

      expect(mockAuthRepository.revokeSession).toHaveBeenCalledWith("session-1");
      expect(result.tokens.refreshToken).toBe("raw-refresh-token");
    });

    it("rejects an invalid session", async () => {
      mockAuthRepository.findActiveSessionByTokenHash.mockResolvedValue(undefined);

      await expect(authService.refresh("bad-token", fakeReq())).rejects.toMatchObject({ statusCode: 401 });
    });

    it("rejects when the session's user no longer exists", async () => {
      mockAuthRepository.findActiveSessionByTokenHash.mockResolvedValue({ id: "session-1", userId: "user-1" });
      mockAuthRepository.findUserById.mockResolvedValue(undefined);

      await expect(authService.refresh("old-refresh-token", fakeReq())).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe("logout", () => {
    it("revokes the session backing the refresh token", async () => {
      mockAuthRepository.findActiveSessionByTokenHash.mockResolvedValue({ id: "session-1" });

      await authService.logout("refresh-token");

      expect(mockAuthRepository.revokeSession).toHaveBeenCalledWith("session-1");
    });

    it("no-ops when the session is already gone", async () => {
      mockAuthRepository.findActiveSessionByTokenHash.mockResolvedValue(undefined);

      await authService.logout("refresh-token");

      expect(mockAuthRepository.revokeSession).not.toHaveBeenCalled();
    });
  });

  describe("loginWithGoogle", () => {
    it("logs in an existing linked identity", async () => {
      mockOauthService.getGoogleProfile.mockResolvedValue({
        sub: "google-1",
        email: "ada@example.com",
        name: "Ada Lovelace",
        email_verified: true,
      });
      mockAuthRepository.findAuthIdentity.mockResolvedValue({ userId: "user-1" });
      mockAuthRepository.findUserById.mockResolvedValue(fakeUser());

      const result = await authService.loginWithGoogle("auth-code", fakeReq());

      expect(mockAuthRepository.createUser).not.toHaveBeenCalled();
      expect(result.user.id).toBe("user-1");
    });

    it("links an existing account with the same email", async () => {
      mockOauthService.getGoogleProfile.mockResolvedValue({
        sub: "google-2",
        email: "ada@example.com",
        name: "Ada Lovelace",
        email_verified: true,
      });
      mockAuthRepository.findAuthIdentity.mockResolvedValue(undefined);
      mockAuthRepository.findUserByEmail.mockResolvedValue(fakeUser({ emailVerifiedAt: null }));

      await authService.loginWithGoogle("auth-code", fakeReq());

      expect(mockAuthRepository.markEmailVerified).toHaveBeenCalledWith("user-1");
      expect(mockAuthRepository.createAuthIdentity).toHaveBeenCalledWith("user-1", "google", "google-2");
    });

    it("creates a brand new account when no match exists", async () => {
      mockOauthService.getGoogleProfile.mockResolvedValue({
        sub: "google-3",
        email: "new@example.com",
        name: "New Person",
        picture: "https://example.com/avatar.png",
        email_verified: true,
      });
      mockAuthRepository.findAuthIdentity.mockResolvedValue(undefined);
      mockAuthRepository.findUserByEmail.mockResolvedValue(undefined);
      mockAuthRepository.createUser.mockResolvedValue(fakeUser({ id: "user-2", email: "new@example.com" }));

      const result = await authService.loginWithGoogle("auth-code", fakeReq());

      expect(mockAuthRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: "new@example.com", passwordHash: null })
      );
      expect(mockAuthRepository.createAuthIdentity).toHaveBeenCalledWith("user-2", "google", "google-3");
      expect(result.user.email).toBe("new@example.com");
    });
  });
});
