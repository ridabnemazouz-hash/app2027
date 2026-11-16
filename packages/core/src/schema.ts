import { z } from 'zod';

/** Interface locales the product supports. */
export const localeSchema = z.enum(['en', 'zh', 'ar', 'es', 'fr', 'ja']);
export type Locale = z.infer<typeof localeSchema>;
/**
 * Locales with actual curriculum content translations. Interface
 * locales beyond these (fr, ja) fall back to English content; the
 * fallback is explicit in the client, never a missing-key crash.
 */
export const contentLocaleSchema = z.enum(['en', 'zh', 'ar', 'es']);
export type ContentLocale = z.infer<typeof contentLocaleSchema>;
export const contentLocaleFor = (locale: Locale): ContentLocale =>
  locale === 'fr' || locale === 'ja' ? 'en' : locale;
export const localizedSchema = z.object({
  en: z.string().min(1),
  zh: z.string().min(1),
  ar: z.string().min(1),
  es: z.string().min(1),
});
export type Localized = z.infer<typeof localizedSchema>;
export const levelSchema = z.number().int().min(1).max(9);
const pinyin = z
  .string()
  .min(1)
  .refine(
    (s) => /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüêńňǹḿ\s'’.,!?;:·-]+$/iu.test(s.normalize('NFC')),
    'Pinyin must use letters and tone marks, not numbers or Hanzi',
  );
