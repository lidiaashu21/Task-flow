import type { User } from "../../db/schema/user.js";

/** What any authenticated user sees when looking at someone else's profile — no email. */
export interface PublicProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
}

/** What a user sees looking at their own account. */
export interface MyProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  hasPassword: boolean;
  createdAt: Date;
}

export function toPublicProfile(user: Pick<User, "id" | "name" | "avatarUrl">): PublicProfile {
  return { id: user.id, name: user.name, avatarUrl: user.avatarUrl };
}

export function toMyProfile(user: User): MyProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerifiedAt !== null,
    hasPassword: user.passwordHash !== null,
    createdAt: user.createdAt,
  };
}
