import type { PrismaClient, Prisma } from '@prisma/client';
import type { LearningEvent, Preferences, SyncCursor } from '../../../packages/core/src';
export type SyncResult = {
  events: LearningEvent[];
  conflicts: string[];
  cursor: SyncCursor | null;
};
/** Key-sorted canonical JSON, so payload comparison survives JSONB key reordering. */
export function canonical(value: unknown): string {
  return Array.isArray(value)
    ? `[${value.map(canonical).join(',')}]`
    : value && typeof value === 'object'
      ? `{${Object.entries(value)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, x]) => `${JSON.stringify(k)}:${canonical(x)}`)
          .join(',')}}`
      : JSON.stringify(value);
}
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
  deleteResets(id: string): Promise<void>;
  resetPassword(hash: string, passwordHash: string): Promise<boolean>;
  deleteUser(id: string): Promise<void>;
  pruneExpiredAuth(): Promise<void>;
  sync(id: string, events: LearningEvent[], cursor?: SyncCursor | null): Promise<SyncResult>;
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
      if (!s) return null;
      if (s.expiresAt <= new Date()) {
        // Lazy cleanup: an expired session row is deleted on first use
        // after expiry instead of accumulating forever.
        await db.session.deleteMany({ where: { tokenHash: hash } });
        return null;
      }
      return user(s.user);
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
    async deleteResets(id) {
      await db.passwordReset.deleteMany({ where: { userId: id } });
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
    async pruneExpiredAuth() {
      const now = new Date();
      await db.session.deleteMany({ where: { expiresAt: { lte: now } } });
      await db.passwordReset.deleteMany({ where: { expiresAt: { lte: now } } });
    },
    async sync(id, events, cursor) {
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
        // Conflict strategy (docs/SYNC.md): events are immutable and the
        // first stored version wins. A re-uploaded ID whose payload
        // differs is NOT an error and never blocks the rest of the
        // batch; its stored version is returned so the client can
        // repair its local copy, and the ID is listed in `conflicts`.
        const stored = events.length
          ? await tx.learningEvent.findMany({
              where: { userId: id, eventId: { in: events.map((e) => e.id) } },
            })
          : [];
        const storedById = new Map(stored.map((e) => [e.eventId, e.payload]));
        const conflicts: string[] = [];
        const conflictEvents: LearningEvent[] = [];
        for (const e of events) {
          const existing = storedById.get(e.id);
          if (existing !== undefined && canonical(existing) !== canonical(e)) {
            conflicts.push(e.id);
            conflictEvents.push(existing as unknown as LearningEvent);
          }
        }
        // Delta: only events after the client's cursor, in the server's
        // deterministic (occurredAt, eventId) order. No cursor means
        // "from the beginning" (first sync / older client).
        const delta = await tx.learningEvent.findMany({
          where: {
            userId: id,
            ...(cursor
              ? {
                  OR: [
                    { occurredAt: { gt: new Date(cursor.at) } },
                    { occurredAt: new Date(cursor.at), eventId: { gt: cursor.id } },
                  ],
                }
              : {}),
          },
          orderBy: [{ occurredAt: 'asc' }, { eventId: 'asc' }],
        });
        const last = await tx.learningEvent.findFirst({
          where: { userId: id },
          orderBy: [{ occurredAt: 'desc' }, { eventId: 'desc' }],
        });
        const byId = new Map<string, LearningEvent>();
        for (const e of delta) byId.set(e.eventId, e.payload as unknown as LearningEvent);
        for (const e of conflictEvents) byId.set(e.id, e);
        return {
          events: [...byId.values()].sort(
            (a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id),
          ),
          conflicts,
          cursor: last ? { at: last.occurredAt.toISOString(), id: last.eventId } : (cursor ?? null),
        };
      });
    },
  };
}
