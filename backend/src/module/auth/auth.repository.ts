import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";

import { users, type NewUser, type User } from "../../db/schema/user.js";
import { authIdentities } from "../../db/schema/auth-identitie.js";
import { emailVerificationTokens } from "../../db/schema/email-verification.js";
import { passwordResetTokens } from "../../db/schema/password-reset.js";
import { sessions } from "../../db/schema/session.js";

export const authRepository = {
  findUserByEmail(email: string): Promise<User | undefined> {
    return db.query.users.findFirst({ where: eq(users.email, email) });
  },

  findUserById(id: string): Promise<User | undefined> {
    return db.query.users.findFirst({ where: eq(users.id, id) });
  },

  async createUser(input: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(input).returning();
    return user!;
  },

  async markEmailVerified(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));
  },

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  },

  async createEmailVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await db
      .insert(emailVerificationTokens)
      .values({ userId, tokenHash, expiresAt });
  },

  findValidEmailVerificationToken(tokenHash: string) {
    return db.query.emailVerificationTokens.findFirst({
      where: and(
        eq(emailVerificationTokens.tokenHash, tokenHash),
        isNull(emailVerificationTokens.consumedAt),
        gt(emailVerificationTokens.expiresAt, new Date()),
      ),
    });
  },

  async consumeEmailVerificationToken(id: string): Promise<void> {
    await db
      .update(emailVerificationTokens)
      .set({ consumedAt: new Date() })
      .where(eq(emailVerificationTokens.id, id));
  },

  async createPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await db
      .insert(passwordResetTokens)
      .values({ userId, tokenHash, expiresAt });
  },

  findValidPasswordResetToken(tokenHash: string) {
    return db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.consumedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    });
  },

  async consumePasswordResetToken(id: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ consumedAt: new Date() })
      .where(eq(passwordResetTokens.id, id));
  },

  async createSession(
    userId: string,
    refreshTokenHash: string,
    expiresAt: Date,
    userAgent: string | null,
    ipAddress: string | null,
  ) {
    const [session] = await db
      .insert(sessions)
      .values({ userId, refreshTokenHash, expiresAt, userAgent, ipAddress })
      .returning();
    return session!;
  },

  findActiveSessionByTokenHash(refreshTokenHash: string) {
    return db.query.sessions.findFirst({
      where: and(
        eq(sessions.refreshTokenHash, refreshTokenHash),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    });
  },

  async revokeSession(id: string): Promise<void> {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.id, id));
  },

  async revokeAllUserSessions(userId: string): Promise<void> {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  },

  findAuthIdentity(provider: string, providerAccountId: string) {
    return db.query.authIdentities.findFirst({
      where: and(
        eq(authIdentities.provider, provider),
        eq(authIdentities.providerAccountId, providerAccountId),
      ),
    });
  },

  async createAuthIdentity(
    userId: string,
    provider: string,
    providerAccountId: string,
  ): Promise<void> {
    await db
      .insert(authIdentities)
      .values({ userId, provider, providerAccountId });
  },
};
