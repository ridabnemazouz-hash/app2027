import test from 'node:test';
import assert from 'node:assert/strict';
import {
  schedule,
  deriveProgress,
  checkAnswer,
  mergeEvents,
  streak,
  type LearningEvent,
  type Exercise,
} from '../src';
const at = '2026-10-28T12:00:00.000Z';
const event = (id: string, extra: Partial<LearningEvent> = {}): LearningEvent => ({
  id,
  at,
  type: 'answer',
  itemId: 'v1',
  correct: true,
  quality: 4,
  skill: 'vocabulary',
  seconds: 15,
  ...extra,
});
test('successful recall expands 1 day, 6 days, then ease-weighted intervals', () => {
  const first = schedule(undefined, 4, at);
  assert.equal(first.interval, 1);
  const second = schedule(first, 4, first.nextReview);
  assert.equal(second.interval, 6);
  const third = schedule(second, 4, second.nextReview);
  assert.equal(third.interval, 15);
  assert.equal(third.reviews, 3);
});
test('failed recall retries after ten minutes and resets consecutive successes', () => {
  let r = schedule(undefined, 5, at);
  r = schedule(r, 1, r.nextReview);
  assert.equal(r.repetitions, 0);
  assert.equal(Date.parse(r.nextReview) - Date.parse(r.lastReview), 600000);
  assert.equal(r.incorrect, 1);
  assert.equal(schedule(r, 4, r.nextReview).interval, 1);
});
test('successful practice before the due time does not inflate the review interval', () => {
  const first = schedule(undefined, 4, at);
  const early = schedule(first, 5, '2026-10-28T12:01:00.000Z');
  assert.equal(early.nextReview, first.nextReview);
  assert.equal(early.interval, 1);
  assert.equal(early.repetitions, 1);
  assert.equal(early.reviews, 2);
});
test('ease never drops below 1.3, invalid quality and date are rejected', () => {
  let r = schedule(undefined, 0, at);
  for (let i = 0; i < 100; i++) r = schedule(r, 0, r.nextReview);
  assert.equal(r.ease, 1.3);
  assert.throws(() => schedule(r, 6, at));
  assert.throws(() => schedule(r, 3, 'bad-date'));
});
test('an empty or whitespace answer cannot be correct, tone marks remain significant', () => {
  const e = { assessment: 'automatic', answers: ['你好', 'nǐ hǎo'] } as Exercise;
  assert.equal(checkAnswer(e, ''), false);
  assert.equal(checkAnswer(e, ' \n '), false);
  assert.equal(checkAnswer(e, '你好！'), true);
  assert.equal(checkAnswer(e, 'ni hao'), false);
  assert.equal(checkAnswer({ ...e, assessment: 'self' }, '你好'), false);
});
test('event deduplication and deterministic order survive reconnect/replay', () => {
  const a = event('a'),
    b = event('b', { at: '2026-10-29T12:00:00.000Z', correct: false, quality: 1 });
  const merged = mergeEvents([b, a], [a, b]);
  assert.equal(merged.length, 2);
  assert.deepEqual(deriveProgress(merged), deriveProgress(mergeEvents([a], [b])));
  assert.equal(deriveProgress(merged).reviews.v1?.reviews, 2);
});
test('reset is a synchronized history barrier and preserves later activity', () => {
  const events = [
    event('a'),
    event('reset', { type: 'reset', at: '2026-10-29T00:00:00.000Z' }),
    event('b', { at: '2026-10-30T00:00:00.000Z' }),
  ];
  const p = deriveProgress(events);
  assert.equal(p.total, 1);
  assert.equal(p.reviews.v1?.reviews, 1);
  assert.equal(p.activity['2026-10-28'], undefined);
});
test('subjective recall schedules reviews but does not inflate automatic accuracy', () => {
  const p = deriveProgress([
    event('a', { skill: 'self' }),
    event('b', { correct: false, quality: 1 }),
  ]);
  assert.equal(p.total, 1);
  assert.equal(p.correct, 0);
  assert.equal(p.reviews.v1?.reviews, 2);
});
test('favorite and learned toggles are reversible; merely answering never completes a lesson', () => {
  const p = deriveProgress([
    event('a', { type: 'favorite', value: true }),
    event('b', { type: 'favorite', value: false }),
    event('c', { type: 'learned', value: true }),
    event('d'),
  ]);
  assert.equal(p.favorites.size, 0);
  assert.equal(p.learned.size, 1);
  assert.equal(p.lessons.size, 0);
});
test('streak includes yesterday when today has no activity, stops at a gap', () => {
  assert.equal(streak({ '2026-10-26': 60, '2026-10-27': 60 }, new Date(at)), 2);
  assert.equal(streak({ '2026-10-26': 60 }, new Date(at)), 0);
  assert.equal(streak({}, new Date(at)), 0);
});
