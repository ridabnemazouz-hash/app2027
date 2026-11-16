import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { getLessons, type Locale } from '../../../../packages/core/src';
import { content, useLearning } from '../state';
import { findWord, missingTranslation, wordMeaning } from '../lexicon';
import { getReferenceLesson } from '../reference-lessons';
import { partOfSpeechLabel } from '../grammar';
import { storage } from '../storage';
import { ExercisePlayer } from '../exercise';
import { selectExercises, localizeExercise } from '../localized-exercise';
import { Pronunciation } from '../audio';
import { Badge, Button, Card, Empty, Heading, Meter, Row, Shell, Txt, usePalette } from '../ui';
type Draft = {
  phase: 'intro' | 'practice' | 'done';
  index: number;
  locale?: Locale;
  answers: Record<string, { answer: string; correct: boolean }>;
};
const fresh: Draft = { phase: 'intro', index: 0, answers: {} };
export function LessonScreen({ id }: { id: string }) {
  const s = useLearning(),
    c = usePalette(),
    lesson = getLessons(content).find((l) => l.id === id) ?? getReferenceLesson(id),
    [draft, setDraft] = useState<Draft>(fresh),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [saveError, setSaveError] = useState(false);
  const key = `draft:${s.owner}:${id}`;
  useEffect(() => {
    let active = true;
    void storage
      .get<Draft>(key)
      .then((saved) => {
        if (active) {
          setDraft(saved ?? fresh);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setSaveError(true);
          setLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [key]);
  async function update(d: Draft) {
    await storage.set(key, d);
    setDraft(d);
  }
  if (!lesson)
    return (
      <Shell>
        <Empty title={s.t('noLesson')} />
      </Shell>
    );
  const exercises = selectExercises(lesson.exercises, draft.locale ?? s.locale);
  const words = lesson.vocabularyIds.map(findWord).filter((v) => v !== undefined);
  const grammar = content.grammar.filter((g) => lesson.grammarIds.includes(g.id));
  const rawExercise = exercises[draft.index];
  const exercise = rawExercise
    ? localizeExercise(rawExercise, draft.locale ?? s.locale)
    : undefined;
  const answered = exercise ? draft.answers[exercise.id] : undefined;
  const score = exercises.filter((e) => draft.answers[e.id]?.correct).length;
  async function next() {
    if (busy || !lesson) return;
    setBusy(true);
    try {
      if (draft.phase === 'intro') await update({ ...draft, phase: 'practice', locale: s.locale });
      else if (draft.index < exercises.length - 1)
        await update({ ...draft, index: draft.index + 1 });
      else if (exercises.every((e) => draft.answers[e.id])) {
        await s.record({ type: 'lesson', itemId: lesson.id });
        await update({ ...draft, phase: 'done' });
      }
    } catch {
      setSaveError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell active="/learn" noNav>
      <View style={{ maxWidth: 820, width: '100%', alignSelf: 'center', gap: 22 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Button
            label={s.t('pause')}
            variant="ghost"
            small
            onPress={() => router.replace('/learn')}
            icon="close-outline"
          />
          <Badge>
            {s.t(
              draft.phase === 'intro'
                ? 'intro'
                : draft.phase === 'done'
                  ? 'results'
                  : 'practiceStep',
            )}
          </Badge>
        </Row>
        <Meter
          value={
            draft.phase === 'intro'
              ? 0
              : draft.phase === 'done'
                ? 1
                : (draft.index + 1) / exercises.length
          }
          color={c.red}
        />
        <Heading
          eyebrow={`HANZIGO · ${s.t('lesson')}`}
          title={s.localize(lesson.title)}
          subtitle={s.localize(lesson.objective)}
        />
        {!loaded ? (
          <Txt>{s.t('loading')}</Txt>
        ) : draft.phase === 'intro' ? (
          <>
            <Txt color={c.muted}>
              {id.startsWith('reference-') ? s.localize(lesson.objective) : s.t('lessonInfo')}
            </Txt>
            {words.map((v) => (
              <Card key={v.id}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt mandarin serif size={40}>
                    {v.simplified}
                  </Txt>
                  <Badge>
                    {v.partOfSpeech
                      ? partOfSpeechLabel(v.partOfSpeech, s.locale)
                      : s.t('referenceWords')}
                  </Badge>
                </Row>
                <Txt mandarin color={c.red} size={19}>
                  {v.pinyin}
                </Txt>
                <Txt size={19}>{wordMeaning(v, s.locale)}</Txt>
                {missingTranslation(v, s.locale) ? (
                  <Txt size={11} color={c.muted}>
                    {s.t('englishOnly')}
                  </Txt>
                ) : null}
                <Pronunciation text={v.simplified} audio={v.audio} />
                {v.examples.map((e, i) => (
                  <View
                    key={i}
                    style={{ gap: 7, padding: 16, backgroundColor: c.soft, borderRadius: 12 }}
                  >
                    <Txt mandarin size={21}>
                      {e.chinese}
                    </Txt>
                    <Txt mandarin color={c.muted} size={12}>
                      {e.pinyin}
                    </Txt>
                    <Txt size={13}>{s.localize(e.translation)}</Txt>
                  </View>
                ))}
              </Card>
            ))}
            {grammar.map((g) => (
              <Card key={g.id}>
                <Badge>{s.t('grammar')}</Badge>
                <Txt size={22} serif>
                  {s.localize(g.point)}
                </Txt>
                <Txt mandarin weight="600" size={19}>
                  {g.structureLocalized ? s.localize(g.structureLocalized) : g.structure}
                </Txt>
                <Txt>{s.localize(g.explanation)}</Txt>
                <Txt size={12} color={c.red}>
                  {s.t('mistake')}: {s.localize(g.commonMistake)}
                </Txt>
              </Card>
            ))}
            <Button
              label={s.t('introDone')}
              busy={busy}
              icon="arrow-forward"
              onPress={() => {
                void next();
              }}
            />
          </>
        ) : draft.phase === 'practice' && exercise ? (
          <>
            <Txt color={c.muted} size={12}>
              {draft.index + 1} / {exercises.length}
            </Txt>
            {answered ? (
              <Card>
                <Txt weight="600" color={answered.correct ? c.green : c.red}>
                  {s.t(answered.correct ? 'correct' : 'incorrect')}
                </Txt>
                <Txt mandarin>
                  {s.t('correctAnswer')}: {exercise.answers.join(' / ')}
                </Txt>
                <Txt>{s.localize(exercise.explanation)}</Txt>
              </Card>
            ) : (
              <ExercisePlayer
                locale={draft.locale ?? s.locale}
                key={exercise.id}
                exercise={exercise}
                onAnswer={async (answer, correct, seconds) => {
                  await s.record({
                    type: 'answer',
                    itemId: exercise.itemId,
                    correct,
                    quality: correct ? 4 : 1,
                    skill: exercise.skill,
                    seconds,
                  });
                  await update({
                    ...draft,
                    answers: { ...draft.answers, [exercise.id]: { answer, correct } },
                  });
                }}
              />
            )}
            <Row style={{ justifyContent: 'space-between' }}>
              <Button
                label={s.t('back')}
                disabled={draft.index === 0}
                variant="ghost"
                onPress={() => {
                  void update({ ...draft, index: draft.index - 1 }).catch(() => setSaveError(true));
                }}
              />
              <Button
                label={s.t(draft.index === exercises.length - 1 ? 'finish' : 'next')}
                disabled={!answered}
                busy={busy}
                icon="arrow-forward"
                onPress={() => {
                  void next();
                }}
              />
            </Row>
            <Txt color={c.muted} size={10}>
              {s.t('pauseNote')}
            </Txt>
          </>
        ) : (
          <>
            <Card style={{ alignItems: 'center', padding: 35 }}>
              <Txt mandarin size={62} color={c.red}>
                好
              </Txt>
              <Heading title={s.t('lessonDone')} />
              <Txt size={34} weight="600">
                {Math.round((score / exercises.length) * 100)}%
              </Txt>
              <Txt color={c.muted}>
                {score} / {exercises.length} {s.t('correctOf')}
              </Txt>
              <Badge>{s.t('savedProgress')}</Badge>
              <Txt color={c.muted} size={12}>
                {s.t('wrongQueue')}
              </Txt>
              <Button
                label={s.t('returnHome')}
                icon="arrow-forward"
                onPress={() => router.replace('/')}
              />
              <Button
                label={s.t('repeat')}
                variant="ghost"
                onPress={() => {
                  void update(fresh).catch(() => setSaveError(true));
                }}
              />
            </Card>
            {exercises.filter((e) => draft.answers[e.id] && !draft.answers[e.id]!.correct)
              .length ? (
              <Txt weight="600">{s.t('reviewMistakes')}</Txt>
            ) : null}
            {exercises
              .filter((e) => draft.answers[e.id] && !draft.answers[e.id]!.correct)
              .map((e) => (
                <Card key={e.id}>
                  <Txt mandarin>{e.stimulus}</Txt>
                  <Txt mandarin color={c.red}>
                    {e.answers.join(' / ')}
                  </Txt>
                  <Txt>{s.localize(e.explanation)}</Txt>
                </Card>
              ))}
          </>
        )}
        {saveError ? <Txt color={c.red}>{s.t('saveError')}</Txt> : null}
        <Txt color={c.muted} size={10}>
          {s.t(id.startsWith('reference-') ? 'referenceWords' : 'supplementary')} ·{' '}
          {s.t('reviewNeeded')}
        </Txt>
      </View>
    </Shell>
  );
}
