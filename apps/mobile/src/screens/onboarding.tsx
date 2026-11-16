import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { router } from 'expo-router';
import type { Locale, Preferences } from '../../../../packages/core/src';
import { useLearning } from '../state';
import journeyArt from '../../assets/journey-art.png';
import {
  Badge,
  Button,
  Card,
  Chip,
  Heading,
  Icon,
  Meter,
  Row,
  Shell,
  Txt,
  usePalette,
  styles,
} from '../ui';
export function OnboardingScreen() {
  const s = useLearning(),
    c = usePalette();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  async function finish(account = false) {
    setBusy(true);
    try {
      await s.setPreferences({ onboarded: true });
      router.replace(account ? '/account?mode=register' : '/');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell noNav>
      <View
        style={{ maxWidth: 650, width: '100%', alignSelf: 'center', paddingVertical: 20, gap: 26 }}
      >
        <Row style={{ justifyContent: 'space-between' }}>
          <Badge>HANZIGO · {step + 1} / 3</Badge>
          {step > 0 ? (
            <Button label={s.t('back')} small variant="ghost" onPress={() => setStep(step - 1)} />
          ) : null}
        </Row>
        <Meter value={(step + 1) / 3} color={c.red} />
        {step === 0 ? (
          <>
            <View style={{ alignItems: 'center', paddingVertical: 6 }}>
              <View
                style={{
                  height: 115,
                  width: 115,
                  borderRadius: 32,
                  backgroundColor: '#242822',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  source={journeyArt}
                  accessible={false}
                  resizeMode="contain"
                  style={{ width: 105, height: 105 }}
                />
              </View>
            </View>
            <Heading title={s.t('welcome')} subtitle={s.t('welcomeSub')} />
            <Txt weight="600">{s.t('chooseLanguage')}</Txt>
            <View style={styles.grid}>
              {(['en', 'zh', 'ar', 'es'] as Locale[]).map((locale) => (
                <View key={locale} style={{ width: '47%' }}>
                  <Chip
                    label={{ en: 'English', zh: '简体中文', ar: 'العربية', es: 'Español' }[locale]}
                    active={s.locale === locale}
                    onPress={() => {
                      void s.setPreferences({ locale });
                    }}
                  />
                </View>
              ))}
            </View>
            <Button label={s.t('next')} onPress={() => setStep(1)} icon="arrow-forward" />
          </>
        ) : step === 1 ? (
          <>
            <Heading title={s.t('goalQuestion')} />
            <View style={styles.wrap}>
              {(['travel', 'study', 'work', 'culture'] as Preferences['goal'][]).map((goal) => (
                <Chip
                  key={goal}
                  label={s.t(goal)}
                  active={s.preferences.goal === goal}
                  onPress={() => {
                    void s.setPreferences({ goal });
                  }}
                />
              ))}
            </View>
            <Txt weight="600">{s.t('target')}</Txt>
            <View style={styles.wrap}>
              {Array.from({ length: 9 }, (_, i) => i + 1).map((targetLevel) => (
                <Chip
                  key={targetLevel}
                  label={`HSK ${targetLevel}`}
                  active={s.preferences.targetLevel === targetLevel}
                  onPress={() => {
                    void s.setPreferences({ targetLevel });
                  }}
                />
              ))}
            </View>
            <Txt color={c.muted} size={12}>
              {s.t('sourceNote')}
            </Txt>
            <Button label={s.t('next')} onPress={() => setStep(2)} icon="arrow-forward" />
            <Button label={s.t('skip')} variant="ghost" onPress={() => setStep(2)} />
          </>
        ) : (
          <>
            <Heading title={s.t('pace')} subtitle={s.t('dailyQuestion')} />
            <View style={styles.wrap}>
              {[5, 10, 15, 20, 30].map((dailyMinutes) => (
                <Chip
                  key={dailyMinutes}
                  label={`${dailyMinutes} ${s.t('minutes')}`}
                  active={s.preferences.dailyMinutes === dailyMinutes}
                  onPress={() => {
                    void s.setPreferences({ dailyMinutes });
                  }}
                />
              ))}
            </View>
            <Card>
              <Row>
                <Icon name="notifications-outline" color={c.muted} />
                <Txt size={12} color={c.muted} style={{ flex: 1 }}>
                  {s.t('reminderNote')}
                </Txt>
              </Row>
            </Card>
            <Button
              label={s.t('demo')}
              busy={busy}
              onPress={() => {
                void finish();
              }}
              icon="arrow-forward"
            />
            <Button
              label={s.t('register')}
              variant="secondary"
              busy={busy}
              onPress={() => {
                void finish(true);
              }}
            />
            <Txt size={12} color={c.muted}>
              {s.t('demoNote')}
            </Txt>
            <Txt size={11} color={c.muted}>
              {s.t('languageReview')}
            </Txt>
          </>
        )}
      </View>
    </Shell>
  );
}
