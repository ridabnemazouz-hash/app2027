import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
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
type Mode =
  'flashcards' | 'due' | 'difficult' | 'writing' | 'listening' | 'assessment' | 'matching';
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
  const text =
    v?.simplified ?? (g?.structureLocalized ? s.localize(g.structureLocalized) : g?.structure);
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
        {(
          [
            'flashcards',
            'due',
            'difficult',
            'writing',
            'listening',
            'assessment',
            'matching',
          ] as Mode[]
        ).map((m) => (
          <Chip
            key={m}
            label={s.t(m === 'writing' ? 'characters' : m)}
            active={mode === m}
            onPress={() => setMode(m)}
          />
        ))}
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
        ) : mode === 'matching' ? (
          <MatchingGame key={`${s.preferences.targetLevel}-${s.owner}`} />
        ) : mode === 'listening' ? (
          <ListeningLab key={`${s.preferences.targetLevel}-${s.owner}`} />
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
              <Badge>{s.t('reviewMode')}</Badge>
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
                {s.t('testRecall')}
              </Txt>
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
          </>
        )}
        {error ? <Txt color={c.red}>{s.t('saveError')}</Txt> : null}
      </View>
    </Shell>
  );
}

/**
 * Matching rounds: four Chinese words and their shuffled meanings.
 * Each completed pair records one ordinary answer event for that word
 * (correct only when matched without a prior mistake in this round),
 * so matching feeds the same spaced-repetition state as other modes.
 */
