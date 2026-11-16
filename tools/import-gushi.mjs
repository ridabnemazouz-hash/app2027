import { createHash } from 'node:crypto';
import process from 'node:process';
import console from 'node:console';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Input is a local, downloaded source file, never fetched by the build.
// We deliberately omit third-party examples because sentence-level attribution
// is not supplied in the source file. No translated fields are invented.
const [input, output = 'data/curriculum/hsk3-gushi-2025/words.json'] = process.argv.slice(2);
if (!input) throw new Error('Usage: node tools/import-gushi.mjs downloaded.json [output.json]');
const bytes = await readFile(input);
const source = JSON.parse(bytes.toString('utf8'));
if (
  source.count !== 11000 ||
  !Array.isArray(source.data) ||
  source.data.length !== source.count ||
  !String(source.license).includes('CC BY-SA 4.0') ||
  !String(source.source).includes('2025')
)
  throw new Error('Unexpected source, edition, licence, or record count');
const validPinyin = /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüêńňǹḿ\s'’.,!?;:·/-]+$/iu;
const expected = [0, 300, 200, 500, 1000, 1600, 1800, 1867, 1867, 1866];
const counts = Array(10).fill(0);
const keys = new Map();
const words = source.data.map((row, index) => {
  const level = row.level,
    hanzi = String(row.hanzi ?? '').trim(),
    pinyin = String(row.pinyin ?? '')
      .trim()
      .normalize('NFC'),
    meaning = String(row.meaning ?? '').trim();
  if (
    !Number.isInteger(level) ||
    level < 1 ||
    level > 9 ||
    !hanzi ||
    !pinyin ||
    !meaning ||
    !validPinyin.test(pinyin)
  )
    throw new Error(`Invalid source row ${index + 1}`);
  counts[level]++;
  const key = `${level}\t${hanzi}\t${pinyin}`;
  keys.set(key, (keys.get(key) ?? 0) + 1);
  return {
    id: `gushi-2025-${String(index + 1).padStart(5, '0')}`,
    targetLevel: level,
    sourceRange: level >= 7 ? [7, 9] : [level, level],
    hanzi,
    pinyin,
    meaningEn: meaning,
    sourceIndex: index + 1,
  };
});
if (counts.some((n, i) => n !== expected[i]))
  throw new Error(`Unexpected target level counts: ${counts}`);
const outputData = {
  version: 'gushi-hsk3-2025-20261028',
  sourceEdition: '2025-11',
  sourceUpdated: source.updated,
  importedAt: '2026-10-28',
  sourceUrl: 'https://gushichinese.com/hsk-3.0/downloads/hsk-3.0-words-all.json',
  attribution:
    'HSK 3.0 word list, all levels by Gushi (https://gushichinese.com/hsk-3.0/downloads), CC BY-SA 4.0; meanings adapted from CC-CEDICT (https://www.mdbg.net/chinese/dictionary?page=cc-cedict), CC BY-SA 4.0.',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  sourceSha256: createHash('sha256').update(bytes).digest('hex'),
  validation: 'needs-review',
  officialAlignment: 'Independent transcription; not independently audited or endorsed by CTI.',
  advancedNote: 'The source assigns 7, 8, and 9 for study. Official source band is shared 7–9.',
  summary: {
    records: words.length,
    byTargetLevel: counts.slice(1),
    repeatedSameLevelHanziPinyin: [...keys.values()].reduce(
      (n, count) => n + Math.max(0, count - 1),
      0,
    ),
    englishMeanings: words.length,
    chineseDefinitions: 0,
    arabicTranslations: 0,
    spanishTranslations: 0,
    examplesImported: 0,
  },
  words,
};
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(outputData));
console.log(JSON.stringify(outputData.summary, null, 2));
