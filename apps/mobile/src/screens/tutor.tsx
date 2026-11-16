import React, { useState } from 'react';
import { View } from 'react-native';
import { content, useLearning, type MessageKey } from '../state';
import { ApiError } from '../api';
import { Badge, Button, Card, Chip, Field, Heading, Shell, Txt, usePalette, styles } from '../ui';
export function TutorScreen() {
  const s = useLearning(),
    c = usePalette(),
    [question, setQuestion] = useState(''),
    [reply, setReply] = useState(''),
    [error, setError] = useState<MessageKey | null>(null),
    [busy, setBusy] = useState(false),
    [level, setLevel] = useState(s.preferences.targetLevel);
  async function send() {
    setBusy(true);
    setError(null);
    try {
      // The server allows its AI provider 20s; the default 12s client
      // timeout would abort slow replies, so tutor calls get 30s.
      // The level is the one selected on this screen, not the profile's.
      const result = (await s.request(
        '/tutor',
        {
          message: question,
          locale: s.locale,
          level,
        },
        undefined,
        30000,
      )) as { reply: string };
      setReply(result.reply);
    } catch (e) {
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
                {g.structureLocalized?.[s.locale] ?? g.structure}
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
        <Field label={s.t('askTutor')} value={question} onChangeText={setQuestion} multiline />
        <Button
          label={s.t('send')}
          disabled={!question.trim() || !s.user}
          busy={busy}
          icon="arrow-up"
          onPress={() => {
            void send();
          }}
        />
        {!s.user ? (
          <Txt size={12} color={c.muted}>
            {s.t('signInRequired')}
          </Txt>
        ) : null}
        {error ? <Txt color={c.red}>{s.t(error)}</Txt> : null}
        {reply ? (
          <>
            <Txt>{reply}</Txt>
            <Txt size={10} color={c.muted}>
              {s.t('generated')}
            </Txt>
          </>
        ) : null}
      </Card>
    </Shell>
  );
}
