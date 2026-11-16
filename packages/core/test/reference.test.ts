import assert from 'node:assert/strict';
import test from 'node:test';
import dataset from '../../../data/curriculum/hsk3-gushi-2025/words.json';

test('reference vocabulary has stable unique IDs, valid fields and honest source bands', () => {
  assert.equal(dataset.words.length, 11000);
  assert.equal(new Set(dataset.words.map((w) => w.id)).size, dataset.words.length);
  const counts = Array(9).fill(0) as number[];
  const seen = new Map<string, number>();
  for (const word of dataset.words) {
    assert.ok(Number.isInteger(word.targetLevel) && word.targetLevel >= 1 && word.targetLevel <= 9);
    counts[word.targetLevel - 1]!++;
    assert.ok(word.hanzi.trim() && word.meaningEn.trim());
    assert.match(word.pinyin, /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüêńňǹḿ\s'’.,!?;:·/-]+$/iu);
    assert.deepEqual(
      word.sourceRange,
      word.targetLevel >= 7 ? [7, 9] : [word.targetLevel, word.targetLevel],
    );
    const key = `${word.targetLevel}\t${word.hanzi}\t${word.pinyin}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  assert.deepEqual(counts, dataset.summary.byTargetLevel);
  assert.equal(
    [...seen.values()].reduce((a, n) => a + Math.max(0, n - 1), 0),
    dataset.summary.repeatedSameLevelHanziPinyin,
  );
  assert.equal(dataset.summary.arabicTranslations, 0);
  assert.equal(dataset.summary.spanishTranslations, 0);
  assert.equal(dataset.summary.examplesImported, 0);
});
