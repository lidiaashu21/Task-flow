import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { userRepository } from "../../src/module/user/user.repository.js";
import type * as passwordLib from "../../src/lib/password.js";
import type { MockOf } from "../mock-types.js";

const mockUserRepository = {
  findById: jest.fn() as MockOf<typeof userRepository.findById>,
  updateProfile: jest.fn() as MockOf<typeof userRepository.updateProfile>,
  updatePassword: jest.fn() as MockOf<typeof userRepository.updatePassword>,
  deleteById: jest.fn() as MockOf<typeof userRepository.deleteById>,
  list: jest.fn() as MockOf<typeof userRepository.list>,
};

const mockPassword = {
  hashPassword: jest.fn(async (plain: string) => `hashed:${plain}`) as MockOf<typeof passwordLib.hashPassword>,
  verifyPassword: jest.fn(async () => true) as MockOf<typeof passwordLib.verifyPassword>,
};

jest.unstable_mockModule("../../src/module/user/user.repository.js", () => ({
  userRepository: mockUserRepository,
}));
jest.unstable_mockModule("../../src/lib/password.js", () => mockPassword);

const { userService } = await import("../../src/module/user/user.service.js");
const { ErrorCode } = await import("../../src/shared/error/error-codes.js");

function fakeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    passwordHash: "stored-hash",
    avatarUrl: null,
    emailVerifiedAt: new Date("2026-01-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("userService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPassword.hashPassword.mockImplementation(async (plain: string) => `hashed:${plain}`);
    mockPassword.verifyPassword.mockResolvedValue(true);
  });

  describe("getMyProfile", () => {
    it("returns the full profile for an existing user", async () => {
      mockUserRepository.findById.mockResolvedValue(fakeUser());

      const result = await userService.getMyProfile("user-1");

      expect(result).toMatchObject({ id: "user-1", email: "ada@example.com", hasPassword: true });
    });

    it("rejects when the account no longer exists", async () => {
      mockUserRepository.findById.mockResolvedValue(undefined);

      await expect(userService.getMyProfile("user-1")).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe("getPublicProfile", () => {
    it("returns a redacted profile without email", async () => {
      mockUserRepository.findById.mockResolvedValue(fakeUser());

      const result = await userService.getPublicProfile("user-1");

      expect(result).toEqual({ id: "user-1", name: "Ada Lovelace", avatarUrl: null });
    });

    it("rejects for an unknown user", async () => {
      mockUserRepository.findById.mockResolvedValue(undefined);

      await expect(userService.getPublicProfile("ghost")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("updateProfile", () => {
    it("only forwards fields that were provided", async () => {
      mockUserRepository.updateProfile.mockResolvedValue(fakeUser({ name: "Ada L." }));

      const result = await userService.updateProfile("user-1", { name: "Ada L." } as never);

      expect(mockUserRepository.updateProfile).toHaveBeenCalledWith("user-1", { name: "Ada L." });
      expect(result.name).toBe("Ada L.");
    });
  });

  describe("changePassword", () => {
    it("updates the password after verifying the current one", async () => {
      mockUserRepository.findById.mockResolvedValue(fakeUser());

      await userService.changePassword("user-1", { currentPassword: "old", newPassword: "newpass123" } as never);

      expect(mockPassword.verifyPassword).toHaveBeenCalledWith("old", "stored-hash");
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith("user-1", "hashed:newpass123");
    });

    it("rejects when the current password is missing for a password account", async () => {
      mockUserRepository.findById.mockResolvedValue(fakeUser());

      await expect(
        userService.changePassword("user-1", { newPassword: "newpass123" } as never)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("rejects when the current password is incorrect", async () => {
      mockUserRepository.findById.mockResolvedValue(fakeUser());
      mockPassword.verifyPassword.mockResolvedValue(false);

      await expect(
        userService.changePassword("user-1", { currentPassword: "wrong", newPassword: "newpass123" } as never)
      ).rejects.toMatchObject({ statusCode: 401, code: ErrorCode.INVALID_CREDENTIALS });
    });

    it("skips verification for Google-only accounts", async () => {
      mockUserRepository.findById.mockResolvedValue(fakeUser({ passwordHash: null }));

      await userService.changePassword("user-1", { newPassword: "newpass123" } as never);

      expect(mockPassword.verifyPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith("user-1", "hashed:newpass123");
    });

    it("rejects when the account no longer exists", async () => {
      mockUserRepository.findById.mockResolvedValue(undefined);

      await expect(
        userService.changePassword("user-1", { currentPassword: "old", newPassword: "newpass123" } as never)
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe("deleteAccount", () => {
    it("deletes the account after verifying the password", async () => {
      mockUserRepository.findById.mockResolvedValue(fakeUser());

      await userService.deleteAccount("user-1", { password: "correct" } as never);

      expect(mockUserRepository.deleteById).toHaveBeenCalledWith("user-1");
    });

    it("rejects when the password is missing for a password account", async () => {
      mockUserRepository.findById.mockResolvedValue(fakeUser());

      await expect(userService.deleteAccount("user-1", {} as never)).rejects.toMatchObject({ statusCode: 400 });
      expect(mockUserRepository.deleteById).not.toHaveBeenCalled();
    });

    it("rejects when the password is incorrect", async () => {
      mockUserRepository.findById.mockResolvedValue(fakeUser());
      mockPassword.verifyPassword.mockResolvedValue(false);

      await expect(userService.deleteAccount("user-1", { password: "wrong" } as never)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(mockUserRepository.deleteById).not.toHaveBeenCalled();
    });
  });

  describe("list", () => {
    it("returns paginated public profiles", async () => {
      mockUserRepository.list.mockResolvedValue({ rows: [fakeUser(), fakeUser({ id: "user-2" })], total: 2 });

      const result = await userService.list({ page: 1, limit: 20 } as never);

      expect(result.users).toHaveLength(2);
      expect(result.pagination).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 });
    });
  });
});
