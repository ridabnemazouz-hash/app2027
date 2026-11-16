import type { PrismaClient, Prisma } from '@prisma/client';
import type { LearningEvent, Preferences } from '../../../packages/core/src';
export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  preferences: Preferences;
};
export interface Repository {
  findUser(email: string): Promise<User | null>;
  getUser(id: string): Promise<User | null>;
  createUser(user: Omit<User, 'id'>): Promise<User>;
  preferences(id: string, prefs: Preferences): Promise<void>;
  createSession(hash: string, id: string, expires: Date): Promise<void>;
  session(hash: string): Promise<User | null>;
  revoke(hash: string): Promise<void>;
  createReset(hash: string, id: string, expires: Date): Promise<void>;
  resetPassword(hash: string, passwordHash: string): Promise<boolean>;
  deleteUser(id: string): Promise<void>;
  sync(id: string, events: LearningEvent[]): Promise<LearningEvent[]>;
}
export function prismaRepository(db: PrismaClient): Repository {
  const user = (u: unknown) => u as User | null;
  return {
    async findUser(email) {
      return user(await db.user.findUnique({ where: { email } }));
    },
    async getUser(id) {
      return user(await db.user.findUnique({ where: { id } }));
    },
    async createUser(u) {
      return (await db.user.create({
        data: { ...u, preferences: u.preferences as Prisma.InputJsonValue },
      })) as unknown as User;
    },
    async preferences(id, prefs) {
      await db.user.update({
        where: { id },
        data: { preferences: prefs as Prisma.InputJsonValue },
      });
    },
    async createSession(hash, id, expires) {
      await db.session.create({ data: { tokenHash: hash, userId: id, expiresAt: expires } });
    },
    async session(hash) {
      const s = await db.session.findUnique({
        where: { tokenHash: hash },
        include: { user: true },
      });
      return s && s.expiresAt > new Date() ? user(s.user) : null;
    },
    async revoke(hash) {
      await db.session.deleteMany({ where: { tokenHash: hash } });
    },
    async createReset(hash, id, expires) {
      await db.$transaction([
        db.passwordReset.deleteMany({ where: { userId: id } }),
        db.passwordReset.create({ data: { tokenHash: hash, userId: id, expiresAt: expires } }),
      ]);
    },
    async resetPassword(hash, passwordHash) {
      return db.$transaction(async (tx) => {
        const reset = await tx.passwordReset.findUnique({ where: { tokenHash: hash } });
        if (!reset || reset.expiresAt < new Date()) return false;
        const removed = await tx.passwordReset.deleteMany({
          where: { tokenHash: hash, expiresAt: { gt: new Date() } },
        });
        if (removed.count !== 1) return false;
        await tx.user.update({ where: { id: reset.userId }, data: { passwordHash } });
        await tx.session.deleteMany({ where: { userId: reset.userId } });
        return true;
      });
    },
    async deleteUser(id) {
      await db.user.delete({ where: { id } });
    },
    async sync(id, events) {
      return db.$transaction(async (tx) => {
        await tx.learningEvent.createMany({
          data: events.map((e) => ({
            userId: id,
            eventId: e.id,
            occurredAt: new Date(e.at),
            payload: e as Prisma.InputJsonValue,
          })),
          skipDuplicates: true,
        });
        const all = await tx.learningEvent.findMany({
          where: { userId: id },
          orderBy: [{ occurredAt: 'asc' }, { eventId: 'asc' }],
        });
        const map = new Map(all.map((e) => [e.eventId, e.payload]));
        for (const e of events) {
          if (JSON.stringify(map.get(e.id)) !== JSON.stringify(JSON.parse(JSON.stringify(e)))) {
            // JSONB property order is not stable: compare keys recursively through a canonical form.
            const canonical = (v: unknown): string =>
              Array.isArray(v)
                ? `[${v.map(canonical).join(',')}]`
                : v && typeof v === 'object'
                  ? `{${Object.entries(v)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([k, x]) => `${JSON.stringify(k)}:${canonical(x)}`)
                      .join(',')}}`
                  : JSON.stringify(v);
            if (canonical(map.get(e.id)) !== canonical(e))
              throw Object.assign(new Error('Event ID conflict'), {
                status: 409,
                code: 'EVENT_CONFLICT',
              });
          }
        }
        return all.map((e) => e.payload as unknown as LearningEvent);
      });
    },
  };
}
