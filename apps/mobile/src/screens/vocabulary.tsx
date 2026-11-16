import React, { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { content, useLearning } from '../state';
import { findWord, lexicon, missingTranslation, normalizeSearch, wordMeaning } from '../lexicon';
import { partOfSpeechLabel } from '../grammar';
import {
  Badge,
  Button,
  Card,
  Chip,
  Empty,
  Field,
  Heading,
  Icon,
  Row,
  Shell,
  Txt,
  usePalette,
  styles,
} from '../ui';
import { Pronunciation, QuickPronunciation } from '../audio';
export function VocabularyScreen() {
  const s = useLearning(),
    c = usePalette(),
    [search, setSearch] = useState(''),
    [level, setLevel] = useState(0),
    [filter, setFilter] = useState('all'),
    [topic, setTopic] = useState('all'),
    [part, setPart] = useState('all'),
    [showFilters, setShowFilters] = useState(false),
    [visible, setVisible] = useState(48);
  useEffect(() => setVisible(48), [search, level, filter, topic, part]);
  const words = lexicon.filter(
    (v) =>
      (!level || v.level === level) &&
      (topic === 'all' || v.topic === topic) &&
      (part === 'all' || v.partOfSpeech === part) &&
      (filter === 'all' ||
        (filter === 'favorites' && s.progress.favorites.has(v.id)) ||
        (filter === 'learned' && s.progress.learned.has(v.id)) ||
        (filter === 'difficult' && (s.progress.reviews[v.id]?.incorrect ?? 0) > 0)) &&
      v.searchIndex.includes(normalizeSearch(search)),
  );
  return (
    <Shell active="/vocabulary">
      <Heading
        eyebrow="词汇 · VOCABULARY"
        title={s.t('vocabulary')}
        subtitle={s.t('learnedHint')}
      />
      <Card style={{ backgroundColor: c.soft, borderColor: c.soft }}>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <View style={{ flex: 1, minWidth: 200, gap: 5 }}>
            <Txt size={11} color={c.green} weight="600">
              {s.t('referenceWords').toLocaleUpperCase(s.locale)}
            </Txt>
            <Txt serif size={24}>
              11,000 · HSK 1—9
            </Txt>
            <Txt size={12} color={c.muted}>
              {s.t('referenceNotice')}
            </Txt>
          </View>
          <Txt mandarin serif size={48} color={c.red}>
            词
          </Txt>
        </Row>
        <Txt size={11} color={c.muted}>
          {s.locale !== 'en' ? `${s.t('englishOnly')} · ` : ''}
          {s.t('referenceAdvanced')}
        </Txt>
      </Card>
      <Field label={s.t('search')} value={search} onChangeText={setSearch} />
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
        {(['all', 'favorites', 'learned', 'difficult'] as const).map((f) => (
          <Chip key={f} label={s.t(f)} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>
      <Button
        small
        label={s.t('filter')}
        icon={showFilters ? 'chevron-up' : 'chevron-down'}
        variant="secondary"
        onPress={() => setShowFilters(!showFilters)}
        style={{ alignSelf: 'flex-start' }}
      />
      {showFilters ? (
        <View style={{ gap: 10 }}>
          <Txt size={11} color={c.muted}>
            {s.t('topic')} / {s.t('unit')}
          </Txt>
          <View style={styles.wrap}>
            <Chip
              label={s.t('allTopics')}
              active={topic === 'all'}
              onPress={() => setTopic('all')}
            />
            {content.stages
              .flatMap((x) => x.levels)
              .map((l) => (
                <Chip
                  key={l.number}
                  label={s.localize(l.title)}
                  active={topic === l.title.en}
                  onPress={() => setTopic(l.title.en)}
                />
              ))}
          </View>
          <Txt size={11} color={c.muted}>
            {s.t('partOfSpeech')}
          </Txt>
          <View style={styles.wrap}>
            <Chip label={s.t('allParts')} active={part === 'all'} onPress={() => setPart('all')} />
            {[...new Set(content.vocabulary.map((v) => v.partOfSpeech))].map((p) => (
              <Chip
                key={p}
                label={partOfSpeechLabel(p, s.locale)}
                active={part === p}
                onPress={() => setPart(p)}
              />
            ))}
          </View>
        </View>
      ) : null}
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt size={12} color={c.muted}>
          {words.length} {s.t('words')}
        </Txt>
        <Button
          small
          label={s.t('flashcards')}
          variant="secondary"
          icon="albums-outline"
          onPress={() => router.push('/practice?mode=flashcards')}
        />
      </Row>
      {!words.length ? (
        <Empty title={s.t('noWords')} icon="search-outline" />
      ) : (
        <View style={styles.grid}>
          {words.slice(0, visible).map((v) => (
            <View key={v.id} style={{ flexGrow: 1, width: 240 }}>
              <Card>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Badge>HSK {v.level}</Badge>
                  <Row style={{ gap: 0 }}>
                    <QuickPronunciation text={v.simplified} />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={s.t('favoriteAction')}
                      onPress={() => {
                        void s
                          .record({
                            type: 'favorite',
                            itemId: v.id,
                            value: !s.progress.favorites.has(v.id),
                          })
                          .catch(() => undefined);
                      }}
                      style={{ padding: 8 }}
                    >
                      <Icon
                        name={s.progress.favorites.has(v.id) ? 'heart' : 'heart-outline'}
                        size={19}
                        color={s.progress.favorites.has(v.id) ? c.red : c.muted}
                      />
                    </Pressable>
                  </Row>
                </Row>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${v.simplified} ${v.pinyin}`}
                  onPress={() => router.push(`/word/${v.id}`)}
                  style={{ gap: 14 }}
                >
                  <Txt mandarin serif size={36}>
                    {v.simplified}
                  </Txt>
                  <Txt mandarin color={c.red} size={14}>
                    {v.pinyin}
                  </Txt>
                  <Txt size={13}>{wordMeaning(v, s.locale)}</Txt>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Txt color={c.muted} size={10}>
                      {v.partOfSpeech
                        ? partOfSpeechLabel(v.partOfSpeech, s.locale)
                        : s.t('referenceWords')}
                    </Txt>
                    {s.progress.learned.has(v.id) ? (
                      <Icon name="checkmark-circle" color={c.green} size={17} />
                    ) : null}
                  </Row>
                </Pressable>
              </Card>
            </View>
          ))}
        </View>
      )}
      {visible < words.length ? (
        <Button
          label={`${s.t('moreWords')} · ${Math.min(visible, words.length)} / ${words.length}`}
          variant="secondary"
          onPress={() => setVisible(visible + 48)}
        />
      ) : null}
      <Txt size={10} color={c.muted}>
        {s.t('sourceAttribution')}
      </Txt>
      <Button
        small
        label={s.t('referenceSource')}
        variant="ghost"
        onPress={() => {
          void Linking.openURL('https://gushichinese.com/hsk-3.0/downloads');
        }}
      />
    </Shell>
  );
}
export function WordScreen({ id }: { id: string }) {
  const s = useLearning(),
    c = usePalette(),
    v = findWord(id);
  if (!v)
    return (
      <Shell>
        <Empty title={s.t('noItems')} />
      </Shell>
    );
  const review = s.progress.reviews[v.id];
  return (
    <Shell active="/vocabulary">
      <Button
        label={s.t('back')}
        variant="ghost"
        icon="arrow-back"
        onPress={() => router.back()}
        style={{ alignSelf: 'flex-start' }}
      />
      <Card style={{ maxWidth: 800, width: '100%', alignSelf: 'center', padding: 30, gap: 24 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Badge>
            HSK {v.level} · {s.t(v.reference ? 'referenceWords' : 'supplementary')}
          </Badge>
          <Button
            small
            label={s.t('favorites')}
            icon={s.progress.favorites.has(v.id) ? 'heart' : 'heart-outline'}
            variant="ghost"
            onPress={() => {
              void s
                .record({ type: 'favorite', itemId: v.id, value: !s.progress.favorites.has(v.id) })
                .catch(() => undefined);
            }}
          />
        </Row>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Txt mandarin serif size={60}>
            {v.simplified}
          </Txt>
          <Txt mandarin size={19} color={c.red}>
            {v.pinyin}
          </Txt>
          <Txt size={20}>{wordMeaning(v, s.locale)}</Txt>
          <Txt color={c.muted} size={12}>
            {v.partOfSpeech ? partOfSpeechLabel(v.partOfSpeech, s.locale) : s.t('referenceWords')}
            {v.traditional && v.traditional !== v.simplified
              ? ` · ${s.t('traditional')}: ${v.traditional}`
              : ''}
          </Txt>
        </View>
        {missingTranslation(v, s.locale) ? (
          <Txt size={11} color={c.muted}>
            {s.t('englishOnly')}
          </Txt>
        ) : null}
        {v.reference && v.level >= 7 ? (
          <Txt size={11} color={c.muted}>
            {s.t('referenceAdvanced')}
          </Txt>
        ) : null}
        <Pronunciation text={v.simplified} audio={v.audio} />
        <Txt size={17} weight="600">
          {s.t('examples')}
        </Txt>
        {!v.examples.length ? (
          <Txt size={12} color={c.muted}>
            {s.t('noExample')}
          </Txt>
        ) : null}
        {v.examples.map((e, i) => (
          <View key={i} style={{ gap: 8, padding: 20, backgroundColor: c.soft, borderRadius: 14 }}>
            <Txt mandarin size={24}>
              {e.chinese}
            </Txt>
            <Txt mandarin size={13} color={c.muted}>
              {e.pinyin}
            </Txt>
            <Txt>{s.localize(e.translation)}</Txt>
            <Pronunciation text={e.chinese} audio={e.audio} />
          </View>
        ))}
        <View style={styles.wrap}>
          <Button
            label={s.t(s.progress.learned.has(v.id) ? 'learned' : 'notLearned')}
            icon="checkmark"
            variant={s.progress.learned.has(v.id) ? 'primary' : 'secondary'}
            onPress={() => {
              void s
                .record({ type: 'learned', itemId: v.id, value: !s.progress.learned.has(v.id) })
                .catch(() => undefined);
            }}
          />
          <Button
            label={s.t('needsReview')}
            icon="refresh-outline"
            variant="secondary"
            onPress={() => {
              void s
                .record({
                  type: 'answer',
                  itemId: v.id,
                  correct: false,
                  quality: 1,
                  skill: 'self',
                  seconds: 0,
                })
                .catch(() => undefined);
            }}
          />
        </View>
        {review ? (
          <View style={{ gap: 7 }}>
            <Txt size={12} color={c.muted}>
              {review.reviews} {s.t('reviewHistory')} · {review.correct} / {review.reviews}
            </Txt>
            <Txt size={12} color={c.muted}>
              {s.t('tomorrow')}:{' '}
              {new Intl.DateTimeFormat(s.locale, {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(review.nextReview))}
            </Txt>
          </View>
        ) : null}
        <Txt size={10} color={c.muted}>
          {s.t('reviewNeeded')} · {v.sourceId}
        </Txt>
      </Card>
    </Shell>
  );
}
