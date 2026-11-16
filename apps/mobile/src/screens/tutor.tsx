import React, { useState } from 'react';
import { View } from 'react-native';
import { content, useLearning, type MessageKey } from '../state';
import { ApiError } from '../api';
import { Badge, Button, Card, Chip, Field, Heading, Shell, Txt, usePalette, styles } from '../ui';
type TutorMode = 'explain' | 'correct' | 'conversation';
export function TutorScreen() {
  const s = useLearning(),
    c = usePalette(),
    [question, setQuestion] = useState(''),
    [history, setHistory] = useState<{ question: string; reply: string }[]>([]),
    [error, setError] = useState<MessageKey | null>(null),
    [busy, setBusy] = useState(false),
    [mode, setMode] = useState<TutorMode>('explain'),
    [lastAttempt, setLastAttempt] = useState<{ text: string; message: string } | null>(null),
    [level, setLevel] = useState(s.preferences.targetLevel);
  function compose(text: string): string {
    // Mode presets wrap the learner's text in a short instruction.
    // The learner's own words are always sent verbatim after it.
    if (mode === 'correct')
      return `Please correct this Chinese sentence. Show the corrected sentence first, then briefly explain each change.\n\n${text}`;
    if (mode === 'conversation')
      return `You are my Chinese conversation partner. Reply in Chinese at about HSK ${level}, keep it short, and end with one question for me.\n\n${text}`;
    return text;
  }
  async function send(text: string, message: string) {
    setBusy(true);
    setError(null);
    try {
      // The server allows its AI provider 20s; the default 12s client
      // timeout would abort slow replies, so tutor calls get 30s.
      // The level is the one selected on this screen, not the profile's.
      const result = (await s.request(
        '/tutor',
        {
          message,
          locale: s.locale,
          level,
        },
        undefined,
        30000,
      )) as { reply: string };
      setHistory((h) => [...h, { question: text, reply: result.reply }]);
      setQuestion('');
      setLastAttempt(null);
    } catch (e) {
      // Keep the exact payload so the learner can retry deliberately.
      // A retry can reach the provider twice if the first response was
      // lost after processing; it is never sent automatically.
      setLastAttempt({ text, message });
      setError(
        e instanceof ApiError && e.code === 'TUTOR_NOT_CONFIGURED'
          ? 'TUTOR_NOT_CONFIGURED'
          : 'serviceError',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell active="/tutor">
      <Heading eyebrow="问答 · TUTOR" title={s.t('tutorTitle')} subtitle={s.t('tutorNote')} />
      <Card>
        <Badge>{s.t('offlineGuide')}</Badge>
        <View style={styles.wrap}>
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
            <Chip key={n} label={`HSK ${n}`} active={level === n} onPress={() => setLevel(n)} />
          ))}
        </View>
        {content.grammar
          .filter((g) => g.level === level)
          .map((g) => (
            <View key={g.id} style={{ gap: 14 }}>
              <Txt serif size={27}>
                {s.localize(g.point)}
              </Txt>
              <Txt mandarin size={22} color={c.red}>
                {g.structureLocalized ? s.localize(g.structureLocalized) : g.structure}
              </Txt>
              <Txt>{s.localize(g.explanation)}</Txt>
              <View style={{ padding: 20, backgroundColor: c.soft, borderRadius: 14, gap: 8 }}>
                <Txt mandarin size={23}>
                  {g.examples[0]!.chinese}
                </Txt>
                <Txt mandarin color={c.muted}>
                  {g.examples[0]!.pinyin}
                </Txt>
                <Txt>{s.localize(g.examples[0]!.translation)}</Txt>
              </View>
              <Txt color={c.red} size={12}>
                {s.t('mistake')}: {s.localize(g.commonMistake)}
              </Txt>
              <Txt size={10} color={c.muted}>
                {s.t('supplementary')} · {s.t('reviewNeeded')}
              </Txt>
            </View>
          ))}
      </Card>
      <Card>
        <Txt weight="600">{s.t('askTutor')}</Txt>
        <View style={styles.wrap}>
          {(
            [
              ['explain', 'tutorExplain'],
              ['correct', 'tutorCorrect'],
              ['conversation', 'tutorConverse'],
            ] as [TutorMode, MessageKey][]
          ).map(([m, key]) => (
            <Chip key={m} label={s.t(key)} active={mode === m} onPress={() => setMode(m)} />
          ))}
        </View>
        {history.length ? (
          <View style={{ gap: 14 }}>
            {history.map((turn, i) => (
              <View key={i} style={{ gap: 6 }}>
                <Txt size={13} color={c.muted}>
                  {turn.question}
                </Txt>
                <Txt>{turn.reply}</Txt>
                <Txt size={10} color={c.muted}>
                  {s.t('generated')}
                </Txt>
              </View>
            ))}
            <Txt size={10} color={c.muted}>
              {s.t('historyNote')}
            </Txt>
          </View>
        ) : null}
        <Field label={s.t('askTutor')} value={question} onChangeText={setQuestion} multiline />
        <Button
          label={s.t('send')}
          disabled={!question.trim() || !s.user || busy}
          busy={busy}
          icon="arrow-up"
          onPress={() => {
            const text = question.trim();
            void send(text, compose(text));
          }}
        />
        {!s.user ? (
          <Txt size={12} color={c.muted}>
            {s.t('signInRequired')}
          </Txt>
        ) : null}
        {error ? (
          <>
            <Txt color={c.red}>{s.t(error)}</Txt>
            {lastAttempt ? (
              <Button
                label={s.t('retry')}
                variant="secondary"
                disabled={busy}
                onPress={() => void send(lastAttempt.text, lastAttempt.message)}
              />
            ) : null}
          </>
        ) : null}
      </Card>
    </Shell>
  );
}
