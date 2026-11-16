import { checkAnswer } from './learning';
import type { ContentLocale, Curriculum, Exercise, Localized } from './schema';

/**
 * HanziGo practice exams. This is a HanziGo practice format, NOT an
 * official HSK exam: no alignment to an official exam edition has
 * been established, and scores are not comparable to official
 * results.
 *
 * Documented 300-point model:
 * - Three sections — Listening, Reading, Grammar & Vocabulary —
 *   worth 100 points each (300 total).
 * - A section's points are `round(100 * correct / questions)` in
 *   that section, so sections with different question counts are
 *   weighted equally. Unanswered questions count as incorrect.
 * - Questions come only from real, already-shipped content at the
 *   chosen level: listening items are synthesized from the level's
 *   vocabulary example sentences and reading paragraphs (played with
 *   recorded audio when available, otherwise the device voice);
 *   reading items pair each paragraph with a translation choice plus
 *   the reading's own comprehension exercise; grammar & vocabulary
 *   items are the level's stored automatic exercises.
 * - Suggested time: 30 minutes. The client enforces it as a soft
 *   limit (auto-submit) and stores one `exam` event per attempt.
 */
export type ExamSectionKey = 'listening' | 'reading' | 'grammar';
export type PracticeExam = {
  id: string;
  level: number;
  minutes: number;
  sections: { key: ExamSectionKey; exercises: Exercise[] }[];
};
export type ExamScore = {
  total: number;
  sections: Record<ExamSectionKey, number>;
  correct: Record<ExamSectionKey, number>;
  counts: Record<ExamSectionKey, number>;
};

const hearPrompt: Localized = {
  en: 'Choose the meaning you hear',
  zh: '选择你听到的意思',
  ar: 'اختر المعنى الذي تسمعه',
  es: 'Elige el significado que escuchas',
};
const readPrompt: Localized = {
  en: 'Choose the correct translation of this passage',
  zh: '选择这段话的正确翻译',
  ar: 'اختر الترجمة الصحيحة لهذا المقطع',
  es: 'Elige la traducción correcta de este pasaje',
};

function synthesized(
  id: string,
  skill: 'listening' | 'reading',
  prompt: Localized,
  chinese: string,
  pinyin: string,
  correct: string,
  distractors: string[],
): Exercise {
  return {
    id,
    kind: skill,
    itemId: id,
    skill,
    prompt,
    stimulus: chinese,
    audio: null,
    options: [correct, ...distractors],
    answers: [correct],
    explanation: {
      en: `Transcript: ${chinese} (${pinyin})`,
      zh: `原文：${chinese} (${pinyin})`,
      ar: `النص: ${chinese} (${pinyin})`,
      es: `Transcripción: ${chinese} (${pinyin})`,
    },
    assessment: 'automatic',
  };
}

export function buildPracticeExam(
  curriculum: Curriculum,
  level: number,
  contentLocale: ContentLocale,
): PracticeExam {
  const vocab = curriculum.vocabulary.filter((v) => v.level === level);
  const readings = curriculum.readings.filter((r) => r.level === level);
  // Listening pool: vocabulary example sentences, then paragraphs.
  const listeningPool = [
    ...vocab.map((v) => ({
      chinese: v.examples[0]!.chinese,
      pinyin: v.examples[0]!.pinyin,
      translation: v.examples[0]!.translation[contentLocale],
    })),
    ...readings.flatMap((r) =>
      r.paragraphs.map((p) => ({
        chinese: p.chinese,
        pinyin: p.pinyin,
        translation: p.translation[contentLocale],
      })),
    ),
  ];
  const listening = listeningPool.map((item, i) =>
    synthesized(
      `exam-l-${level}-${i}`,
      'listening',
      hearPrompt,
      item.chinese,
      item.pinyin,
      item.translation,
      [1, 3, 5].map((k) => listeningPool[(i + k) % listeningPool.length]!.translation),
    ),
  );
  // Reading: one translation question per paragraph + the readings'
  // own comprehension exercises.
  const paragraphs = readings.flatMap((r) => r.paragraphs);
  const readingSynth = paragraphs.map((p, i) =>
    synthesized(
      `exam-r-${level}-${i}`,
      'reading',
      readPrompt,
      p.chinese,
      p.pinyin,
      p.translation[contentLocale],
      [1, 2, 3].map((k) => paragraphs[(i + k) % paragraphs.length]!.translation[contentLocale]),
    ),
  );
  const readingStored = readings.flatMap((r) => r.exercises);
  // Grammar & vocabulary: the level's stored automatic exercises,
  // grammar first, in the learner's translation direction.
  const direction = contentLocale === 'ar' ? 'ar-zh' : contentLocale === 'es' ? 'es-zh' : 'en-zh';
  const stored = curriculum.stages
    .flatMap((s) => s.levels)
    .filter((l) => l.number === level)
    .flatMap((l) => l.units)
    .flatMap((u) => u.lessons)
    .flatMap((les) => les.exercises)
    .filter(
      (e) =>
        e.assessment === 'automatic' &&
        (e.skill === 'grammar' || e.skill === 'vocabulary') &&
        (!['en-zh', 'ar-zh', 'es-zh'].includes(e.kind) || e.kind === direction),
    )
    .sort((a, b) => a.id.localeCompare(b.id));
  const grammar = [
    ...stored.filter((e) => e.skill === 'grammar'),
    ...stored.filter((e) => e.skill === 'vocabulary'),
  ].slice(0, 12);
  return {
    id: `exam-hsk${level}`,
    level,
    minutes: 30,
    sections: [
      { key: 'listening', exercises: listening },
      { key: 'reading', exercises: [...readingSynth, ...readingStored] },
      { key: 'grammar', exercises: grammar },
    ],
  };
}

export function scoreExam(exam: PracticeExam, answers: Record<string, string>): ExamScore {
  const sections = { listening: 0, reading: 0, grammar: 0 } as Record<ExamSectionKey, number>;
  const correct = { listening: 0, reading: 0, grammar: 0 } as Record<ExamSectionKey, number>;
  const counts = { listening: 0, reading: 0, grammar: 0 } as Record<ExamSectionKey, number>;
  for (const section of exam.sections) {
    counts[section.key] = section.exercises.length;
    correct[section.key] = section.exercises.filter((e) =>
      checkAnswer(e, answers[e.id] ?? ''),
    ).length;
    sections[section.key] = section.exercises.length
      ? Math.round((100 * correct[section.key]) / section.exercises.length)
      : 0;
  }
  return {
    total: sections.listening + sections.reading + sections.grammar,
    sections,
    correct,
    counts,
  };
}
