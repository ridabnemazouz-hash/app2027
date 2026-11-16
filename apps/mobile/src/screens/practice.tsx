import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { findWord, lexicon, missingTranslation, wordMeaning } from '../lexicon';
import { Pronunciation } from '../audio';
import { Drawing } from '../drawing';
import { ExercisePlayer } from '../exercise';
import { selectExercises } from '../localized-exercise';
import { storage } from '../storage';
type Mode =
  | 'flashcards'
  | 'due'
  | 'difficult'
  | 'writing'
  | 'listening'
  | 'assessment'
  | 'matching'
  | 'speaking';
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
    [score, setScore] = useState(0),
    [charId, setCharId] = useState<string | null>(null),
    [drawings, setDrawings] = useState<
      { key: string; paths: string[]; size: number; at: string; quality: number }[]
    >([]),
    [replay, setReplay] = useState<{ paths: string[]; size: number } | null>(null),
    [savedTick, setSavedTick] = useState(0);
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
  const character =
    content.characters.find((ch) => ch.id === charId) ??
    content.characters.find((c) => c.level === s.preferences.targetLevel)!;
  // Saved drawings for the selected character, newest first.
  useEffect(() => {
    if (mode !== 'writing') return;
    let live = true;
    void storage
      .getByPrefix<{ paths: string[]; quality: number; at: string; size?: number }>(
        `drawing:${s.owner}:${character.id}:`,
      )
      .then((rows) => {
        if (!live) return;
        setDrawings(
          rows
            .map((r) => ({
              key: r.key,
              paths: r.value.paths,
              size: r.value.size ?? 350,
              at: r.value.at,
              quality: r.value.quality,
            }))
            .sort((a, b) => b.key.localeCompare(a.key))
            .slice(0, 5),
        );
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [mode, s.owner, character.id, savedTick]);
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
            'speaking',
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
            <View style={styles.wrap}>
              {content.characters.map((ch) => (
                <Chip
                  key={ch.id}
                  label={`${ch.character} · HSK ${ch.level}`}
                  active={character.id === ch.id}
                  onPress={() => {
                    setCharId(ch.id);
                    setReplay(null);
                  }}
                />
              ))}
            </View>
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
                onSave={async (paths, seconds, size) => {
                  await storage.set(`drawing:${s.owner}:${character.id}:${Date.now()}`, {
                    paths,
                    quality,
                    at: new Date().toISOString(),
                    size,
                  });
                  await s.record({
                    type: 'writing',
                    itemId: character.id,
                    quality,
                    skill: 'writing',
                    seconds,
                  });
                  setSavedTick((t) => t + 1);
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
              {drawings.map((d) => (
                <Row key={d.key} style={{ justifyContent: 'space-between' }}>
                  <Txt size={12}>
                    {new Intl.DateTimeFormat(s.locale, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(d.at))}
                  </Txt>
                  <Button
                    small
                    variant="ghost"
                    label={s.t('replayDrawing')}
                    icon="play-outline"
                    onPress={() => setReplay({ paths: d.paths, size: d.size })}
                  />
                </Row>
              ))}
              {replay ? (
                <View style={{ alignItems: 'center', gap: 10 }}>
                  <ReplayDrawing paths={replay.paths} size={replay.size} />
                  <Button
                    small
                    variant="secondary"
                    label={s.t('close')}
                    onPress={() => setReplay(null)}
                  />
                </View>
              ) : null}
            </Card>
          </>
        ) : mode === 'matching' ? (
          <MatchingGame key={`${s.preferences.targetLevel}-${s.owner}`} />
        ) : mode === 'listening' ? (
          <ListeningLab key={`${s.preferences.targetLevel}-${s.owner}`} />
        ) : mode === 'speaking' ? (
          <SpeakingLab key={`${s.preferences.targetLevel}-${s.owner}`} />
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

/**
 * Speaking practice: listen to a model sentence (device voice or a
 * supplied recording), record yourself, replay and compare. There is
 * NO pronunciation or tone scoring — no acoustic analysis exists in
 * the app, and the UI says so. Practice is self-assessed with the
 * usual quality rating, recorded as a 'self' event (never counted in
 * objective accuracy). Only the current item's recording is kept, in
 * the device's temporary cache; it is deleted when replaced or when
 * moving to another sentence.
 */
function SpeakingLab() {
  const s = useLearning(),
    c = usePalette(),
    [index, setIndex] = useState(0),
    [recUri, setRecUri] = useState<string | null>(null),
    [denied, setDenied] = useState(false),
    [unsupported, setUnsupported] = useState(false),
    [quality, setQuality] = useState(4),
    [savedItem, setSavedItem] = useState<string | null>(null),
    started = useRef(Date.now());
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const player = useAudioPlayer(recUri ? { uri: recUri } : undefined);
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
  function discardRecording() {
    if (recUri) {
      try {
        new File(recUri).delete();
      } catch {
        // Temporary cache is cleared by the OS; deletion is best-effort.
      }
      setRecUri(null);
    }
  }
  async function toggleRecord() {
    try {
      if (recorderState.isRecording) {
        await recorder.stop();
        setRecUri(recorder.uri);
        return;
      }
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setDenied(true);
        return;
      }
      setDenied(false);
      discardRecording();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      setUnsupported(true);
    }
  }
  if (!item) return <Empty title={s.t('noItems')} icon="mic-outline" />;
  const saved = savedItem === `${item.itemId}:${index}`;
  return (
    <Card style={{ gap: 16 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Badge>
          HSK {level} · {s.t('speaking')}
        </Badge>
        <Txt size={12} color={c.muted}>
          {index + 1} / {items.length}
        </Txt>
      </Row>
      <Txt size={12} color={c.muted}>
        {s.t('speakingGuide')}
      </Txt>
      <Txt mandarin serif size={30} style={{ textAlign: 'center' }}>
        {item.chinese}
      </Txt>
      <Txt mandarin size={15} color={c.red} style={{ textAlign: 'center' }}>
        {item.pinyin}
      </Txt>
      <Txt size={13} color={c.muted} style={{ textAlign: 'center' }}>
        {item.translation}
      </Txt>
      <Pronunciation text={item.chinese} audio={item.audio} />
      {unsupported ? (
        <Txt size={12} color={c.muted}>
          {s.t('recordingUnsupported')}
        </Txt>
      ) : denied ? (
        <Txt size={12} color={c.red}>
          {s.t('micDenied')}
        </Txt>
      ) : (
        <Row style={{ gap: 10, justifyContent: 'center' }}>
          <Button
            label={recorderState.isRecording ? s.t('stopRecording') : s.t('record')}
            icon={recorderState.isRecording ? 'stop-outline' : 'mic-outline'}
            variant={recorderState.isRecording ? 'primary' : 'secondary'}
            onPress={() => void toggleRecord()}
          />
          {recUri && !recorderState.isRecording ? (
            <Button
              label={s.t('playRecording')}
              icon="play-outline"
              variant="secondary"
              onPress={() => {
                player.seekTo(0);
                player.play();
              }}
            />
          ) : null}
        </Row>
      )}
      <Txt size={11} color={c.muted}>
        {s.t('noScoring')}
      </Txt>
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
      <Row style={{ justifyContent: 'space-between' }}>
        <Button
          label={s.t('back')}
          variant="secondary"
          disabled={index === 0}
          onPress={() => {
            discardRecording();
            setIndex(index - 1);
            started.current = Date.now();
          }}
        />
        <Button
          label={saved ? s.t('saved') : s.t('savePractice')}
          disabled={saved}
          onPress={() => {
            void s
              .record({
                type: 'answer',
                itemId: item.itemId,
                correct: false,
                quality,
                skill: 'self',
                seconds: Math.min(
                  120,
                  Math.max(1, Math.round((Date.now() - started.current) / 1000)),
                ),
              })
              .then(() => setSavedItem(`${item.itemId}:${index}`))
              .catch(() => undefined);
          }}
        />
        <Button
          label={s.t('next')}
          disabled={index + 1 >= items.length}
          onPress={() => {
            discardRecording();
            setIndex(index + 1);
            started.current = Date.now();
          }}
        />
      </Row>
    </Card>
  );
}

/** Stroke-by-stroke replay of a saved freehand drawing. */
function ReplayDrawing({ paths, size }: { paths: string[]; size: number }) {
  const s = useLearning(),
    c = usePalette(),
    [step, setStep] = useState(0),
    [run, setRun] = useState(1);
  useEffect(() => {
    setStep(0);
    if (!paths.length) return;
    const timer = setInterval(
      () =>
        setStep((current) => {
          if (current >= paths.length) {
            clearInterval(timer);
            return current;
          }
          return current + 1;
        }),
      550,
    );
    return () => clearInterval(timer);
  }, [paths, run]);
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <View
        style={{
          width: '100%',
          maxWidth: 280,
          aspectRatio: 1,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 16,
          backgroundColor: c.bg,
          overflow: 'hidden',
        }}
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
          {paths.slice(0, step).map((d, i) => (
            <Path
              key={i}
              d={d}
              stroke={c.text}
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </Svg>
      </View>
      <Button
        small
        variant="ghost"
        label={s.t('repeat')}
        icon="refresh-outline"
        onPress={() => setRun((r) => r + 1)}
      />
    </View>
  );
}
