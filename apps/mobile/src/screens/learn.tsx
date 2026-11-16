import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { content, useLearning } from '../state';
import { lexicon } from '../lexicon';
import { referenceLessons } from '../reference-lessons';
import { selectExercises } from '../localized-exercise';
import {
  Badge,
  Button,
  Card,
  Heading,
  Icon,
  Meter,
  Row,
  Shell,
  Txt,
  usePalette,
  styles,
} from '../ui';
export function LearnScreen() {
  const s = useLearning(),
    c = usePalette(),
    [selected, setSelected] = useState(s.preferences.targetLevel),
    [visible, setVisible] = useState(10);
  const level = content.stages.flatMap((s) => s.levels).find((l) => l.number === selected)!;
  return (
    <Shell active="/learn">
      <Heading eyebrow="HSK 1—9" title={s.t('curriculumTitle')} subtitle={s.t('curriculumSub')} />
      <Txt size={12} color={c.muted}>
        {s.t('sourceNote')}
      </Txt>
      {content.stages.map((stage) => (
        <View key={stage.id} style={{ gap: 12 }}>
          <Row>
            <Txt size={11} weight="600" color={c.muted} style={{ letterSpacing: 1 }}>
              {s.localize(stage.title).toLocaleUpperCase(s.locale)}
            </Txt>
            <View style={{ height: 1, backgroundColor: c.border, flex: 1 }} />
          </Row>
          <View style={styles.grid}>
            {stage.levels.map((l) => {
              const lessons = [...l.units.flatMap((u) => u.lessons), ...referenceLessons(l.number)],
                done = lessons.filter((x) => s.progress.lessons.has(x.id)).length;
              return (
                <Pressable
                  key={l.number}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selected === l.number }}
                  onPress={() => {
                    setSelected(l.number);
                    setVisible(10);
                  }}
                  style={{ flex: 1, minWidth: 170 }}
                >
                  <Card
                    style={{
                      height: '100%',
                      borderColor: selected === l.number ? c.red : c.border,
                      backgroundColor: selected === l.number ? c.redBg : c.card,
                    }}
                  >
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Txt size={12} weight="600" color={selected === l.number ? c.red : c.muted}>
                        HSK {l.number}
                      </Txt>
                      {s.preferences.targetLevel === l.number ? (
                        <Icon name="flag-outline" size={15} color={c.red} />
                      ) : (
                        <Icon name="arrow-up-outline" size={15} color={c.muted} />
                      )}
                    </Row>
                    <Txt size={18} serif>
                      {s.localize(l.title)}
                    </Txt>
                    <Txt size={10} color={c.muted}>
                      {l.units.length + Math.ceil(referenceLessons(l.number).length / 5)}{' '}
                      {s.t('unit')} · {lessons.length} {s.t('lessons')} ·{' '}
                      {lexicon.filter((v) => v.level === l.number).length} {s.t('words')}
                    </Txt>
                    <Meter value={done / lessons.length} />
                    <Txt size={10} color={c.muted}>
                      {done} / {lessons.length} {s.t('complete')}
                    </Txt>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      <Card>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <View style={{ gap: 5 }}>
            <Badge red>HSK {level.number}</Badge>
            <Txt serif size={26}>
              {s.localize(level.title)}
            </Txt>
          </View>
          <Button
            label={s.t('setTarget')}
            variant="secondary"
            onPress={() => {
              void s.setPreferences({ targetLevel: level.number });
            }}
          />
        </Row>
        <Txt size={12} color={c.muted}>
          {s.localize(level.description)}
        </Txt>
        {level.number >= 7 ? (
          <Txt size={12} color={c.muted}>
            {s.t('advancedNote')}
          </Txt>
        ) : null}
        <Txt weight="600">{s.t('goals')}</Txt>
        {level.objectives.map((o, i) => (
          <Txt key={i} size={12} color={c.muted}>
            {s.localize(o)}
          </Txt>
        ))}
        {level.number >= 7 ? (
          <Txt size={11} color={c.muted}>
            {s.t('referenceAdvanced')}
          </Txt>
        ) : null}
        {level.units.map((unit) => (
          <View key={unit.id} style={{ gap: 12 }}>
            <Txt weight="600">{s.localize(unit.title)}</Txt>
            {unit.lessons.map((l, i) => (
              <Pressable
                key={l.id}
                accessibilityRole="button"
                onPress={() => router.push(`/lesson/${l.id}`)}
              >
                <Row style={{ paddingVertical: 14, borderTopWidth: 1, borderColor: c.border }}>
                  <View
                    style={{
                      height: 36,
                      width: 36,
                      borderRadius: 12,
                      backgroundColor: c.soft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {s.progress.lessons.has(l.id) ? (
                      <Icon name="checkmark" color={c.green} />
                    ) : (
                      <Txt color={c.green}>{String(i + 1).padStart(2, '0')}</Txt>
                    )}
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Txt weight="600" size={14}>
                      {s.localize(l.title)}
                    </Txt>
                    <Txt color={c.muted} size={11}>
                      {l.estimatedMinutes} {s.t('minutes')} ·{' '}
                      {selectExercises(l.exercises, s.locale).length} {s.t('practice')}
                    </Txt>
                  </View>
                  <Icon name={s.rtl ? 'chevron-back' : 'chevron-forward'} size={18} />
                </Row>
              </Pressable>
            ))}
          </View>
        ))}
        <View style={{ gap: 10, paddingTop: 16 }}>
          <Txt weight="600">
            {s.t('referenceWords')} · {referenceLessons(level.number).length} {s.t('lessons')}
          </Txt>
          <Txt size={11} color={c.muted}>
            {s.t('referenceNotice')}
            {s.locale !== 'en' ? ` · ${s.t('englishOnly')}` : ''}
          </Txt>
          {referenceLessons(level.number)
            .slice(0, visible)
            .map((l, index) => (
              <React.Fragment key={l.id}>
                {index % 5 === 0 ? (
                  <Txt size={12} weight="600" color={c.green}>
                    {s.t('referenceWords')} · {s.t('unit')} {Math.floor(index / 5) + 1}
                  </Txt>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push(`/lesson/${l.id}`)}
                >
                  <Row style={{ paddingVertical: 13, borderTopWidth: 1, borderColor: c.border }}>
                    <Badge>{String(l.number).padStart(2, '0')}</Badge>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Txt weight="600">
                        {s.t('referenceLesson')} {l.number}
                      </Txt>
                      <Txt size={11} color={c.muted}>
                        {l.count} {s.t('words')} · {l.count * 2} {s.t('practice')}
                      </Txt>
                    </View>
                    {s.progress.lessons.has(l.id) ? (
                      <Icon name="checkmark" color={c.green} />
                    ) : (
                      <Icon name={s.rtl ? 'chevron-back' : 'chevron-forward'} color={c.muted} />
                    )}
                  </Row>
                </Pressable>
              </React.Fragment>
            ))}
          {visible < referenceLessons(level.number).length ? (
            <Button
              label={s.t('moreWords')}
              variant="secondary"
              onPress={() => setVisible(visible + 10)}
            />
          ) : null}
        </View>
      </Card>
    </Shell>
  );
}
