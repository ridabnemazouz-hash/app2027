import type { Exercise, Lesson } from '../../../packages/core/src';
import { lexicon, type LexiconWord } from './lexicon';

// These are HanziGo study groupings, not official lesson boundaries.
const pools = Array.from({ length: 9 }, (_, i) =>
  lexicon.filter((w) => w.reference && w.level === i + 1),
);
const chunkSize = 12;
export function referenceLessons(level: number) {
  const pool = pools[level - 1] ?? [];
  return Array.from({ length: Math.ceil(pool.length / chunkSize) }, (_, i) => ({
    id: `reference-${level}-${i + 1}`,
    level,
    number: i + 1,
    count: Math.min(chunkSize, pool.length - i * chunkSize),
  }));
}
function labels(number: number) {
  return {
    en: `Reference lesson ${number}`,
    zh: `参考课程 ${number}`,
    ar: `درس مرجعي ${number}`,
    es: `Lección de referencia ${number}`,
  };
}
const objective = {
  en: 'Study source vocabulary and practise meanings and pinyin.',
  zh: '学习参考词汇并练习英文释义和拼音。',
  ar: 'تعلّم مفردات المرجع وتدرّب على المعاني الإنجليزية والبينيين.',
  es: 'Estudia el vocabulario de referencia y practica significados en inglés y pinyin.',
};
const meaningPrompt = {
  en: 'Choose the English meaning',
  zh: '选择英文释义',
  ar: 'اختر المعنى الإنجليزي',
  es: 'Elige el significado en inglés',
};
const pinyinPrompt = {
  en: 'Choose the pinyin',
  zh: '选择拼音',
  ar: 'اختر البينيين',
  es: 'Elige el pinyin',
};
function choices(pool: LexiconWord[], index: number, field: 'pinyin' | 'meaning') {
  const get = (w: LexiconWord) => (field === 'pinyin' ? w.pinyin : w.translation.en);
  const correct = get(pool[index]!);
  const result = [correct];
  for (let offset = 1; offset < pool.length && result.length < 4; offset++) {
    const other = get(pool[(index + offset) % pool.length]!);
    if (!result.includes(other)) result.push(other);
  }
  // Deterministic placement so resumed lessons do not change their options.
  const shift = index % result.length;
  return [...result.slice(shift), ...result.slice(0, shift)];
}
export function getReferenceLesson(id: string): Lesson | undefined {
  const match = /^reference-([1-9])-(\d+)$/.exec(id);
  if (!match) return undefined;
  const level = Number(match[1]),
    number = Number(match[2]),
    pool = pools[level - 1]!;
  if (number < 1 || number > Math.ceil(pool.length / chunkSize)) return undefined;
  const start = (number - 1) * chunkSize,
    words = pool.slice(start, start + chunkSize);
  const exercises: Exercise[] = words.flatMap((word, offset) =>
    (['meaning', 'pinyin'] as const).map((field) => {
      const answer = field === 'meaning' ? word.translation.en : word.pinyin;
      const fact = `${word.simplified} · ${word.pinyin} — ${word.translation.en}`;
      return {
        id: `${word.id}-${field}`,
        kind: 'multiple-choice',
        itemId: word.id,
        skill: 'vocabulary',
        prompt: field === 'meaning' ? meaningPrompt : pinyinPrompt,
        stimulus: word.simplified,
        answers: [answer],
        options: choices(pool, start + offset, field),
        explanation: { en: fact, zh: fact, ar: fact, es: fact },
        audio: null,
        assessment: 'automatic',
      };
    }),
  );
  return {
    id,
    title: labels(number),
    objective,
    vocabularyIds: words.map((w) => w.id),
    grammarIds: [],
    characterIds: [],
    exercises,
    estimatedMinutes: 8,
  };
}
