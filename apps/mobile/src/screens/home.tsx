import React from 'react';
import { Image, Pressable, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { dueItems, streak } from '../../../../packages/core/src';
import { getReferenceLesson, referenceLessons } from '../reference-lessons';
import { findWord } from '../lexicon';
import { content, useLearning } from '../state';
import {
  Badge,
  Button,
  Card,
  Heading,
  Icon,
  Meter,
  Row,
  SectionTitle,
  Shell,
  Txt,
  usePalette,
  styles,
} from '../ui';
import { OnboardingScreen } from './onboarding';
import journeyArt from '../../assets/journey-art.png';
export function HomeScreen() {
  const s = useLearning(),
    c = usePalette(),
    { width } = useWindowDimensions();
  if (s.ready && !s.preferences.onboarded) return <OnboardingScreen />;
  const level = content.stages
    .flatMap((x) => x.levels)
    .find((x) => x.number === s.preferences.targetLevel)!;
  const lessons = level.units.flatMap((x) => x.lessons);
  const next =
    lessons.find((l) => !s.progress.lessons.has(l.id)) ??
    getReferenceLesson(
      referenceLessons(level.number).find((l) => !s.progress.lessons.has(l.id))?.id ?? '',
    );
  const due = dueItems(s.events);
  const today = new Date().toISOString().slice(0, 10);
  const minutes = Math.floor((s.progress.activity[today] ?? 0) / 60);
  const currentStreak = streak(s.progress.activity);
  // Word of the day rotates deterministically by UTC day across the
  // target level's supplementary words, so it actually changes daily
  // and is the same on every device for a given day.
  const levelWords = content.vocabulary.filter((v) => v.level === s.preferences.targetLevel);
  const dayNumber = Math.floor(Date.now() / 86400000);
  const word = levelWords[dayNumber % levelWords.length]!;
  const recent = Object.entries(s.progress.reviews)
    .sort(([, a], [, b]) => b.lastReview.localeCompare(a.lastReview))
    .slice(0, 4);
  const xp = s.progress.correct + 10 * s.progress.lessons.size;
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 6 + i);
    return d;
  });
  const week = dates.map((d) => s.progress.activity[d.toISOString().slice(0, 10)] ?? 0);
  const maxWeek = Math.max(60, ...week);
  const achievements = [
    { key: 'firstLesson' as const, earned: s.progress.lessons.size > 0 },
    { key: 'fiveWords' as const, earned: s.progress.learned.size >= 5 },
    { key: 'sevenDays' as const, earned: currentStreak >= 7 },
  ];
  const wide = width > 1250;
  return (
    <Shell active="/">
      <Heading
        eyebrow={new Intl.DateTimeFormat(s.locale, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }).format(new Date())}
        title={s.t('greeting')}
        subtitle={s.t('subtitle')}
      />
      <View style={[styles.grid, { flexDirection: wide ? 'row' : 'column' }]}>
        <View style={{ flex: wide ? 2 : undefined, gap: 22 }}>
          <Card
            style={{
              backgroundColor: '#242822',
              borderColor: '#242822',
              padding: 28,
              overflow: 'hidden',
              minHeight: 238,
            }}
          >
            <Row style={{ alignItems: 'stretch', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, gap: 14, zIndex: 1 }}>
                <Badge red>
                  HSK {level.number} ·{' '}
                  {s.localize(content.stages[Math.floor((level.number - 1) / 3)]!.title)}
                </Badge>
                <Txt serif size={29} color="#fffef8" style={{ maxWidth: 390, lineHeight: 37 }}>
                  {s.localize(next?.title ?? level.title)}
                </Txt>
                <Txt size={12} color="#c6cbbd" style={{ maxWidth: 330 }}>
                  {next ? s.localize(next.objective) : s.t('allDone')}
                </Txt>
                <View style={{ alignSelf: s.rtl ? 'flex-end' : 'flex-start', marginTop: 6 }}>
                  <Button
                    label={s.t(next ? 'continue' : 'learn')}
                    icon="arrow-forward"
                    variant="inverse"
                    onPress={() => router.push(next ? `/lesson/${next.id}` : '/learn')}
                  />
                </View>
              </View>
              <View
                style={{
                  width: width > 650 ? 170 : 82,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    height: 178,
                    width: 178,
                    borderRadius: 100,
                    borderWidth: 1,
                    borderColor: c.red,
                    opacity: 0.17,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    height: 139,
                    width: 139,
                    borderRadius: 100,
                    borderWidth: 1,
                    borderColor: c.red,
                    opacity: 0.12,
                  }}
                />
                <Image
                  source={journeyArt}
                  accessibilityIgnoresInvertColors
                  accessible={false}
                  resizeMode="contain"
                  style={{ width: width > 650 ? 190 : 110, height: width > 650 ? 190 : 110 }}
                />
              </View>
            </Row>
          </Card>
          <View style={styles.grid}>
            {[
              {
                label: s.t('dailyGoal'),
                value: `${minutes} / ${s.preferences.dailyMinutes}`,
                unit: s.t('minutes'),
                icon: 'time-outline' as const,
              },
              {
                label: s.t('streak'),
                value: String(currentStreak),
                unit: s.t(currentStreak === 1 ? 'day' : 'days'),
                icon: 'flame-outline' as const,
              },
              {
                label: s.t('due'),
                value: String(due.length),
                unit: s.t('items'),
                icon: 'refresh-outline' as const,
              },
            ].map((x, i) => (
              <Card key={x.label} style={{ flex: 1, minWidth: 88, padding: 14, gap: 12 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Icon name={x.icon} size={19} color={i === 1 ? c.red : c.green} />
                </Row>
                <Txt size={27} weight="500">
                  {x.value}
                  <Txt size={10} color={c.muted}>
                    {' '}
                    {x.unit}
                  </Txt>
                </Txt>
                <Txt size={11} color={c.muted}>
                  {x.label}
                </Txt>
                {i === 0 ? <Meter value={minutes / s.preferences.dailyMinutes} /> : null}
              </Card>
            ))}
          </View>
          <SectionTitle
            title={s.t('yourPath')}
            action={s.t('viewAll')}
            onPress={() => router.push('/learn')}
          />
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {lessons.map((l, i) => (
              <Pressable
                key={l.id}
                accessibilityRole="button"
                onPress={() => router.push(`/lesson/${l.id}`)}
                style={{ padding: 20, borderTopWidth: i ? 1 : 0, borderColor: c.border }}
              >
                <Row>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 13,
                      backgroundColor: s.progress.lessons.has(l.id) ? c.soft : c.redBg,
                    }}
                  >
                    <Icon
                      name={s.progress.lessons.has(l.id) ? 'checkmark' : 'book-outline'}
                      color={s.progress.lessons.has(l.id) ? c.green : c.red}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Txt size={13} weight="600">
                      {s.localize(l.title)}
                    </Txt>
                    <Txt color={c.muted} size={10}>
                      {s.t('lesson')} {i + 1} · {l.vocabularyIds.length} {s.t('newWords')} ·{' '}
                      {l.estimatedMinutes} {s.t('minutes')}
                    </Txt>
                  </View>
                  <Icon
                    name={s.rtl ? 'chevron-back' : 'chevron-forward'}
                    size={17}
                    color={c.muted}
                  />
                </Row>
              </Pressable>
            ))}
          </Card>
          <SectionTitle title={s.t('quickPractice')} />
          <View style={styles.grid}>
            {[
              {
                key: 'flashcards' as const,
                icon: 'albums-outline' as const,
                path: '/practice?mode=flashcards',
                note: s.t('testRecall'),
              },
              {
                key: 'characters' as const,
                icon: 'brush-outline' as const,
                path: '/practice?mode=writing',
                note: s.t('writeHint'),
              },
              {
                key: 'reading' as const,
                icon: 'book-outline' as const,
                path: '/library',
                note: s.t('librarySub'),
              },
              {
                key: 'listening' as const,
                icon: 'volume-medium-outline' as const,
                path: '/practice?mode=listening',
                note: s.t('listenOnly'),
              },
              {
                key: 'practiceExam' as const,
                icon: 'document-text-outline' as const,
                path: '/exam',
                note: s.t('examNote'),
              },
              {
                key: 'tutor' as const,
                icon: 'chatbubble-ellipses-outline' as const,
                path: '/tutor',
                note: s.t('tutorNote'),
              },
            ].map((x) => (
              <Pressable
                key={x.key}
                accessibilityRole="button"
                onPress={() => router.push(x.path as '/practice')}
                style={{ flex: 1, minWidth: 150 }}
              >
                <Card style={{ flex: 1, padding: 20 }}>
                  <Icon name={x.icon} color={c.green} size={24} />
                  <Txt size={13} weight="600">
                    {s.t(x.key)}
                  </Txt>
                  <Txt size={11} color={c.muted} numberOfLines={2}>
                    {x.note}
                  </Txt>
                </Card>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={{ flex: wide ? 1 : undefined, gap: 22 }}>
          <Card style={{ backgroundColor: c.soft, borderColor: c.soft, gap: 17 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Icon name="refresh-outline" color={c.green} />
              <Badge>
                {due.length} {s.t('items')}
              </Badge>
            </Row>
            <Txt serif size={24}>
              {s.t(due.length ? 'reviewNow' : 'emptyReview')}
            </Txt>
            <Txt color={c.muted} size={12}>
              {s.t(due.length ? 'assessHint' : 'emptyReviewSub')}
            </Txt>
            <Button
              variant="secondary"
              label={s.t(due.length ? 'reviewNow' : 'start')}
              icon="arrow-forward"
              onPress={() => router.push(due.length ? '/practice?mode=due' : '/learn')}
              style={{ borderWidth: 1, borderColor: c.border }}
            />
          </Card>
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ gap: 4 }}>
                <Txt size={11} color={c.muted}>
                  {s.t('xpLabel')}
                </Txt>
                <Txt serif size={27}>
                  {xp} XP
                </Txt>
              </View>
              <View style={{ gap: 4 }}>
                <Txt size={11} color={c.muted}>
                  {s.t('wordsLearned')}
                </Txt>
                <Txt serif size={27}>
                  {s.progress.learned.size}
                </Txt>
              </View>
            </Row>
            <Txt size={10} color={c.muted}>
              {s.t('xpExplanation')}
            </Txt>
            <Txt weight="600" size={12}>
              {s.t('achievements')}
            </Txt>
            <View style={styles.wrap}>
              {achievements.map((a) => (
                <Badge key={a.key} red={a.earned}>
                  {a.earned ? '✓ ' : ''}
                  {s.t(a.key)}
                </Badge>
              ))}
            </View>
            <Txt weight="600" size={12}>
              {s.t('weeklyActivity')}
            </Txt>
            <Row style={{ alignItems: 'flex-end', height: 56, justifyContent: 'space-between' }}>
              {week.map((seconds, i) => (
                <View
                  key={i}
                  accessibilityLabel={`${dates[i]!.toISOString().slice(0, 10)}: ${Math.floor(seconds / 60)} min`}
                  style={{
                    flex: 1,
                    height: Math.max(4, (52 * seconds) / maxWeek),
                    backgroundColor: seconds ? c.green : c.soft,
                    borderRadius: 5,
                  }}
                />
              ))}
            </Row>
          </Card>
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt size={11} color={c.muted}>
                {s.t('wordDay')}
              </Txt>
              <Icon name="sunny-outline" size={17} color={c.red} />
            </Row>
            <View style={{ alignItems: 'center', paddingVertical: 12, gap: 8 }}>
              <Txt mandarin serif size={58} style={{ textAlign: 'center' }}>
                {word.simplified}
              </Txt>
              <Txt mandarin color={c.red} size={15}>
                {word.pinyin}
              </Txt>
              <Txt size={13} color={c.muted} style={{ textAlign: 'center' }}>
                {s.localize(word.translation)}
              </Txt>
            </View>
            <View style={{ borderTopWidth: 1, borderColor: c.border, paddingTop: 14, gap: 5 }}>
              <Txt mandarin size={15}>
                {word.examples[0]!.chinese}
              </Txt>
              <Txt size={11} color={c.muted}>
                {s.localize(word.examples[0]!.translation)}
              </Txt>
            </View>
            <Button
              variant="ghost"
              label={s.t('open')}
              icon="arrow-forward"
              onPress={() => router.push(`/word/${word.id}`)}
            />
          </Card>
          {recent.length ? (
            <Card>
              <Txt weight="600">{s.t('recent')}</Txt>
              {recent.map(([id]) => {
                const v = findWord(id);
                return v ? (
                  <Pressable key={id} onPress={() => router.push(`/word/${id}`)}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Txt mandarin size={20}>
                        {v.simplified}
                      </Txt>
                      <Txt size={11} color={c.muted}>
                        {v.pinyin}
                      </Txt>
                    </Row>
                  </Pressable>
                ) : null;
              })}
            </Card>
          ) : null}
          <Txt size={10} color={c.muted}>
            {s.t('sourceNote')}
          </Txt>
        </View>
      </View>
    </Shell>
  );
}