function MatchingGame() {
  const s = useLearning(),
    c = usePalette(),
    [round, setRound] = useState(0),
    [selected, setSelected] = useState<string | null>(null),
    [matched, setMatched] = useState<ReadonlySet<string>>(new Set()),
    [mistakes, setMistakes] = useState<ReadonlySet<string>>(new Set()),
    [wrong, setWrong] = useState<string | null>(null),
    [totals, setTotals] = useState({ pairs: 0, firstTry: 0 });
  const pool = lexicon.filter((v) => v.level === s.preferences.targetLevel);
  const start = pool.length ? (round * 4) % pool.length : 0;
  const words = pool.length
    ? Array.from({ length: 4 }, (_, i) => pool[(start + i) % pool.length]!)
    : [];
  const shift = (round % 3) + 1;
  const meanings = words.map((w, i) => words[(i + shift) % words.length]!);
  useEffect(() => {
    setSelected(null);
    setMatched(new Set());
    setMistakes(new Set());
    setWrong(null);
  }, [round]);
  if (!words.length) return <Empty title={s.t('noWords')} icon="search-outline" />;
  const done = matched.size === words.length;
  async function tapMeaning(meaningWordId: string) {
    if (!selected || matched.has(meaningWordId)) return;
    if (meaningWordId === selected) {
      const firstTry = !mistakes.has(selected);
      const wordId = selected;
      setMatched(new Set(matched).add(wordId));
      setTotals((t) => ({ pairs: t.pairs + 1, firstTry: t.firstTry + (firstTry ? 1 : 0) }));
      setSelected(null);
      setWrong(null);
      await s
        .record({
          type: 'answer',
          itemId: wordId,
          correct: firstTry,
          quality: firstTry ? 4 : 1,
          skill: 'vocabulary',
          seconds: 5,
        })
        .catch(() => undefined);
    } else {
      setMistakes(new Set(mistakes).add(selected));
      setWrong(meaningWordId);
    }
  }
  const cellStyle = (state: 'idle' | 'selected' | 'matched' | 'wrong') => ({
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor:
      state === 'matched'
        ? c.green
        : state === 'selected'
          ? c.red
          : state === 'wrong'
            ? c.red
            : c.border,
    backgroundColor: state === 'matched' ? c.soft : undefined,
    opacity: state === 'matched' ? 0.65 : 1,
  });
  return (
    <Card style={{ gap: 16 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Badge>
          HSK {s.preferences.targetLevel} · {s.t('matching')}
        </Badge>
        <Txt size={12} color={c.muted}>
          {matched.size} / {words.length}
        </Txt>
      </Row>
      <Txt size={12} color={c.muted}>
        {s.t('matchHint')}
      </Txt>
      <Meter value={words.length ? matched.size / words.length : 0} />
      <Row style={{ alignItems: 'flex-start', gap: 14 }}>
        <View style={{ flex: 1, gap: 10 }}>
          {words.map((w) => (
            <Pressable
              key={w.id}
              accessibilityRole="button"
              accessibilityLabel={`${w.simplified} ${w.pinyin}`}
              accessibilityState={{ selected: selected === w.id, disabled: matched.has(w.id) }}
              disabled={matched.has(w.id)}
              onPress={() => {
                setSelected(w.id);
                setWrong(null);
              }}
              style={cellStyle(
                matched.has(w.id) ? 'matched' : selected === w.id ? 'selected' : 'idle',
              )}
            >
              <Txt mandarin size={21}>
                {w.simplified}
              </Txt>
              <Txt mandarin size={11} color={c.muted}>
                {w.pinyin}
              </Txt>
            </Pressable>
          ))}
        </View>
        <View style={{ flex: 1, gap: 10 }}>
          {meanings.map((w) => (
            <Pressable
              key={w.id}
              accessibilityRole="button"
              accessibilityLabel={wordMeaning(w, s.locale)}
              accessibilityState={{ disabled: matched.has(w.id) }}
              disabled={matched.has(w.id)}
              onPress={() => void tapMeaning(w.id)}
              style={cellStyle(matched.has(w.id) ? 'matched' : wrong === w.id ? 'wrong' : 'idle')}
            >
              <Txt size={14}>{wordMeaning(w, s.locale)}</Txt>
              {missingTranslation(w, s.locale) ? (
                <Txt size={10} color={c.muted}>
                  {s.t('englishOnly')}
                </Txt>
              ) : null}
            </Pressable>
          ))}
        </View>
      </Row>
      {done ? (
        <View style={{ gap: 10 }}>
          <Txt weight="600">
            {totals.firstTry}/{totals.pairs} {s.t('firstTry')}
          </Txt>
          <Button
            label={s.t('nextRound')}
            icon="arrow-forward"
            onPress={() => setRound(round + 1)}
          />
        </View>
      ) : null}
    </Card>
  );
}

/**
 * Listening Lab: level-appropriate sentences (the target level's
 * vocabulary examples and reading paragraphs) played through the
 * Pronunciation component — recorded audio when a licensed URL exists,
 * otherwise the clearly labelled device voice. Each item asks a
 * meaning question; the transcript is revealed only after answering.
 * Answers are recorded as ordinary 'listening' skill events.
 */
function ListeningLab() {
  const s = useLearning(),
    c = usePalette(),
    [index, setIndex] = useState(0),
    [chosen, setChosen] = useState<string | null>(null),
    [score, setScore] = useState(0),
    started = useRef(Date.now());
  const level = s.preferences.targetLevel;
  const items = [
    ...content.vocabulary
      .filter((v) => v.level === level)
      .map((v) => ({
        itemId: v.id,
        chinese: v.examples[0]!.chinese,
        pinyin: v.examples[0]!.pinyin,
        translation: s.localize(v.examples[0]!.translation),
        audio: v.examples[0]!.audio,
      })),
    ...content.readings
      .filter((r) => r.level === level)
      .flatMap((r) =>
        r.paragraphs.map((p) => ({
          itemId: r.id,
          chinese: p.chinese,
          pinyin: p.pinyin,
          translation: s.localize(p.translation),
          audio: p.audio,
        })),
      ),
  ];
  const item = items[index];
  if (!item)
    return (
      <Empty
        title={s.t('listeningDone')}
        subtitle={`${score} / ${items.length} · ${s.t('correctOf')}`}
        action={
          <Button
            label={s.t('restart')}
            onPress={() => {
              setIndex(0);
              setScore(0);
              setChosen(null);
              started.current = Date.now();
            }}
          />
        }
      />
    );
  const options = [0, 1, 2, 3].map(
    (k) => items[(index + [0, 1, 3, 5][k]!) % items.length]!.translation,
  );
  const rotated = options.map((_, k) => options[(k + index) % options.length]!);
  async function choose(option: string) {
    if (chosen || !item) return;
    const correct = option === item.translation;
    setChosen(option);
    if (correct) setScore((x) => x + 1);
    await s
      .record({
        type: 'answer',
        itemId: item.itemId,
        correct,
        quality: correct ? 4 : 1,
        skill: 'listening',
        seconds: Math.min(120, Math.max(1, Math.round((Date.now() - started.current) / 1000))),
      })
      .catch(() => undefined);
  }
  return (
    <Card style={{ gap: 16 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Badge>
          HSK {level} · {s.t('listening')}
        </Badge>
        <Txt size={12} color={c.muted}>
          {index + 1} / {items.length}
        </Txt>
      </Row>
      <Txt size={11} color={c.muted}>
        {s.t('listeningLabNote')}
      </Txt>
      <Meter value={items.length ? index / items.length : 0} />
      <Pronunciation text={item.chinese} audio={item.audio} />
      <Txt weight="600">{s.t('whatMeans')}</Txt>
      <View style={{ gap: 10 }}>
        {rotated.map((option, i) => {
          const isAnswer = option === item.translation;
          const state = !chosen
            ? 'idle'
            : isAnswer
              ? 'right'
              : option === chosen
                ? 'wrong'
                : 'idle';
          return (
            <Pressable
              key={i}
              accessibilityRole="radio"
              accessibilityState={{ checked: chosen === option, disabled: !!chosen }}
              disabled={!!chosen}
              onPress={() => void choose(option)}
              style={{
                padding: 14,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: state === 'right' ? c.green : state === 'wrong' ? c.red : c.border,
                backgroundColor: state === 'right' ? c.soft : undefined,
              }}
            >
              <Txt>{option}</Txt>
            </Pressable>
          );
        })}
      </View>
      {chosen ? (
        <View style={{ gap: 8, padding: 16, borderRadius: 12, backgroundColor: c.soft }}>
          <Txt weight="600">{s.t(chosen === item.translation ? 'correct' : 'incorrect')}</Txt>
          <Txt size={11} color={c.muted}>
            {s.t('transcript')}
          </Txt>
          <Txt mandarin size={19}>
            {item.chinese}
          </Txt>
          <Txt mandarin color={c.muted}>
            {item.pinyin}
          </Txt>
          <Txt>{item.translation}</Txt>
          <Button
            label={s.t('next')}
            icon="arrow-forward"
            onPress={() => {
              setIndex(index + 1);
              setChosen(null);
              started.current = Date.now();
            }}
          />
        </View>
      ) : null}
    </Card>
  );
}
