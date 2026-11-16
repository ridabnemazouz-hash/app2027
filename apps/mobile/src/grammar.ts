import type { Locale } from '../../../packages/core/src';
const partLabels: Record<string, Record<Locale, string>> = {
  expression: { en: 'expression', zh: '表达', ar: 'تعبير', es: 'expresión' },
  pronoun: { en: 'pronoun', zh: '代词', ar: 'ضمير', es: 'pronombre' },
  verb: { en: 'verb', zh: '动词', ar: 'فعل', es: 'verbo' },
  noun: { en: 'noun', zh: '名词', ar: 'اسم', es: 'sustantivo' },
  conjunction: { en: 'conjunction', zh: '连词', ar: 'أداة ربط', es: 'conjunción' },
  adverb: { en: 'adverb', zh: '副词', ar: 'ظرف', es: 'adverbio' },
  'adverb/verb': { en: 'adverb/verb', zh: '副词／动词', ar: 'ظرف / فعل', es: 'adverbio / verbo' },
  'noun/verb': { en: 'noun/verb', zh: '名词／动词', ar: 'اسم / فعل', es: 'sustantivo / verbo' },
  preposition: { en: 'preposition', zh: '介词', ar: 'حرف جر', es: 'preposición' },
  adjective: { en: 'adjective', zh: '形容词', ar: 'صفة', es: 'adjetivo' },
  idiom: { en: 'idiom', zh: '成语', ar: 'تعبير اصطلاحي', es: 'expresión idiomática' },
};
export function partOfSpeechLabel(value: string, locale: Locale): string {
  return partLabels[value]?.[locale] ?? value;
}
