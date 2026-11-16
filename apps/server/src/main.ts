import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createApp } from './app';
import { prismaRepository } from './repository';
import { emailProvider, tutorProvider } from './providers';
const db = new PrismaClient();
await db.$connect();
const trustProxy = process.env.TRUST_PROXY
  ? /^\d+$/.test(process.env.TRUST_PROXY)
    ? Number(process.env.TRUST_PROXY)
    : process.env.TRUST_PROXY === 'true'
      ? true
      : process.env.TRUST_PROXY
  : undefined;
const repo = prismaRepository(db);
const app = createApp(repo, {
  origins: (process.env.CORS_ORIGINS ?? 'http://localhost:8081,http://127.0.0.1:8081').split(','),
  email: emailProvider(process.env),
  tutor: tutorProvider(process.env),
  trustProxy,
});
void repo.pruneExpiredAuth().catch(() => undefined);
const pruneTimer = setInterval(
  () => void repo.pruneExpiredAuth().catch(() => undefined),
  6 * 3600 * 1000,
);
pruneTimer.unref();
const server = app.listen(Number(process.env.PORT ?? 4000), () =>
  console.log('HanziGo API listening'),
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => {
    server.close(() => {
      void db.$disconnect().then(() => process.exit(0));
    });
  });
