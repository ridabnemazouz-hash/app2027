import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { content, useLearning } from '../state';
import {
  Badge,
  Button,
  Card,
  Chip,
  Empty,
  Heading,
  Icon,
  Row,
  Shell,
  Txt,
  usePalette,
  styles,
} from '../ui';
import { ExercisePlayer } from '../exercise';
import { Pronunciation } from '../audio';
export function LibraryScreen() {
  const s = useLearning(),
    c = usePalette(),
    [level, setLevel] = useState(0),
    [bookmarks, setBookmarks] = useState(false);
  const readings = content.readings.filter(
    (r) => (!level || r.level === level) && (!bookmarks || s.progress.bookmarks.has(r.id)),
  );
  return (
    <Shell active="/library">
      <Heading eyebrow="阅读 · LIBRARY" title={s.t('libraryTitle')} subtitle={s.t('librarySub')} />
      <View style={styles.wrap}>
        {Array.from({ length: 10 }, (_, i) => (
          <Chip
            key={i}
            label={i ? `HSK ${i}` : s.t('all')}
            active={level === i}
            onPress={() => setLevel(i)}
          />
        ))}
      </View>
      <View style={styles.wrap}>
        <Chip
          label={s.t('bookmarks')}
          active={bookmarks}
          onPress={() => setBookmarks(!bookmarks)}
        />
      </View>
      {!readings.length ? (
        <Empty title={s.t('noBookmarks')} />
      ) : (
        <View style={styles.grid}>
          {readings.map((r, i) => (
            <Pressable
              accessibilityRole="button"
              key={r.id}
              onPress={() => router.push(`/reader/${r.id}`)}
              style={{ flexGrow: 1, width: 280 }}
            >
              <Card style={{ padding: 0, overflow: 'hidden', height: '100%' }}>
                <View
                  style={{
                    padding: 24,
                    height: 170,
                    backgroundColor: i % 2 ? c.soft : c.redBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      position: 'absolute',
                      height: 128,
                      width: 128,
                      borderRadius: 90,
                      borderWidth: 1,
                      borderColor: i % 2 ? c.green : c.red,
                      opacity: 0.16,
                    }}
                  />
                  <Txt mandarin serif size={62} color={i % 2 ? c.green : c.red}>
                    {content.vocabulary
                      .find((v) => v.id === r.vocabularyIds[0])
                      ?.simplified.slice(0, 2)}
                  </Txt>
                  <View style={{ position: 'absolute', top: 16, left: 16 }}>
                    <Badge>HSK {r.level}</Badge>
                  </View>
                </View>
                <View style={{ padding: 22, gap: 14 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Txt size={20} serif style={{ flex: 1 }}>
                      {s.localize(r.title)}
                    </Txt>
                    {s.progress.readings.has(r.id) ? (
                      <Icon name="checkmark-circle" color={c.green} />
                    ) : (
                      <Icon name="arrow-forward" size={19} />
                    )}
                  </Row>
                  <Txt mandarin numberOfLines={2} color={c.muted} size={14}>
                    {r.paragraphs.map((p) => p.chinese).join(' ')}
                  </Txt>
                  <Txt size={10} color={c.muted}>
                    {s.t('supplementary')} · {s.t('reviewNeeded')}
                  </Txt>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Shell>
  );
}
export function ReaderScreen({ id }: { id: string }) {
  const s = useLearning(),
    c = usePalette(),
    reading = content.readings.find((r) => r.id === id),
    [pinyin, setPinyin] = useState(true),
    [translation, setTranslation] = useState(false),
    [answered, setAnswered] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  if (!reading)
    return (
      <Shell>
        <Empty title={s.t('noItems')} />
      </Shell>
    );
  const vocab = content.vocabulary.filter((v) => reading.vocabularyIds.includes(v.id));
  function segmented(text: string) {
    const pattern = new RegExp(
      `(${vocab
        .map((v) => v.simplified)
        .sort((a, b) => b.length - a.length)
        .join('|')})`,
      'g',
    );
    return text.split(pattern).map((part, i) => {
      const v = vocab.find((v) => v.simplified === part);
      return (
        <Text
          key={i}
          accessibilityRole={v ? 'link' : undefined}
          onPress={v ? () => router.push(`/word/${v.id}`) : undefined}
          style={v ? { color: c.red, textDecorationLine: 'underline' } : undefined}
        >
          {part}
        </Text>
      );
    });
  }
  return (
    <Shell active="/library">
      <View style={{ maxWidth: 830, width: '100%', alignSelf: 'center', gap: 24 }}>
        <Button
          label={s.t('back')}
          variant="ghost"
          onPress={() => router.back()}
          style={{ alignSelf: 'flex-start' }}
        />
        <Heading
          eyebrow={`HSK ${reading.level} · ${s.t('supplementary')}`}
          title={s.localize(reading.title)}
        />
        <View style={styles.wrap}>
          <Chip label={s.t('pinyin')} active={pinyin} onPress={() => setPinyin(!pinyin)} />
          <Chip
            label={s.t('translation')}
            active={translation}
            onPress={() => setTranslation(!translation)}
          />
          <Chip
            label={s.t('bookmark')}
            active={s.progress.bookmarks.has(id)}
            onPress={() => {
              void s
                .record({ type: 'bookmark', itemId: id, value: !s.progress.bookmarks.has(id) })
                .catch(() => setError(true));
            }}
          />
        </View>
        <Card style={{ padding: 30, gap: 30 }}>
          {reading.paragraphs.map((p, i) => (
            <View key={i} style={{ gap: 10 }}>
              <Txt mandarin size={27} style={{ lineHeight: 43 }}>
                {segmented(p.chinese)}
              </Txt>
              {pinyin ? (
                <Txt mandarin color={c.muted}>
                  {p.pinyin}
                </Txt>
              ) : null}
              {translation ? <Txt>{s.localize(p.translation)}</Txt> : null}
              <Pronunciation text={p.chinese} audio={p.audio} />
            </View>
          ))}
        </Card>
        <Txt weight="600" size={19}>
          {s.t('comprehension')}
        </Txt>
        {reading.exercises.map((e) => (
          <ExercisePlayer
            key={e.id}
            exercise={e}
            onAnswer={async (_answer, correct, seconds) => {
              await s.record({
                type: 'answer',
                itemId: e.itemId,
                correct,
                quality: correct ? 4 : 1,
                skill: 'reading',
                seconds,
              });
              setAnswered(true);
            }}
          />
        ))}
        <Button
          label={s.t(s.progress.readings.has(id) ? 'readDone' : 'markRead')}
          disabled={!answered || s.progress.readings.has(id)}
          busy={busy}
          icon="checkmark"
          onPress={() => {
            setBusy(true);
            void s
              .record({ type: 'reading', itemId: id })
              .catch(() => setError(true))
              .finally(() => setBusy(false));
          }}
        />
        <Txt size={10} color={c.muted}>
          {s.t('reviewNeeded')} · {reading.sourceId}
        </Txt>
        {error ? <Txt color={c.red}>{s.t('saveError')}</Txt> : null}
      </View>
    </Shell>
  );
}
