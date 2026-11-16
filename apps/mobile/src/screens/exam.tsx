import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  buildPracticeExam,
  contentLocaleFor,
  scoreExam,
  checkAnswer,
  type ExamScore,
  type Exercise,
} from '../../../../packages/core/src';
import { content, useLearning } from '../state';
import { localizeExercise } from '../localized-exercise';
import { storage } from '../storage';
import { Pronunciation } from '../audio';
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Heading,
  Meter,
  Row,
  Shell,
  Txt,
  usePalette,
  styles,
} from '../ui';

type Phase = 'intro' | 'running' | 'results';
type Draft = { answers: Record<string, string>; index: number; startedAt: number };

/**
 * HanziGo practice exam (NOT an official HSK exam — see the
 * disclaimer on screen and packages/core/src/exam.ts for the
 * documented 300-point model). Grading happens only at submission;
 * an in-progress attempt is stored on this device and restored
 * after an interruption.
 */
export function ExamScreen() {
  const s = useLearning(),
    c = usePalette(),
    level = s.preferences.targetLevel,
    exam = useMemo(
      () => buildPracticeExam(content, level, contentLocaleFor(s.locale)),
      [level, s.locale],
    ),
    questions = useMemo(
      () =>
        exam.sections.flatMap((section) =>
          section.exercises.map((exercise) => ({ section: section.key, exercise })),
        ),
      [exam],
    ),
    [phase, setPhase] = useState<Phase>('intro'),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [index, setIndex] = useState(0),
    [startedAt, setStartedAt] = useState(0),
    [now, setNow] = useState(0),
    [confirming, setConfirming] = useState(false),
    [restored, setRestored] = useState(false),
    [timeUp, setTimeUp] = useState(false),
    [result, setResult] = useState<ExamScore | null>(null),
    draftKey = `exam-draft:${s.owner}:${exam.id}`,
    restoredRef = useRef(false);

  // Restore an interrupted attempt once per owner/exam.
  useEffect(() => {
    if (restoredRef.current || !s.ready) return;
    restoredRef.current = true;
    void (async () => {
      const draft = await storage.get<Draft>(draftKey);
      if (draft && Date.now() - draft.startedAt < exam.minutes * 60 * 1000) {
        setAnswers(draft.answers);
        setIndex(Math.min(draft.index, questions.length - 1));
        setStartedAt(draft.startedAt);
        setRestored(true);
        setPhase('running');
      }
    })();
  }, [draftKey, exam.minutes, questions.length, s.ready]);

  // Persist the draft as the attempt progresses.
  useEffect(() => {
    if (phase !== 'running' || !startedAt) return;
    void storage.set(draftKey, { answers, index, startedAt } satisfies Draft);
  }, [answers, index, phase, startedAt, draftKey]);

  // Countdown; auto-submit at zero.
  useEffect(() => {
    if (phase !== 'running') return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [phase]);
  const remaining = startedAt
    ? Math.max(0, exam.minutes * 60 - Math.floor((now - startedAt) / 1000))
    : exam.minutes * 60;
  useEffect(() => {
    if (phase === 'running' && startedAt && remaining === 0) {
      setTimeUp(true);
      void submit(true);
    }
  }, [remaining, phase, startedAt]);

  const current = questions[index];
  const unanswered = questions.filter((q) => !(answers[q.exercise.id]?.trim() ?? '')).length;

  function start() {
    setAnswers({});
    setIndex(0);
    setResult(null);
    setConfirming(false);
    setTimeUp(false);
    setRestored(false);
    setStartedAt(Date.now());
    setPhase('running');
  }

  async function submit(force = false) {
    if (phase !== 'running') return;
    if (!force && unanswered > 0 && !confirming) {
      setConfirming(true);
      return;
    }
    const scored = scoreExam(exam, answers);
    const elapsed = Math.min(
      exam.minutes * 60,
      Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
    );
    await storage.remove(draftKey);
    await s
      .record({
        type: 'exam',
        itemId: exam.id,
        score: scored.total,
        sections: scored.sections,
        seconds: elapsed,
      })
      .catch(() => undefined);
    setResult(scored);
    setPhase('results');
  }

  const sectionLabel = (key: string) =>
    s.t(
      key === 'listening' ? 'listeningSkill' : key === 'reading' ? 'readingSkill' : 'grammarSkill',
    );

  return (
    <Shell active="/practice">
      <Heading eyebrow="考试 · EXAM" title={s.t('practiceExam')} subtitle={s.t('examNote')} />
      <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center', gap: 20 }}>
        <Txt size={11} color={c.muted}>
          {s.t('examDisclaimer')}
        </Txt>
        {phase === 'intro' ? (
          <>
            <Card style={{ gap: 12 }}>
              <Txt>{s.t('examInstructions')}</Txt>
              <Txt size={12} color={c.muted}>
                HSK {level} · {questions.length} · {exam.minutes} {s.t('minutes')}
              </Txt>
              <Button label={s.t('startExam')} icon="play-outline" onPress={start} />
            </Card>
            {s.progress.exams.length ? (
              <Card style={{ gap: 10 }}>
                <Txt weight="600">{s.t('examHistory')}</Txt>
                {[...s.progress.exams]
                  .reverse()
                  .slice(0, 5)
                  .map((a) => (
                    <Row key={a.id} style={{ justifyContent: 'space-between' }}>
                      <Txt size={12}>
                        {a.itemId.replace('exam-', '').toUpperCase()} ·{' '}
                        {new Intl.DateTimeFormat(s.locale, { dateStyle: 'medium' }).format(
                          new Date(a.at),
                        )}
                      </Txt>
                      <Badge>
                        {Math.round(a.score)} / 300 {s.t('points')}
                      </Badge>
                    </Row>
                  ))}
              </Card>
            ) : null}
          </>
        ) : phase === 'running' && current ? (
          <>
            {restored ? (
              <Txt size={12} color={c.muted}>
                {s.t('resumeExam')}
              </Txt>
            ) : null}
            <Row style={{ justifyContent: 'space-between' }}>
              <Badge>
                {sectionLabel(current.section)} · {index + 1} / {questions.length}
              </Badge>
              <Txt weight="700" color={remaining < 60 ? c.red : c.text}>
                {String(Math.floor(remaining / 60)).padStart(2, '0')}:
                {String(remaining % 60).padStart(2, '0')}
              </Txt>
            </Row>
            <Meter value={questions.length ? (index + 1) / questions.length : 0} />
            <View style={styles.wrap}>
              {questions.map((q, i) => (
                <Pressable
                  key={q.exercise.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${i + 1}`}
                  accessibilityState={{ selected: i === index }}
                  onPress={() => setIndex(i)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: i === index ? c.red : c.border,
                    backgroundColor: answers[q.exercise.id]?.trim() ? c.soft : 'transparent',
                  }}
                >
                  <Txt size={12} weight={i === index ? '700' : '400'}>
                    {i + 1}
                  </Txt>
                </Pressable>
              ))}
            </View>
            <ExamQuestion
              key={current.exercise.id}
              exercise={localizeExercise(current.exercise, s.locale)}
              value={answers[current.exercise.id] ?? ''}
              onChange={(v) => setAnswers((prev) => ({ ...prev, [current.exercise.id]: v }))}
            />
            <Row style={{ justifyContent: 'space-between' }}>
              <Button
                label={s.t('back')}
                variant="secondary"
                disabled={index === 0}
                onPress={() => setIndex(index - 1)}
              />
              {index + 1 < questions.length ? (
                <Button label={s.t('next')} onPress={() => setIndex(index + 1)} />
              ) : (
                <Button label={s.t('submitExam')} onPress={() => void submit()} />
              )}
            </Row>
            {index + 1 < questions.length ? (
              <Button label={s.t('submitExam')} variant="ghost" onPress={() => void submit()} />
            ) : null}
            {confirming ? (
              <Card style={{ gap: 10, borderColor: c.red }}>
                <Txt color={c.red}>
                  {unanswered} {s.t('unanswered')}
                </Txt>
                <Button label={s.t('submitExam')} onPress={() => void submit()} />
              </Card>
            ) : null}
          </>
        ) : phase === 'results' && result ? (
          <>
            {timeUp ? (
              <Txt size={12} color={c.muted}>
                {s.t('timeUp')}
              </Txt>
            ) : null}
            <Card style={{ gap: 14, alignItems: 'center', padding: 26 }}>
              <Txt size={44} weight="800">
                {result.total}
                <Txt size={18} color={c.muted}>
                  {' '}
                  / 300 {s.t('points')}
                </Txt>
              </Txt>
              {exam.sections.map((section) => (
                <View key={section.key} style={{ width: '100%', gap: 6 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Txt size={13}>{sectionLabel(section.key)}</Txt>
                    <Txt size={13} color={c.muted}>
                      {result.correct[section.key]} / {result.counts[section.key]} ·{' '}
                      {result.sections[section.key]} {s.t('points')}
                    </Txt>
                  </Row>
                  <Meter value={result.sections[section.key] / 100} />
                </View>
              ))}
            </Card>
            {questions.map((q, i) => {
              const shown = localizeExercise(q.exercise, s.locale);
              const good = checkAnswer(shown, answers[q.exercise.id] ?? '');
              return (
                <Card key={q.exercise.id} style={{ gap: 8 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Badge>
                      {i + 1} · {sectionLabel(q.section)}
                    </Badge>
                    <Txt weight="700" color={good ? c.green : c.red}>
                      {good ? '✓' : '✗'}
                    </Txt>
                  </Row>
                  <Txt weight="600">{s.localize(shown.prompt)}</Txt>
                  {shown.kind !== 'listening' && shown.stimulus ? (
                    <Txt mandarin size={17}>
                      {shown.stimulus}
                    </Txt>
                  ) : null}
                  <Txt size={13} color={c.muted}>
                    {s.t('answer')}: {answers[q.exercise.id]?.trim() || '—'}
                  </Txt>
                  <Txt size={13}>
                    {s.t('correctAnswer')}: {shown.answers[0]}
                  </Txt>
                  <Txt size={12} color={c.muted}>
                    {s.localize(shown.explanation)}
                  </Txt>
                </Card>
              );
            })}
            <Row style={{ gap: 10 }}>
              <Button
                label={s.t('returnHome')}
                onPress={() => router.push('/')}
                style={{ flex: 1 }}
              />
              <Button
                label={s.t('restart')}
                variant="secondary"
                onPress={() => setPhase('intro')}
                style={{ flex: 1 }}
              />
            </Row>
          </>
        ) : (
          <Empty title={s.t('noItems')} icon="document-text-outline" />
        )}
      </View>
    </Shell>
  );
}

function ExamQuestion({
  exercise,
  value,
  onChange,
}: {
  exercise: Exercise;
  value: string;
  onChange: (v: string) => void;
}) {
  const s = useLearning(),
    c = usePalette(),
    [tokens, setTokens] = useState<number[]>([]);
  useEffect(() => {
    setTokens([]);
  }, [exercise.id]);
  const ordering = exercise.kind === 'word-order';
  const options = ordering ? [...(exercise.options ?? [])].reverse() : exercise.options;
  return (
    <Card style={{ gap: 18, padding: 24 }}>
      <Txt size={18} weight="600">
        {s.localize(exercise.prompt)}
      </Txt>
      {exercise.kind === 'listening' ? (
        <Pronunciation text={exercise.stimulus} audio={exercise.audio} />
      ) : exercise.stimulus ? (
        <Txt
          mandarin={!['en-zh', 'ar-zh', 'es-zh', 'word-order'].includes(exercise.kind)}
          size={ordering ? 19 : 26}
          serif
          style={{ textAlign: 'center', paddingVertical: 8 }}
        >
          {exercise.stimulus}
        </Txt>
      ) : null}
      {ordering ? (
        <>
          <View style={{ minHeight: 54, padding: 14, borderRadius: 12, backgroundColor: c.soft }}>
            <Txt mandarin size={20}>
              {value || '…'}
            </Txt>
          </View>
          <View style={[styles.wrap, { direction: 'ltr' }]}>
            {options?.map((option, i) => (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={option}
                disabled={tokens.includes(i)}
                onPress={() => {
                  const next = [...tokens, i];
                  setTokens(next);
                  onChange(next.map((t) => options[t]).join(''));
                }}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 13,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: c.border,
                  opacity: tokens.includes(i) ? 0.35 : 1,
                }}
              >
                <Txt mandarin>{option}</Txt>
              </Pressable>
            ))}
          </View>
          <Button
            label={s.t('clear')}
            variant="ghost"
            small
            onPress={() => {
              setTokens([]);
              onChange('');
            }}
          />
        </>
      ) : options?.length ? (
        <View style={{ gap: 10 }}>
          {options.map((option, i) => (
            <Pressable
              key={i}
              accessibilityRole="radio"
              accessibilityState={{ checked: value === option }}
              onPress={() => onChange(option)}
              style={{
                padding: 14,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: value === option ? c.red : c.border,
                backgroundColor: value === option ? c.soft : undefined,
              }}
            >
              <Txt mandarin={/[\u4e00-\u9fff]/.test(option)}>{option}</Txt>
            </Pressable>
          ))}
        </View>
      ) : (
        <Field label={s.t('answer')} value={value} onChangeText={onChange} />
      )}
    </Card>
  );
}