export const sourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url().optional(),
  edition: z.string().min(1),
  retrievedAt: z.string().date(),
  license: z.string().min(1),
  official: z.boolean(),
  validation: z.enum(['needs-review', 'verified']),
  notes: z.string(),
});
const baseItem = z.object({
  id: z.string().min(1),
  level: levelSchema,
  levelRange: z.tuple([levelSchema, levelSchema]),
  sourceId: z.string().min(1),
  validation: z.enum(['needs-review', 'verified']),
  tags: z.array(z.string()),
  audio: z.string().url().nullable(),
});
export const exampleSchema = z.object({
  chinese: z.string().min(1),
  pinyin,
  translation: localizedSchema,
  audio: z.string().url().nullable(),
});
export const vocabularySchema = baseItem.extend({
  simplified: z.string().min(1),
  traditional: z.string().optional(),
  pinyin,
  translation: localizedSchema,
  partOfSpeech: z.string(),
  topic: z.string(),
  examples: z.array(exampleSchema).min(1),
  usageNotes: localizedSchema.optional(),
  classifiers: z.array(z.string()).optional(),
  synonyms: z.array(z.string()).optional(),
  antonyms: z.array(z.string()).optional(),
});
export type Vocabulary = z.infer<typeof vocabularySchema>;
export const grammarSchema = baseItem.extend({
  point: localizedSchema,
  structure: z.string(),
  structureLocalized: localizedSchema.optional(),
  explanation: localizedSchema,
  commonMistake: localizedSchema,
  examples: z.array(exampleSchema).min(1),
});
export const characterSchema = baseItem.extend({
  character: z.string().length(1),
  pinyin,
  meaning: localizedSchema,
  strokeCount: z.number().int().positive().nullable(),
  radical: z.string().nullable(),
  strokeOrder: z.string().url().nullable(),
  vocabularyIds: z.array(z.string()),
});
export const exerciseKinds = [
  'multiple-choice',
  'zh-en',
  'en-zh',
  'ar-zh',
  'es-zh',
  'pinyin-character',
  'character-pinyin',
  'word-order',
  'sentence-completion',
  'listening',
  'reading',
  'fill-blank',
  'tone',
  'recognition',
  'flashcard',
  'typing',
  'writing',
  'speaking',
] as const;
export const exerciseSchema = z.object({
  id: z.string(),
  kind: z.enum(exerciseKinds),
  itemId: z.string(),
  skill: z.enum(['vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'writing']),
  prompt: localizedSchema,
  stimulus: z.string(),
  stimulusLocalized: localizedSchema.optional(),
  answers: z.array(z.string()).min(1),
  options: z.array(z.string()).optional(),
  explanation: localizedSchema,
  audio: z.string().url().nullable(),
  assessment: z.enum(['automatic', 'self']),
});
export type Exercise = z.infer<typeof exerciseSchema>;
export const lessonSchema = z.object({
  id: z.string(),
  title: localizedSchema,
  objective: localizedSchema,
  vocabularyIds: z.array(z.string()).min(1),
  grammarIds: z.array(z.string()),
  characterIds: z.array(z.string()),
  exercises: z.array(exerciseSchema).min(1),
  estimatedMinutes: z.number().positive(),
});
export type Lesson = z.infer<typeof lessonSchema>;
export const readingSchema = z.object({
  id: z.string(),
  level: levelSchema,
  title: localizedSchema,
  sourceId: z.string(),
  paragraphs: z.array(exampleSchema),
  vocabularyIds: z.array(z.string()),
  exercises: z.array(exerciseSchema).min(1),
});
export const curriculumSchema = z.object({
  version: z.string(),
  framework: z.object({
    target: z.string(),
    edition: z.string(),
    advancedSourceRange: z.literal('7-9'),
    officialContentImported: z.boolean(),
  }),
  sources: z.array(sourceSchema).min(1),
  vocabulary: z.array(vocabularySchema),
  grammar: z.array(grammarSchema),
  characters: z.array(characterSchema),
  readings: z.array(readingSchema),
  stages: z
    .array(
      z.object({
        id: z.string(),
        title: localizedSchema,
        levels: z
          .array(
            z.object({
              number: levelSchema,
              title: localizedSchema,
              description: localizedSchema,
              objectives: z.array(localizedSchema),
              sourceRange: z.string(),
              units: z
                .array(
                  z.object({
                    id: z.string(),
                    title: localizedSchema,
                    lessons: z.array(lessonSchema).min(1),
                  }),
                )
                .min(1),
            }),
          )
          .min(1),
      }),
    )
    .length(3),
});
export type Curriculum = z.infer<typeof curriculumSchema>;
export const preferencesSchema = z.object({
  locale: localeSchema,
  targetLevel: levelSchema,
  dailyMinutes: z.number().int().min(5).max(120),
  goal: z.enum(['travel', 'study', 'work', 'culture']),
  theme: z.enum(['light', 'dark', 'system']),
  onboarded: z.boolean(),
});
export type Preferences = z.infer<typeof preferencesSchema>;
export const eventSchema = z
  .object({
    id: z.string().uuid(),
    at: z.string().datetime(),
    type: z.enum([
      'answer',
      'lesson',
      'favorite',
      'learned',
      'bookmark',
      'reading',
      'writing',
      'reset',
      'exam',
    ]),
    itemId: z.string().max(100),
    correct: z.boolean().optional(),
    quality: z.number().int().min(0).max(5).optional(),
    value: z.boolean().optional(),
    // Closed set: the six exercise skills plus 'self' for self-assessed
    // recall. Arbitrary strings would create meaningless progress buckets.
    skill: z
      .enum(['vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'writing', 'self'])
      .optional(),
    seconds: z.number().int().min(0).max(3600).optional(),
    // Practice-exam attempts only: HanziGo 300-point total and its
    // per-section points (listening/reading/grammar, 100 each).
    score: z.number().min(0).max(300).optional(),
    sections: z
      .object({
        listening: z.number().min(0).max(100),
        reading: z.number().min(0).max(100),
        grammar: z.number().min(0).max(100),
      })
      .optional(),
  })
  .superRefine((e, ctx) => {
    if (e.type === 'answer' && (e.correct === undefined || e.quality === undefined))
      ctx.addIssue({ code: 'custom', message: 'Answers require correct and quality' });
    if (e.type === 'exam' && (e.score === undefined || e.sections === undefined))
      ctx.addIssue({ code: 'custom', message: 'Exam attempts require score and sections' });
    if (
      e.type === 'exam' &&
      e.score !== undefined &&
      e.sections !== undefined &&
      Math.abs(e.score - (e.sections.listening + e.sections.reading + e.sections.grammar)) > 0.51
    )
      ctx.addIssue({ code: 'custom', message: 'Exam score must equal the sum of its sections' });
  });
export type LearningEvent = z.infer<typeof eventSchema>;
