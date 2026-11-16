import { contentLocaleFor, type Exercise, type Locale } from '../../../packages/core/src';
import { content } from './state';

/** Select one translation direction per learner language so a lesson never requires all three. */
export function selectExercises(exercises: Exercise[], locale: Locale): Exercise[] {
  const direction = locale === 'ar' ? 'ar-zh' : locale === 'es' ? 'es-zh' : 'en-zh';
  return exercises.filter(
    (e) => !['en-zh', 'ar-zh', 'es-zh'].includes(e.kind) || e.kind === direction,
  );
}

/** Keep the source record immutable while adapting meaning questions to the display language. */
export function localizeExercise(exercise: Exercise, locale: Locale): Exercise {
  // Content translations exist for en/zh/ar/es; fr/ja read English.
  const cl = contentLocaleFor(locale);
  const word = content.vocabulary.find((v) => v.id === exercise.itemId);
  const localized = exercise.stimulusLocalized?.[cl];
  const result = { ...exercise, stimulus: localized ?? exercise.stimulus };
  if (!word) return result;
  const choices = content.vocabulary.filter((v) => v.level === word.level);
  if (exercise.kind === 'multiple-choice') {
    result.options = choices.map((v) => v.translation[cl]);
    result.answers = [word.translation[cl]];
  } else if (exercise.kind === 'zh-en') {
    result.answers = word.translation[cl].split(/[;；]/).map((s) => s.trim());
  } else if (exercise.kind === 'recognition' || (exercise.kind === 'en-zh' && locale === 'zh')) {
    result.stimulus = word.translation[cl];
  }
  return result;
}
