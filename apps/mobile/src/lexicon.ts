import type { Locale, Vocabulary } from '../../../packages/core/src';
import dataset from '../../../data/curriculum/hsk3-gushi-2025/words.json';
import { content } from './state';

export type LexiconWord = Omit<
  Vocabulary,
  'translation' | 'traditional' | 'partOfSpeech' | 'topic'
> & {
  translation: { en: string; zh?: string; ar?: string; es?: string };
  traditional?: string;
  partOfSpeech: string;
  topic: string;
  searchIndex: string;
  reference: boolean;
};
export const normalizeSearch = (value: string) =>
  value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();
const referenceWords: LexiconWord[] = dataset.words.map((row) => ({
  id: row.id,
  level: row.targetLevel,
  levelRange: row.sourceRange as [number, number],
  sourceId: 'gushi-hsk3-2025',
  validation: 'needs-review',
  tags: ['reference'],
  audio: null,
  simplified: row.hanzi,
  pinyin: row.pinyin,
  translation: { en: row.meaningEn },
  partOfSpeech: '',
  topic: '',
  examples: [],
  searchIndex: normalizeSearch(`${row.hanzi} ${row.pinyin} ${row.meaningEn}`),
  reference: true,
}));
export const lexicon: LexiconWord[] = [
  ...content.vocabulary.map((v) => ({
    ...v,
    reference: false,
    searchIndex: normalizeSearch(
      `${v.simplified} ${v.traditional ?? ''} ${v.pinyin} ${Object.values(v.translation).join(' ')}`,
    ),
  })),
  ...referenceWords,
];
const byId = new Map(lexicon.map((word) => [word.id, word]));
export function findWord(id: string | undefined) {
  return id ? byId.get(id) : undefined;
}
export function wordMeaning(word: LexiconWord, locale: Locale) {
  return word.translation[locale] || word.translation.en;
}
export function missingTranslation(word: LexiconWord, locale: Locale) {
  return locale !== 'en' && !word.translation[locale];
}
export const referenceSummary = dataset.summary;
