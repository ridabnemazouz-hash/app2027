import type { Curriculum, Exercise, LearningEvent, Preferences } from './schema';

export type Review = {
  repetitions: number;
  interval: number;
  ease: number;
  reviews: number;
  correct: number;
  incorrect: number;
  lastReview: string;
  nextReview: string;
  status: 'learning' | 'review';
};
/** SM-2 style: failures retry after 10 min; successful intervals 1d,6d,then interval*ease. */
export function schedule(previous: Review | undefined, quality: number, at: string): Review {
  if (!Number.isInteger(quality) || quality < 0 || quality > 5 || !Number.isFinite(Date.parse(at)))
    throw new Error('Invalid review');
  const success = quality >= 3;
  // Repeated successful answers in one study session are useful practice but
  // must not artificially multiply the interval before the item is due.
  if (previous && success && Date.parse(at) < Date.parse(previous.nextReview)) {
    return {
      ...previous,
      reviews: previous.reviews + 1,
      correct: previous.correct + 1,
      lastReview: at,
    };
  }
  const repetitions = success ? (previous?.repetitions ?? 0) + 1 : 0;
  const ease = Math.max(
    1.3,
    (previous?.ease ?? 2.5) + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
  );
  const interval = !success
    ? 10 / 1440
    : repetitions === 1
      ? 1
      : repetitions === 2
        ? 6
        : Math.round((previous?.interval ?? 6) * ease);
  return {
    repetitions,
    interval,
    ease,
    reviews: (previous?.reviews ?? 0) + 1,
    correct: (previous?.correct ?? 0) + (success ? 1 : 0),
    incorrect: (previous?.incorrect ?? 0) + (success ? 0 : 1),
    lastReview: at,
    nextReview: new Date(Date.parse(at) + interval * 86400000).toISOString(),
    status: success ? 'review' : 'learning',
  };
}
export const normalizeAnswer = (s: string) =>
  s
    .normalize('NFC')
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s，。！？,.!?;；:：]/gu, '');
export function checkAnswer(exercise: Exercise, answer: string): boolean {
  return (
    exercise.assessment === 'automatic' &&
    normalizeAnswer(answer).length > 0 &&
    exercise.answers.some((a) => normalizeAnswer(a) === normalizeAnswer(answer))
  );
}
export function mergeEvents(local: LearningEvent[], remote: LearningEvent[]): LearningEvent[] {
  const map = new Map<string, LearningEvent>();
  // Existing immutable event wins; backend rejects ID reuse with changed payload.
  for (const e of [...local, ...remote]) if (!map.has(e.id)) map.set(e.id, e);
  return [...map.values()].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
}
export function deriveProgress(events: LearningEvent[]) {
  const reviews: Record<string, Review> = {};
  const learned = new Set<string>();
  const favorites = new Set<string>();
  const bookmarks = new Set<string>();
  const lessons = new Set<string>();
  const readings = new Set<string>();
  const activity: Record<string, number> = {};
  const skills: Record<string, { correct: number; total: number }> = {};
  let correct = 0,
    total = 0;
  let writings = 0;
  const ordered = mergeEvents(events, []);
  let resetIndex = -1;
  for (let i = ordered.length - 1; i >= 0; i--) {
    if (ordered[i]?.type === 'reset') {
      resetIndex = i;
      break;
    }
  }
  for (const e of ordered.slice(resetIndex + 1)) {
    const day = e.at.slice(0, 10);
    if (e.seconds) activity[day] = (activity[day] ?? 0) + e.seconds;
    if (e.type === 'answer') {
      reviews[e.itemId] = schedule(reviews[e.itemId], e.quality ?? 0, e.at);
      if (e.skill !== 'self') {
        total++;
        if (e.correct) correct++;
        const skill = skills[e.skill ?? 'vocabulary'] ?? { correct: 0, total: 0 };
        skill.total++;
        if (e.correct) skill.correct++;
        skills[e.skill ?? 'vocabulary'] = skill;
      }
    }
    if (e.type === 'lesson') lessons.add(e.itemId);
    if (e.type === 'reading') readings.add(e.itemId);
    if (e.type === 'writing') writings++;
    for (const [type, set] of [
      ['favorite', favorites],
      ['learned', learned],
      ['bookmark', bookmarks],
    ] as const)
      if (e.type === type) {
        if (e.value) set.add(e.itemId);
        else set.delete(e.itemId);
      }
  }
  return {
    reviews,
    learned,
    favorites,
    bookmarks,
    lessons,
    readings,
    activity,
    skills,
    correct,
    total,
    writings,
  };
}
export const defaultPreferences: Preferences = {
  locale: 'en',
  targetLevel: 1,
  dailyMinutes: 10,
  goal: 'travel',
  theme: 'light',
  onboarded: false,
};
export function streak(activity: Record<string, number>, now = new Date()): number {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let count = 0;
  if (!activity[d.toISOString().slice(0, 10)]) d.setUTCDate(d.getUTCDate() - 1);
  while (activity[d.toISOString().slice(0, 10)]) {
    count++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return count;
}
export function getLessons(curriculum: Curriculum) {
  return curriculum.stages.flatMap((s) =>
    s.levels.flatMap((l) => l.units.flatMap((u) => u.lessons)),
  );
}
export function dueItems(events: LearningEvent[], at = new Date().toISOString()) {
  return Object.entries(deriveProgress(events).reviews)
    .filter(([, r]) => r.nextReview <= at)
    .map(([id]) => id);
}
