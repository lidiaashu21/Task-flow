import { and, asc, count, eq, ilike, ne, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users, type User } from "../../db/schema/user.js";

export const userRepository = {
  findById(id: string): Promise<User | undefined> {
    return db.query.users.findFirst({ where: eq(users.id, id) });
  },

  async updateProfile(id: string, patch: { name?: string; avatarUrl?: string | null }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user!;
  },

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, id));
  },

  async deleteById(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  },

  async list(search: string | undefined, limit: number, offset: number, excludeUserId?: string) {
    const searchClause = search ? or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)) : undefined;
    const excludeClause = excludeUserId ? ne(users.id, excludeUserId) : undefined;
    const whereClause =
      searchClause && excludeClause ? and(searchClause, excludeClause) : (searchClause ?? excludeClause);

    const [rows, totalRows] = await Promise.all([
      db
        .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
        .from(users)
        .where(whereClause)
        .orderBy(asc(users.name))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(users).where(whereClause),
    ]);

    return { rows, total: Number(totalRows[0]?.total ?? 0) };
  },
};
