import type { Locale } from '../../../packages/core/src';
const partLabels: Record<string, Record<Locale, string>> = {
  expression: {
    en: 'expression',
    zh: '表达',
    ar: 'تعبير',
    es: 'expresión',
    fr: 'expression',
    ja: '表現',
  },
  pronoun: { en: 'pronoun', zh: '代词', ar: 'ضمير', es: 'pronombre', fr: 'pronom', ja: '代名詞' },
  verb: { en: 'verb', zh: '动词', ar: 'فعل', es: 'verbo', fr: 'verbe', ja: '動詞' },
  noun: { en: 'noun', zh: '名词', ar: 'اسم', es: 'sustantivo', fr: 'nom', ja: '名詞' },
  conjunction: {
    en: 'conjunction',
    zh: '连词',
    ar: 'أداة ربط',
    es: 'conjunción',
    fr: 'conjonction',
    ja: '接続詞',
  },
  adverb: { en: 'adverb', zh: '副词', ar: 'ظرف', es: 'adverbio', fr: 'adverbe', ja: '副詞' },
  'adverb/verb': {
    en: 'adverb/verb',
    zh: '副词／动词',
    ar: 'ظرف / فعل',
    es: 'adverbio / verbo',
    fr: 'adverbe / verbe',
    ja: '副詞／動詞',
  },
  'noun/verb': {
    en: 'noun/verb',
    zh: '名词／动词',
    ar: 'اسم / فعل',
    es: 'sustantivo / verbo',
    fr: 'nom / verbe',
    ja: '名詞／動詞',
  },
  preposition: {
    en: 'preposition',
    zh: '介词',
    ar: 'حرف جر',
    es: 'preposición',
    fr: 'préposition',
    ja: '前置詞',
  },
  adjective: {
    en: 'adjective',
    zh: '形容词',
    ar: 'صفة',
    es: 'adjetivo',
    fr: 'adjectif',
    ja: '形容詞',
  },
  idiom: {
    en: 'idiom',
    zh: '成语',
    ar: 'تعبير اصطلاحي',
    es: 'expresión idiomática',
    fr: 'expression idiomatique',
    ja: '慣用句',
  },
};
export function partOfSpeechLabel(value: string, locale: Locale): string {
  return partLabels[value]?.[locale] ?? value;
}
