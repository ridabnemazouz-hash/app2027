import { curriculumSchema, type Curriculum } from './schema';

export function validateCurriculum(
  input: unknown,
):
  { ok: true; data: Curriculum; report: Record<string, number> } | { ok: false; errors: string[] } {
  const parsed = curriculumSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    };
  const data = parsed.data,
    errors: string[] = [];
  const ids = new Set<string>();
  const lexemes = new Set<string>();
  for (const v of data.vocabulary) {
    const key = `${v.level}:${v.simplified}:${v.pinyin}`;
    if (lexemes.has(key)) errors.push(`Duplicate vocabulary: ${key}`);
    lexemes.add(key);
  }
  const add = (id: string) => {
    if (ids.has(id)) errors.push(`Duplicate id: ${id}`);
    ids.add(id);
  };
  const sourceIds = new Set(data.sources.map((s) => s.id));
  const vocabIds = new Set(data.vocabulary.map((v) => v.id)),
    grammarIds = new Set(data.grammar.map((v) => v.id)),
    characterIds = new Set(data.characters.map((v) => v.id));
  const items = new Set([...vocabIds, ...grammarIds, ...characterIds]);
  for (const s of data.sources) add(s.id);
  for (const i of [...data.vocabulary, ...data.grammar, ...data.characters]) {
    add(i.id);
    if (!sourceIds.has(i.sourceId)) errors.push(`Missing source ${i.sourceId}`);
    if (i.levelRange[0] > i.levelRange[1] || i.level < i.levelRange[0] || i.level > i.levelRange[1])
      errors.push(`Invalid level range ${i.id}`);
    if (
      i.validation === 'verified' &&
      data.sources.find((s) => s.id === i.sourceId)?.validation !== 'verified'
    )
      errors.push(`Unverified source for verified record ${i.id}`);
  }
  const exercise = (e: Curriculum['readings'][number]['exercises'][number]) => {
    add(e.id);
    if (!items.has(e.itemId)) errors.push(`Unknown exercise item ${e.itemId}`);
    if (e.kind === 'listening' && !e.audio) errors.push(`Listening exercise lacks audio: ${e.id}`);
    if (
      e.assessment === 'automatic' &&
      e.kind !== 'word-order' &&
      e.options &&
      !e.answers.some((a) => e.options?.includes(a))
    )
      errors.push(`No matching option: ${e.id}`);
  };
  let units = 0,
    lessons = 0,
    exercises = 0;
  const levels = new Set<number>();
  for (const stage of data.stages) {
    add(stage.id);
    for (const level of stage.levels) {
      if (levels.has(level.number)) errors.push(`Duplicate level ${level.number}`);
      levels.add(level.number);
      for (const unit of level.units) {
        add(unit.id);
        units++;
        for (const lesson of unit.lessons) {
          add(lesson.id);
          lessons++;
          for (const [refs, available] of [
            [lesson.vocabularyIds, vocabIds],
            [lesson.grammarIds, grammarIds],
            [lesson.characterIds, characterIds],
          ] as const)
            for (const id of refs) if (!available.has(id)) errors.push(`Missing lesson item ${id}`);
          for (const e of lesson.exercises) {
            exercise(e);
            exercises++;
          }
        }
      }
    }
  }
  for (const c of data.characters)
    for (const id of c.vocabularyIds)
      if (!vocabIds.has(id)) errors.push(`Missing character vocabulary ${id}`);
  for (const r of data.readings) {
    add(r.id);
    if (!sourceIds.has(r.sourceId)) errors.push(`Missing reading source ${r.id}`);
    for (const id of r.vocabularyIds)
      if (!vocabIds.has(id)) errors.push(`Missing reading vocabulary ${id}`);
    for (const e of r.exercises) {
      exercise(e);
      exercises++;
    }
  }
  if (levels.size !== 9) errors.push('All nine levels must be represented');
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    data,
    report: {
      vocabulary: data.vocabulary.length,
      grammar: data.grammar.length,
      characters: data.characters.length,
      populatedLevels: levels.size,
      units,
      lessons,
      exercises,
      readings: data.readings.length,
      verifiedRecords: [...data.vocabulary, ...data.grammar, ...data.characters].filter(
        (i) => i.validation === 'verified',
      ).length,
    },
  };
}
