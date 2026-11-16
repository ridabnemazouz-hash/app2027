import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import {
  defaultPreferences,
  eventSchema,
  localeSchema,
  preferencesSchema,
} from '../../../packages/core/src';
import type { Repository, User } from './repository';
import { hashPassword, verifyPassword, newToken, tokenHash } from './security';
import type { EmailProvider, TutorProvider } from './providers';
const credentials = z.object({
  email: z
    .string()
    .email()
    .max(254)
    .transform((e) => e.trim().toLowerCase()),
  password: z.string().min(10).max(128),
});
const publicUser = (u: User) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  preferences: u.preferences,
});
const fail = (status: number, code: string) => Object.assign(new Error(code), { status, code });
export function createApp(
  repo: Repository,
  options: {
    origins?: string[];
    email?: EmailProvider;
    tutor?: TutorProvider;
    trustProxy?: string | number | boolean;
  } = {},
) {
  const app = express();
  // Only trust X-Forwarded-For when the deployment is actually behind a
  // proxy the operator controls; otherwise rate limits key on the socket IP.
  if (options.trustProxy !== undefined) app.set('trust proxy', options.trustProxy);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: options.origins ?? ['http://localhost:8081', 'http://127.0.0.1:8081'] }));
  app.use(express.json({ limit: '1mb' }));
  app.use(
    rateLimit({
      windowMs: 60000,
      limit: 120,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: 'RATE_LIMITED' },
    }),
  );
  const authLimit = rateLimit({
    windowMs: 15 * 60000,
    limit: 25,
    message: { error: 'RATE_LIMITED' },
  });
  const tutorLimit = rateLimit({ windowMs: 3600000, limit: 30, message: { error: 'TUTOR_LIMIT' } });
  const requireUser = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.headers.authorization ?? '');
      if (!match?.[1]) throw fail(401, 'UNAUTHORIZED');
      const hash = tokenHash(match[1]);
      const u = await repo.session(hash);
      if (!u) throw fail(401, 'UNAUTHORIZED');
      res.locals.user = u;
      res.locals.hash = hash;
      next();
    } catch (e) {
      next(e);
    }
  };
  async function session(u: User) {
    const token = newToken();
    await repo.createSession(tokenHash(token), u.id, new Date(Date.now() + 30 * 86400000));
    return { token, user: publicUser(u) };
  }
  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', emailConfigured: !!options.email, tutorConfigured: !!options.tutor }),
  );
  app.post('/auth/register', authLimit, async (req, res) => {
    const input = credentials.extend({ name: z.string().trim().min(1).max(80) }).parse(req.body);
    if (await repo.findUser(input.email)) throw fail(409, 'EMAIL_IN_USE');
    const u = await repo.createUser({
      email: input.email,
      name: input.name,
      passwordHash: await hashPassword(input.password),
      preferences: defaultPreferences,
    });
    res.status(201).json(await session(u));
  });
  app.post('/auth/login', authLimit, async (req, res) => {
    const input = credentials.parse(req.body);
    const u = await repo.findUser(input.email);
    const hash = u?.passwordHash ?? (await hashPassword('constant-dummy-password'));
    const valid = await verifyPassword(input.password, hash);
    if (!u || !valid) throw fail(401, 'INVALID_CREDENTIALS');
    res.json(await session(u));
  });
  app.post('/auth/reset-request', authLimit, async (req, res) => {
    const { email } = credentials.pick({ email: true }).parse(req.body);
    if (!options.email) throw fail(503, 'EMAIL_NOT_CONFIGURED');
    const u = await repo.findUser(email);
    if (u) {
      const token = newToken();
      await repo.createReset(tokenHash(token), u.id, new Date(Date.now() + 30 * 60000));
      try {
        await options.email.sendReset(email, token);
      } catch (error) {
        // Never leave a live reset token behind for an email that was
        // not delivered; the user can simply request a new one.
        await repo.deleteResets(u.id);
        throw error;
      }
    }
    res.json({ accepted: true });
  });
  app.post('/auth/reset', authLimit, async (req, res) => {
    const { token, password } = z
      .object({ token: z.string().length(43), password: credentials.shape.password })
      .parse(req.body);
    if (!(await repo.resetPassword(tokenHash(token), await hashPassword(password))))
      throw fail(400, 'INVALID_RESET_TOKEN');
    res.json({ updated: true });
  });
  app.get('/me', requireUser, (_req, res) =>
    res.json({ user: publicUser(res.locals.user as User) }),
  );
  app.put('/me/preferences', requireUser, async (req, res) => {
    const prefs = preferencesSchema.parse(req.body);
    await repo.preferences((res.locals.user as User).id, prefs);
    res.json({ preferences: prefs });
  });
  app.post('/auth/logout', requireUser, async (_req, res) => {
    await repo.revoke(res.locals.hash as string);
    res.json({ revoked: true });
  });
  app.delete('/me', requireUser, async (req, res) => {
    const { password } = z.object({ password: z.string().min(1).max(128) }).parse(req.body);
    const u = res.locals.user as User;
    if (!(await verifyPassword(password, u.passwordHash))) throw fail(401, 'INVALID_CREDENTIALS');
    await repo.deleteUser(u.id);
    res.json({ deleted: true });
  });
  app.post('/sync', requireUser, async (req, res) => {
    const { events, cursor } = z
      .object({
        events: z.array(eventSchema).max(500),
        cursor: z.object({ at: z.string().datetime(), id: z.string().uuid() }).nullish(),
      })
      .parse(req.body);
    if (events.some((e) => Date.parse(e.at) > Date.now() + 300000)) throw fail(400, 'FUTURE_EVENT');
    // Response: delta after `cursor`, conflicting stored versions, and
    // the new cursor. See docs/SYNC.md for the conflict strategy.
    res.json(await repo.sync((res.locals.user as User).id, events, cursor ?? null));
  });
  app.post('/tutor', requireUser, tutorLimit, async (req, res) => {
    const { message, locale, level } = z
      .object({
        message: z.string().trim().min(1).max(2000),
        locale: localeSchema,
        level: z.number().int().min(1).max(9),
      })
      .parse(req.body);
    if (!options.tutor) throw fail(503, 'TUTOR_NOT_CONFIGURED');
    res.json({ reply: await options.tutor.reply(message, locale, level), generated: true });
  });
  app.use(
    (error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: 'VALIDATION_ERROR', fields: error.issues.map((i) => i.path.join('.')) });
        return;
      }
      const e = error as { status?: number; code?: string };
      const status = e.status ?? (e.code === 'P2002' ? 409 : 500);
      res.status(status).json({
        error:
          e.code === 'P2002'
            ? 'EMAIL_IN_USE'
            : status < 500 || status === 503
              ? (e.code ?? 'REQUEST_FAILED')
              : 'SERVICE_UNAVAILABLE',
      });
    },
  );
  return app;
}
