import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import { validateCurriculum } from '../../../packages/core/src';
const input = JSON.parse(
  await readFile(
    new URL('../../../data/curriculum/supplementary-v1/content.json', import.meta.url),
    'utf8',
  ),
) as unknown;
const result = validateCurriculum(input);
if (!result.ok) throw new Error(result.errors.join('\n'));
const db = new PrismaClient();
try {
  await db.curriculum.upsert({
    where: { version: result.data.version },
    create: { version: result.data.version, payload: result.data as Prisma.InputJsonValue },
    update: { payload: result.data as Prisma.InputJsonValue },
  });
  console.log(result.report);
} finally {
  await db.$disconnect();
}
