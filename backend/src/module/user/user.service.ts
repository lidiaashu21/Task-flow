import { userRepository } from "./user.repository.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { AppError } from "../../shared/error/app-error.js";
import { ErrorCode } from "../../shared/error/error-codes.js";
import { getPagination, buildPaginationMeta, type PaginationMeta } from "../../shared/utils/pagination.js";
import { toMyProfile, toPublicProfile, type MyProfile, type PublicProfile } from "./user.types.js";
import type { ChangePasswordInput, DeleteAccountInput, ListUsersQuery, UpdateProfileInput } from "./user.schema.js";

export const userService = {
  async getMyProfile(userId: string): Promise<MyProfile> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw AppError.unauthorized("Account no longer exists");
    }
    return toMyProfile(user);
  },

  async getPublicProfile(userId: string): Promise<PublicProfile> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found");
    }
    return toPublicProfile(user);
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<MyProfile> {
    const patch: { name?: string; avatarUrl?: string | null } = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.avatarUrl !== undefined) patch.avatarUrl = input.avatarUrl;

    const user = await userRepository.updateProfile(userId, patch);
    return toMyProfile(user);
  },

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw AppError.unauthorized("Account no longer exists");
    }

    if (user.passwordHash) {
      if (!input.currentPassword) {
        throw AppError.badRequest("Current password is required");
      }
      const valid = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!valid) {
        throw new AppError(401, ErrorCode.INVALID_CREDENTIALS, "Current password is incorrect");
      }
    }

    const passwordHash = await hashPassword(input.newPassword);
    await userRepository.updatePassword(userId, passwordHash);
  },

  async deleteAccount(userId: string, input: DeleteAccountInput): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw AppError.unauthorized("Account no longer exists");
    }

    if (user.passwordHash) {
      if (!input.password) {
        throw AppError.badRequest("Password is required to delete your account");
      }
      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) {
        throw AppError.badRequest("Incorrect password");
      }
    }

    await userRepository.deleteById(userId);
  },

  async list(query: ListUsersQuery, excludeUserId?: string): Promise<{ users: PublicProfile[]; pagination: PaginationMeta }> {
    const { limit, offset, page } = getPagination(query);
    const { rows, total } = await userRepository.list(query.search, limit, offset, excludeUserId);

    return {
      users: rows.map(toPublicProfile),
      pagination: buildPaginationMeta(page, limit, total),
    };
  },
};
