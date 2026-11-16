import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { dueItems, getLessons, type Exercise } from '../../../../packages/core/src';
import { content, useLearning } from '../state';
import {
  Badge,
  Button,
  Card,
  Chip,
  Empty,
  Heading,
  Meter,
  Row,
  Shell,
  Txt,
  usePalette,
  styles,
} from '../ui';
import { findWord, lexicon, missingTranslation, wordMeaning } from '../lexicon';
import { Pronunciation } from '../audio';
import { Drawing } from '../drawing';
import { ExercisePlayer } from '../exercise';
import { selectExercises } from '../localized-exercise';
import { storage } from '../storage';
type Mode = 'flashcards' | 'due' | 'difficult' | 'writing' | 'listening' | 'assessment';
export function PracticeScreen() {
  const s = useLearning(),
    c = usePalette(),
    params = useLocalSearchParams<{ mode?: Mode }>(),
    [mode, setMode] = useState<Mode>(params.mode ?? 'flashcards'),
    [ids, setIds] = useState<string[]>([]),
    [index, setIndex] = useState(0),
    [revealed, setRevealed] = useState(false),
    [busy, setBusy] = useState(false),
    [rated, setRated] = useState(false),
    [error, setError] = useState(''),
    [quality, setQuality] = useState(4),
    [assessmentIndex, setAssessmentIndex] = useState(0),
    [assessmentAnswered, setAssessmentAnswered] = useState(false),
    [score, setScore] = useState(0);
  const reviewStarted = useRef(Date.now());
  useEffect(() => {
    if (params.mode) setMode(params.mode);
  }, [params.mode]);
  useEffect(() => {
    const pool =
      mode === 'due'
        ? dueItems(s.events)
        : mode === 'difficult'
          ? Object.entries(s.progress.reviews)
              .filter(([, r]) => r.incorrect > 0)
              .map(([id]) => id)
          : lexicon.filter((v) => v.level === s.preferences.targetLevel).map((v) => v.id);
    setIds(pool);
    setIndex(0);
    setRevealed(false);
    setRated(false);
    reviewStarted.current = Date.now();
    setAssessmentIndex(0);
    setAssessmentAnswered(false);
    setScore(0);
  }, [mode, s.preferences.targetLevel, s.owner]);
  const itemId = ids[index],
    v = findWord(itemId),
    g = content.grammar.find((g) => g.id === itemId);
  const text = v?.simplified ?? g?.structureLocalized?.[s.locale] ?? g?.structure;
  const answer = v ? wordMeaning(v, s.locale) : g ? s.localize(g.explanation) : '';
  const character = content.characters.find((c) => c.level === s.preferences.targetLevel)!;
  const exercises = selectExercises(
    getLessons(content)
      .filter((l) => l.id.startsWith(`lesson-${s.preferences.targetLevel}-`))
      .flatMap((l) => l.exercises)
      .filter((e) => e.assessment === 'automatic'),
    s.locale,
  ).slice(0, 8);
  const exercise: Exercise | undefined = exercises[assessmentIndex];
  const history = s.events
    .filter((e) => e.type === 'writing' && e.itemId === character.id)
    .slice(-5)
    .reverse();
  function next() {
    reviewStarted.current = Date.now();
    setIndex(index + 1);
    setRevealed(false);
    setRated(false);
  }
  return (
    <Shell active="/practice">
      <Heading
        eyebrow="练习 · PRACTICE"
        title={s.t('quickPractice')}
        subtitle={s.t('assessHint')}
      />
      <View style={styles.wrap}>
        {(['flashcards', 'due', 'difficult', 'writing', 'listening', 'assessment'] as Mode[]).map(
          (m) => (
            <Chip
              key={m}
              label={s.t(m === 'writing' ? 'characters' : m)}
              active={mode === m}
              onPress={() => setMode(m)}
            />
          ),
        )}
      </View>
      <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center', gap: 20 }}>
        {mode === 'writing' ? (
          <>
            <Card>
              <Badge>{s.t('selfAssessment')}</Badge>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt mandarin serif size={65}>
                  {character.character}
                </Txt>
                <View style={{ gap: 4, flex: 1, paddingHorizontal: 20 }}>
                  <Txt mandarin color={c.red}>
                    {character.pinyin}
                  </Txt>
                  <Txt size={12} color={c.muted}>
                    {s.localize(character.meaning)}
                  </Txt>
                  <Txt size={12} color={c.muted}>
                    {s.t('writeHint')}
                  </Txt>
                </View>
              </Row>
              <View style={styles.wrap}>
                {[2, 4, 5].map((q) => (
                  <Chip
                    key={q}
                    label={s.t(q === 2 ? 'hard' : q === 4 ? 'good' : 'easy')}
                    active={quality === q}
                    onPress={() => setQuality(q)}
                  />
                ))}
              </View>
              <Drawing
                onSave={async (paths, seconds) => {
                  await storage.set(`drawing:${s.owner}:${character.id}:${Date.now()}`, {
                    paths,
                    quality,
                    at: new Date().toISOString(),
                  });
                  await s.record({
                    type: 'writing',
                    itemId: character.id,
                    quality,
                    skill: 'writing',
                    seconds,
                  });
                }}
              />
              <Txt size={11} color={c.muted}>
                {s.t('strokeUnavailable')}
              </Txt>
            </Card>
            <Card>
              <Txt weight="600">
                {s.t('writingHistory')}: {s.progress.writings}
              </Txt>
              {history.map((e) => (
                <Row key={e.id} style={{ justifyContent: 'space-between' }}>
                  <Txt size={12}>
                    {new Intl.DateTimeFormat(s.locale, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(e.at))}
                  </Txt>
                  <Badge>{s.t(e.quality === 2 ? 'hard' : e.quality === 5 ? 'easy' : 'good')}</Badge>
                </Row>
              ))}
            </Card>
          </>
        ) : mode === 'assessment' ? (
          <>
            <Txt size={12} color={c.muted}>
              {s.t('assessmentNote')}
            </Txt>
            {exercise ? (
              <>
                <Meter value={assessmentIndex / exercises.length} />
                <Txt size={12}>
                  {assessmentIndex + 1} / {exercises.length}
                </Txt>
                <ExercisePlayer
                  key={exercise.id}
                  exercise={exercise}
                  onAnswer={async (_answer, correct, seconds) => {
                    await s.record({
                      type: 'answer',
                      itemId: exercise.itemId,
                      correct,
                      quality: correct ? 4 : 1,
                      skill: exercise.skill,
                      seconds,
                    });
                    setAssessmentAnswered(true);
                    if (correct) setScore((x) => x + 1);
                  }}
                />
                <Button
                  label={s.t('next')}
                  disabled={!assessmentAnswered}
                  onPress={() => {
                    setAssessmentIndex((i) => i + 1);
                    setAssessmentAnswered(false);
                  }}
                />
              </>
            ) : (
              <Empty
                title={s.t('assessmentDone')}
                subtitle={`${score} / ${exercises.length} · ${s.t('correctOf')}`}
                action={
                  <Button
                    label={s.t('restart')}
                    onPress={() => {
                      setAssessmentIndex(0);
                      setScore(0);
                    }}
                  />
                }
              />
            )}
          </>
        ) : !text ? (
          <Empty
            title={s.t(index ? 'noMore' : 'emptyReview')}
            subtitle={s.t(index ? 'reviewSummary' : 'emptyReviewSub')}
            action={<Button label={s.t('learn')} onPress={() => router.push('/learn')} />}
          />
        ) : (
          <>
            <Row style={{ justifyContent: 'space-between' }}>
              <Badge>{mode === 'listening' ? s.t('listenOnly') : s.t('reviewMode')}</Badge>
              <Txt size={12} color={c.muted}>
                {index + 1} / {ids.length}
              </Txt>
              <Button
                label={s.t('shuffle')}
                small
                variant="ghost"
                onPress={() => {
                  setIds((prev) => {
                    const next = [...prev];
                    for (let i = next.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [next[i], next[j]] = [next[j]!, next[i]!];
                    }
                    return next;
                  });
                  reviewStarted.current = Date.now();
                  setIndex(0);
                  setRevealed(false);
                  setRated(false);
                }}
              />
            </Row>
            <Meter value={index / ids.length} />
            <Card style={{ alignItems: 'center', padding: 30, minHeight: 350, gap: 25 }}>
              <Txt size={12} color={c.muted}>
                {s.t(mode === 'listening' ? 'pronunciation' : 'testRecall')}
              </Txt>
              {mode !== 'listening' || revealed ? (
                <>
                  <Txt mandarin serif size={v ? 55 : 30} style={{ textAlign: 'center' }}>
                    {text}
                  </Txt>
                  {v ? (
                    <Txt mandarin size={18} color={c.red}>
                      {v.pinyin}
                    </Txt>
                  ) : null}
                </>
              ) : null}
              {mode === 'listening' ? (
                <View style={{ width: '100%' }}>
                  <Pronunciation text={text} audio={v?.audio ?? g?.audio} />
                  <Txt size={11} color={c.muted}>
                    {s.t('noScoring')}
                  </Txt>
                </View>
              ) : null}
              {revealed ? (
                <>
                  <Txt size={22} style={{ textAlign: 'center' }}>
                    {answer}
                  </Txt>
                  {v && missingTranslation(v, s.locale) ? (
                    <Txt size={11} color={c.muted}>
                      {s.t('englishOnly')}
                    </Txt>
                  ) : null}
                  {v?.examples[0] ? (
                    <Txt mandarin size={18} style={{ textAlign: 'center' }}>
                      {v.examples[0]!.chinese}
                    </Txt>
                  ) : null}
                  <Txt size={11} color={c.muted}>
                    {s.t('selfAssessment')}
                  </Txt>
                  {!rated ? (
                    <View style={[styles.wrap, { justifyContent: 'center' }]}>
                      {[
                        { label: 'again' as const, q: 1 },
                        { label: 'hard' as const, q: 3 },
                        { label: 'good' as const, q: 4 },
                        { label: 'easy' as const, q: 5 },
                      ].map((x) => (
                        <Button
                          key={x.q}
                          small
                          label={s.t(x.label)}
                          busy={busy}
                          variant={x.q === 4 ? 'primary' : 'secondary'}
                          onPress={() => {
                            setBusy(true);
                            void s
                              .record({
                                type: 'answer',
                                itemId: itemId!,
                                quality: x.q,
                                correct: x.q >= 3,
                                skill: 'self',
                                seconds: Math.min(
                                  60,
                                  Math.max(
                                    1,
                                    Math.round((Date.now() - reviewStarted.current) / 1000),
                                  ),
                                ),
                              })
                              .then(() => setRated(true))
                              .catch(() => setError('saveError'))
                              .finally(() => setBusy(false));
                          }}
                        />
                      ))}
                    </View>
                  ) : (
                    <Button label={s.t('next')} icon="arrow-forward" onPress={next} />
                  )}
                </>
              ) : (
                <Button
                  label={s.t('reveal')}
                  icon="eye-outline"
                  onPress={() => setRevealed(true)}
                />
              )}
            </Card>
            {mode === 'listening' ? (
              <Txt size={11} color={c.muted}>
                {s.t('soundPractice')} {s.t('listeningUnavailable')}
              </Txt>
            ) : null}
          </>
        )}
        {error ? <Txt color={c.red}>{s.t('saveError')}</Txt> : null}
      </View>
    </Shell>
  );
}
