import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildPracticeExam, curriculumSchema, scoreExam, type Curriculum } from '../src';

const curriculum: Curriculum = curriculumSchema.parse(
  JSON.parse(
    readFileSync(
      new URL('../../../data/curriculum/supplementary-v1/content.json', import.meta.url),
      'utf8',
    ),
  ),
);

test('practice exam assembles real level content into three sections', () => {
  for (const level of [1, 5, 9]) {
    const exam = buildPracticeExam(curriculum, level, 'en');
    assert.equal(exam.id, `exam-hsk${level}`);
    assert.equal(exam.minutes, 30);
    const [listening, reading, grammar] = exam.sections;
    assert.equal(listening?.exercises.length, 8);
    assert.equal(reading?.exercises.length, 5);
    assert.equal(grammar?.exercises.length, 12);
    const ids = exam.sections.flatMap((s) => s.exercises.map((e) => e.id));
    assert.equal(new Set(ids).size, ids.length, 'question ids must be unique');
    for (const e of exam.sections.flatMap((s) => s.exercises)) {
      assert.equal(e.assessment, 'automatic');
      assert.ok(e.answers.length >= 1);
      for (const o of e.options ?? []) assert.equal(typeof o, 'string');
      // Synthesized and multiple-choice questions must offer their
      // correct answer among the options; other kinds (typing, tone)
      // legitimately keep options and answers in different forms.
      if (e.id.startsWith('exam-') || e.kind === 'multiple-choice')
        assert.ok(e.options?.includes(e.answers[0]!), `${e.id} answer must be an option`);
    }
  }
});

test('scoring follows the documented 300-point model', () => {
  const exam = buildPracticeExam(curriculum, 1, 'en');
  const allRight: Record<string, string> = {};
  for (const s of exam.sections) for (const e of s.exercises) allRight[e.id] = e.answers[0]!;
  const perfect = scoreExam(exam, allRight);
  assert.equal(perfect.total, 300);
  assert.deepEqual(perfect.sections, { listening: 100, reading: 100, grammar: 100 });
  const blank = scoreExam(exam, {});
  assert.equal(blank.total, 0);
  // Half of the listening section correct -> 50 of its 100 points.
  const half: Record<string, string> = {};
  const listening = exam.sections[0]!.exercises;
  listening.slice(0, 4).forEach((e) => (half[e.id] = e.answers[0]!));
  const partial = scoreExam(exam, half);
  assert.equal(partial.sections.listening, 50);
  assert.equal(partial.total, 50);
});

test('exam respects the learner translation direction', () => {
  const exam = buildPracticeExam(curriculum, 2, 'ar');
  const kinds = exam.sections[2]!.exercises.map((e) => e.kind);
  assert.ok(!kinds.includes('en-zh'));
  assert.ok(!kinds.includes('es-zh'));
});
