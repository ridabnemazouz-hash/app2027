import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { checkAnswer, type Exercise } from '../../../packages/core/src';
import { useLearning } from './state';
import { localizeExercise } from './localized-exercise';
import type { Locale } from '../../../packages/core/src';
import { Badge, Button, Card, Field, Icon, Row, Txt, usePalette, styles } from './ui';
import { Pronunciation } from './audio';
export function ExercisePlayer({
  exercise,
  onAnswer,
  locale,
}: {
  exercise: Exercise;
  locale?: Locale;
  onAnswer: (answer: string, correct: boolean, seconds: number) => Promise<void>;
}) {
  const s = useLearning(),
    c = usePalette(),
    [answer, setAnswer] = useState(''),
    [tokens, setTokens] = useState<number[]>([]),
    [checked, setChecked] = useState(false),
    [correct, setCorrect] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    start = useRef(Date.now());
  const shown = localizeExercise(exercise, locale ?? s.locale);
  useEffect(() => {
    setAnswer('');
    setTokens([]);
    setChecked(false);
    setCorrect(false);
    setError(false);
    start.current = Date.now();
  }, [shown.id]);
  const ordering = shown.kind === 'word-order';
  const options = ordering ? [...(shown.options ?? [])].reverse() : shown.options;
  const stimulus = shown.kind === 'listening' ? '' : shown.stimulus;
  async function submit() {
    if (!answer.trim() || busy || checked) return;
    setBusy(true);
    const good = checkAnswer(shown, answer);
    try {
      await onAnswer(
        answer,
        good,
        Math.min(60, Math.max(1, Math.round((Date.now() - start.current) / 1000))),
      );
      setCorrect(good);
      setChecked(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card style={{ gap: 22, padding: 26 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Badge>{s.t(`${shown.skill}Skill` as 'vocabularySkill')}</Badge>
        <Txt size={10} color={c.muted}>
          {s.t(shown.assessment === 'self' ? 'selfAssessment' : 'testRecall')}
        </Txt>
      </Row>
      <Txt size={19} weight="600">
        {s.localize(shown.prompt)}
      </Txt>
      {stimulus ? (
        <Txt
          mandarin={!['en-zh', 'ar-zh', 'es-zh', 'word-order'].includes(shown.kind)}
          size={shown.kind === 'word-order' ? 20 : 34}
          serif
          style={{ textAlign: 'center', paddingVertical: 14 }}
        >
          {stimulus}
        </Txt>
      ) : null}
      {shown.kind === 'listening' ? (
        shown.audio ? (
          <Pronunciation text={shown.stimulus} audio={shown.audio} />
        ) : (
          <Txt>{s.t('listeningUnavailable')}</Txt>
        )
      ) : null}
      {shown.assessment === 'self' ? (
        <>
          <Pronunciation text={shown.stimulus} audio={shown.audio} />
          <Txt>{s.t('selfAssessment')}</Txt>
          <Button
            label={s.t('savePractice')}
            onPress={() => {
              void onAnswer(
                'self',
                false,
                Math.min(60, Math.round((Date.now() - start.current) / 1000)),
              );
            }}
          />
        </>
      ) : (
        <>
          {ordering ? (
            <>
              <View
                style={{ minHeight: 60, padding: 16, borderRadius: 12, backgroundColor: c.soft }}
              >
                <Txt mandarin size={22}>
                  {answer || '…'}
                </Txt>
              </View>
              <View style={[styles.wrap, { direction: 'ltr' }]}>
                {options?.map((option, i) => (
                  <Pressable
                    key={i}
                    accessibilityRole="button"
                    accessibilityLabel={`${option} ${i + 1}`}
                    disabled={checked || tokens.includes(i)}
                    onPress={() => {
                      const next = [...tokens, i];
                      setTokens(next);
                      setAnswer(next.map((n) => options[n]).join(''));
                    }}
                    style={{
                      minWidth: 42,
                      minHeight: 44,
                      padding: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: c.border,
                      opacity: tokens.includes(i) ? 0.3 : 1,
                    }}
                  >
                    <Txt mandarin size={20}>
                      {option}
                    </Txt>
                  </Pressable>
                ))}
              </View>
              <Button
                label={s.t('clear')}
                small
                disabled={checked}
                variant="ghost"
                onPress={() => {
                  setTokens([]);
                  setAnswer('');
                }}
              />
            </>
          ) : options?.length ? (
            <View style={{ gap: 10 }}>
              {options.map((option, i) => (
                <Pressable
                  key={`${i}-${option}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: answer === option, disabled: checked }}
                  disabled={checked}
                  onPress={() => setAnswer(option)}
                  style={{
                    padding: 17,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: answer === option ? c.red : c.border,
                    backgroundColor: answer === option ? c.redBg : c.bg,
                  }}
                >
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Txt
                      mandarin={[
                        'character-pinyin',
                        'pinyin-character',
                        'recognition',
                        'en-zh',
                        'ar-zh',
                        'es-zh',
                      ].includes(shown.kind)}
                      size={16}
                    >
                      {option}
                    </Txt>
                    <Icon
                      name={answer === option ? 'radio-button-on' : 'radio-button-off'}
                      color={answer === option ? c.red : c.muted}
                      size={19}
                    />
                  </Row>
                </Pressable>
              ))}
            </View>
          ) : (
            <Field label={s.t('answer')} value={answer} onChangeText={setAnswer} />
          )}
          {checked ? (
            <View
              accessibilityLiveRegion="polite"
              style={{
                backgroundColor: correct ? c.soft : c.redBg,
                borderRadius: 12,
                padding: 17,
                gap: 8,
              }}
            >
              <Row>
                <Icon
                  name={correct ? 'checkmark-circle-outline' : 'information-circle-outline'}
                  color={correct ? c.green : c.red}
                />
                <Txt weight="600" color={correct ? c.green : c.red}>
                  {s.t(correct ? 'correct' : 'incorrect')}
                </Txt>
              </Row>
              {!correct ? (
                <Txt mandarin>
                  {s.t('correctAnswer')}: {shown.answers.join(' / ')}
                </Txt>
              ) : null}
              <Txt size={13}>{s.localize(shown.explanation)}</Txt>
            </View>
          ) : (
            <Button
              label={s.t('check')}
              busy={busy}
              disabled={!answer.trim()}
              onPress={() => {
                void submit();
              }}
            />
          )}
          {error ? <Txt color={c.red}>{s.t('saveError')}</Txt> : null}
        </>
      )}
    </Card>
  );
}
