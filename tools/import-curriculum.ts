import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { validateCurriculum } from '../packages/core/src';
import { parseCsv } from '../packages/core/src/csv';
const [file, ...args] = process.argv.slice(2);
if (!file)
  throw new Error(
    'Usage: tsx tools/import-curriculum.ts input.json|csv [--manifest bundle.json] [--type vocabulary|grammar|characters] [--out normalized.json]',
  );
const option = (name: string) => args[args.indexOf(name) + 1];
let input: unknown;
const errors: string[] = [];
try {
  const raw = await readFile(file, 'utf8');
  if (file.endsWith('.csv')) {
    if (!args.includes('--manifest'))
      throw new Error(
        'CSV import requires --manifest with version, sources and curriculum hierarchy',
      );
    const bundle = JSON.parse(await readFile(option('--manifest')!, 'utf8')) as Record<
      string,
      unknown[]
    >;
    const kind = option('--type');
    if (!kind || !['vocabulary', 'grammar', 'characters'].includes(kind))
      throw new Error('--type must be vocabulary, grammar or characters');
    const nested = new Set([
      'translation',
      'levelRange',
      'tags',
      'examples',
      'usageNotes',
      'classifiers',
      'synonyms',
      'antonyms',
      'point',
      'explanation',
      'commonMistake',
      'meaning',
      'vocabularyIds',
    ]);
    const rows = parseCsv(raw).map((row) =>
      Object.fromEntries(
        Object.entries(row)
          .filter(([, v]) => v !== '')
          .map(([k, v]) => [
            k,
            nested.has(k)
              ? JSON.parse(v)
              : ['level', 'strokeCount'].includes(k)
                ? Number(v)
                : ['audio', 'radical', 'strokeOrder'].includes(k) && v === 'null'
                  ? null
                  : v,
          ]),
      ),
    );
    const ids = rows.map((r) => String(r.id));
    if (new Set(ids).size !== ids.length) throw new Error('Duplicate CSV record IDs');
    const map = new Map((bundle[kind] ?? []).map((r) => [(r as { id: string }).id, r]));
    for (const row of rows) map.set(String(row.id), row);
    bundle[kind] = [...map.values()];
    input = bundle;
  } else input = JSON.parse(raw);
} catch (e) {
  errors.push(e instanceof Error ? e.message : String(e));
}
const result = errors.length ? { ok: false as const, errors } : validateCurriculum(input);
await mkdir('data/reports', { recursive: true });
await writeFile(
  'data/reports/import-report.json',
  JSON.stringify(
    {
      retrievedAt: new Date().toISOString(),
      file,
      result: result.ok ? { ok: true, ...result.report } : { ok: false, errors: result.errors },
    },
    null,
    2,
  ),
);
if (!result.ok) {
  console.error(result.errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(result.report, null, 2));
  if (args.includes('--out')) {
    const out = option('--out');
    if (!out) throw new Error('--out requires a file path');
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, JSON.stringify(result.data, null, 2) + '\n');
  }
}
