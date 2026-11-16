import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { streak } from '../../../../packages/core/src';
import { referenceLessons } from '../reference-lessons';
import { findWord, lexicon } from '../lexicon';
import { content, useLearning } from '../state';
import {
  Badge,
  Button,
  Card,
  Empty,
  Heading,
  Meter,
  Row,
  SectionTitle,
  Shell,
  Txt,
  usePalette,
  styles,
} from '../ui';
export function ProgressScreen() {
  const s = useLearning(),
    c = usePalette();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (6 - i));
    return d;
  });
  const values = dates.map((d) => s.progress.activity[d.toISOString().slice(0, 10)] ?? 0),
    max = Math.max(...values, 60);
  const upcoming = Object.entries(s.progress.reviews)
    .sort(([, a], [, b]) => a.nextReview.localeCompare(b.nextReview))
    .slice(0, 8);
  const seconds = Object.values(s.progress.activity).reduce((a, b) => a + b, 0);
  const totalLessons =
    content.stages
      .flatMap((x) => x.levels)
      .flatMap((l) => l.units)
      .flatMap((u) => u.lessons).length +
    Array.from({ length: 9 }, (_, i) => referenceLessons(i + 1).length).reduce((a, b) => a + b, 0);
  return (
    <Shell active="/progress">
      <Heading
        eyebrow="成长 · PROGRESS"
        title={s.t('progressTitle')}
        subtitle={s.t('progressSub')}
      />
      {!s.events.some((e) => e.type === 'answer' || e.type === 'lesson' || e.type === 'writing') ? (
        <Empty
          title={s.t('noActivity')}
          subtitle={s.t('noActivitySub')}
          action={<Button label={s.t('start')} onPress={() => router.push('/learn')} />}
        />
      ) : null}
      <View style={styles.grid}>
        {[
          { label: s.t('studyTime'), value: `${Math.floor(seconds / 60)} ${s.t('minutes')}` },
          { label: s.t('lessonsDone'), value: `${s.progress.lessons.size} / ${totalLessons}` },
          { label: s.t('wordsLearned'), value: String(s.progress.learned.size) },
          {
            label: s.t('reviewAccuracy'),
            value: s.progress.total
              ? `${Math.round((s.progress.correct / s.progress.total) * 100)}%`
              : '—',
          },
        ].map((x) => (
          <Card key={x.label} style={{ flex: 1, minWidth: 150 }}>
            <Txt size={29} weight="500">
              {x.value}
            </Txt>
            <Txt size={11} color={c.muted}>
              {x.label}
            </Txt>
          </Card>
        ))}
      </View>
      <View style={styles.grid}>
        <Card style={{ flex: 2, minWidth: 260 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt size={17} weight="600">
              {s.t('weekly')}
            </Txt>
            <Badge>
              {streak(s.progress.activity)} {s.t('days')}
            </Badge>
          </Row>
          <Row
            style={{
              height: 180,
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 15,
              paddingTop: 25,
            }}
          >
            {dates.map((d, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: '100%',
                  justifyContent: 'flex-end',
                  gap: 9,
                  alignItems: 'center',
                }}
              >
                <Txt size={10} color={c.muted}>
                  {Math.round(values[i]! / 60)}m
                </Txt>
                <View
                  accessibilityLabel={`${new Intl.DateTimeFormat(s.locale, { weekday: 'long', timeZone: 'UTC' }).format(d)} ${Math.round(values[i]! / 60)} ${s.t('minutes')}`}
                  style={{
                    width: '100%',
                    maxWidth: 48,
                    height: Math.max(3, (values[i]! / max) * 110),
                    borderRadius: 7,
                    backgroundColor: i === 6 ? c.red : c.green,
                    opacity: values[i] ? 1 : 0.15,
                  }}
                />
                <Txt size={10} color={c.muted}>
                  {new Intl.DateTimeFormat(s.locale, { weekday: 'short', timeZone: 'UTC' }).format(
                    d,
                  )}
                </Txt>
              </View>
            ))}
          </Row>
          <Txt size={10} color={c.muted}>
            {s.t('studyDays')} {s.t('captureTime')}
          </Txt>
        </Card>
        <Card style={{ flex: 1, minWidth: 240 }}>
          <Txt size={17} weight="600">
            {s.t('bySkill')}
          </Txt>
          {['vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'writing'].map((skill) => {
            const value = s.progress.skills[skill];
            return (
              <View key={skill} style={{ gap: 7 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt size={12}>{s.t(`${skill}Skill` as 'vocabularySkill')}</Txt>
                  <Txt size={11} color={c.muted}>
                    {value ? `${value.correct} / ${value.total}` : '—'}
                  </Txt>
                </Row>
                <Meter value={value ? value.correct / value.total : 0} />
              </View>
            );
          })}
          <Txt size={10} color={c.muted}>
            {s.t('selfAssessment')}
          </Txt>
        </Card>
      </View>
      <SectionTitle title={s.t('yourPath')} />
      <View style={styles.grid}>
        {content.stages
          .flatMap((x) => x.levels)
          .map((l) => {
            const lessons = [...l.units.flatMap((u) => u.lessons), ...referenceLessons(l.number)],
              done = lessons.filter((x) => s.progress.lessons.has(x.id)).length;
            return (
              <Card key={l.number} style={{ width: 200, flexGrow: 1 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt weight="600">HSK {l.number}</Txt>
                  <Txt size={11} color={c.muted}>
                    {done}/{lessons.length}
                  </Txt>
                </Row>
                <Meter value={done / lessons.length} />
              </Card>
            );
          })}
      </View>
      <SectionTitle title={s.t('upcoming')} />
      {upcoming.length ? (
        <Card>
          {upcoming.map(([id, r]) => {
            const item = findWord(id);
            return (
              <Row key={id} style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <Txt mandarin size={20}>
                  {item?.simplified ?? content.grammar.find((g) => g.id === id)?.structure ?? id}
                </Txt>
                <Txt size={11} color={c.muted}>
                  {new Intl.DateTimeFormat(s.locale, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(r.nextReview))}
                </Txt>
              </Row>
            );
          })}
          <Button
            label={s.t('reviewNow')}
            variant="secondary"
            onPress={() => router.push('/practice?mode=due')}
          />
        </Card>
      ) : (
        <Txt color={c.muted}>{s.t('noneDue')}</Txt>
      )}
      <SectionTitle title={s.t('difficult')} />
      <View style={styles.wrap}>
        {lexicon
          .filter((v) => (s.progress.reviews[v.id]?.incorrect ?? 0) > 0)
          .slice(0, 30)
          .map((v) => (
            <Button
              key={v.id}
              label={`${v.simplified} · ${v.pinyin}`}
              variant="secondary"
              onPress={() => router.push(`/word/${v.id}`)}
            />
          ))}
      </View>
    </Shell>
  );
}
