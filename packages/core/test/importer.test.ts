import test from 'node:test';
import assert from 'node:assert/strict';
import data from '../../../data/curriculum/supplementary-v1/content.json';
import { validateCurriculum, preferencesSchema, eventSchema } from '../src';
import { parseCsv } from '../src/csv';
const clone = () => structuredClone(data);
test('shipped bundle validates and populates nine levels without official-content claims', () => {
  const result = validateCurriculum(data);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.report.populatedLevels, 9);
    assert.equal(result.report.vocabulary, 36);
    assert.equal(result.report.verifiedRecords, 0);
    assert.equal(result.data.framework.officialContentImported, false);
  }
});
test('duplicate IDs fail with actionable import diagnostics', () => {
  const d = clone();
  d.vocabulary.push(d.vocabulary[0]!);
  const r = validateCurriculum(d);
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.errors.join(' '), /Duplicate id/);
});
test('numeric pinyin, invalid levels, missing translations and sources are rejected', () => {
  for (const change of [
    (d: ReturnType<typeof clone>) => {
      d.vocabulary[0]!.pinyin = 'ni3 hao3';
    },
    (d: ReturnType<typeof clone>) => {
      d.vocabulary[0]!.level = 10;
    },
    (d: ReturnType<typeof clone>) => {
      d.vocabulary[0]!.translation.ar = '';
    },
    (d: ReturnType<typeof clone>) => {
      d.vocabulary[0]!.sourceId = 'missing';
    },
  ]) {
    const d = clone();
    change(d);
    assert.equal(validateCurriculum(d).ok, false);
  }
});
test('unplayable listening content and dangling lesson references cannot import', () => {
  const d = clone();
  const l = d.stages[0]!.levels[0]!.units[0]!.lessons[0]!;
  l.exercises[0]!.kind = 'listening';
  l.vocabularyIds.push('unknown');
  const r = validateCurriculum(d);
  assert.equal(r.ok, false);
});
test('CSV preserves Arabic, commas, escaped quotes and multiline examples', () => {
  assert.deepEqual(parseCsv('id,text\r\na,"你好, مرحبًا"\r\nb,"line1\nline2 ""quote"""'), [
    { id: 'a', text: '你好, مرحبًا' },
    { id: 'b', text: 'line1\nline2 "quote"' },
  ]);
  assert.throws(() => parseCsv('id,id\nx,y'));
  assert.throws(() => parseCsv('id,text\na'));
  assert.throws(() => parseCsv('id\n"broken'));
});
test('invalid preferences and unanswered answer events are rejected', () => {
  assert.equal(preferencesSchema.safeParse({ locale: 'xx' }).success, false);
  assert.equal(eventSchema.safeParse({ id: 'bad', type: 'answer' }).success, false);
});
