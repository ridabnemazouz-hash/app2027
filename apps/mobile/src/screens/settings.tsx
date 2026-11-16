import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import type { Preferences } from '../../../../packages/core/src';
import { content, localeNames, uiLocales, useLearning, type MessageKey } from '../state';
import {
  Badge,
  Button,
  Card,
  Chip,
  Field,
  Heading,
  Row,
  Shell,
  Txt,
  usePalette,
  styles,
} from '../ui';
import { storage } from '../storage';
import { ApiError } from '../api';
export function SettingsScreen() {
  const s = useLearning(),
    c = usePalette(),
    [confirm, setConfirm] = useState<'reset' | 'delete' | null>(null),
    [text, setText] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState<MessageKey | null>(null);
  async function apply() {
    setBusy(true);
    setMessage(null);
    try {
      if (confirm === 'reset') {
        await storage.removePrefix(`draft:${s.owner}:`);
        await storage.removePrefix(`drawing:${s.owner}:`);
        await s.record({ type: 'reset', itemId: 'profile' });
        setMessage('resetDone');
      } else await s.deleteAccount(password);
      setConfirm(null);
      setText('');
      setPassword('');
    } catch (e) {
      setMessage(
        e instanceof ApiError && e.code in { INVALID_CREDENTIALS: 1, UNAUTHORIZED: 1 }
          ? (e.code as MessageKey)
          : 'serviceError',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell>
      <Heading eyebrow="偏好 · SETTINGS" title={s.t('settings')} subtitle={s.t('profile')} />
      <View style={{ maxWidth: 900, width: '100%', gap: 20 }}>
        <Card>
          <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <View style={{ gap: 4 }}>
              <Txt size={21} serif>
                {s.user?.name ?? s.t('localProfile')}
              </Txt>
              <Txt size={12} color={c.muted}>
                {s.user?.email ?? s.t('demoNote')}
              </Txt>
            </View>
            <Button
              label={s.t(s.user ? 'account' : 'signIn')}
              variant="secondary"
              onPress={() => router.push('/account')}
            />
          </Row>
          <Txt size={11} color={c.muted}>
            {s.t('offlineAccount')}
          </Txt>
        </Card>
        <Card>
          <Txt weight="600">{s.t('interfaceLanguage')}</Txt>
          <View style={styles.wrap}>
            {uiLocales.map((locale) => (
              <Chip
                key={locale}
                label={localeNames[locale]}
                active={s.locale === locale}
                onPress={() => {
                  void s.setPreferences({ locale });
                }}
              />
            ))}
          </View>
          <Txt weight="600">{s.t('theme')}</Txt>
          <View style={styles.wrap}>
            {(['light', 'dark', 'system'] as Preferences['theme'][]).map((theme) => (
              <Chip
                key={theme}
                label={s.t(theme)}
                active={s.preferences.theme === theme}
                onPress={() => {
                  void s.setPreferences({ theme });
                }}
              />
            ))}
          </View>
        </Card>
        <Card>
          <Txt weight="600">{s.t('dailyGoal')}</Txt>
          <View style={styles.wrap}>
            {[5, 10, 15, 20, 30, 60].map((dailyMinutes) => (
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
          <Txt weight="600">{s.t('goals')}</Txt>
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
          <Txt color={c.muted} size={12}>
            {s.t('reminderNote')}
          </Txt>
        </Card>
        <Card>
          <Txt weight="600">{s.t('sync')}</Txt>
          <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <View style={{ gap: 5 }}>
              <Badge>{s.t(s.syncStatus)}</Badge>
              <Txt size={11} color={c.muted}>
                {s.user ? `${s.pending} ${s.t('pendingSync')}` : s.t('local')}
              </Txt>
            </View>
            <Button
              label={s.t('sync')}
              disabled={!s.user}
              busy={s.syncStatus === 'syncing'}
              variant="secondary"
              icon="sync-outline"
              onPress={() => {
                void s.sync();
              }}
            />
          </Row>
          <Txt size={11} color={c.muted}>
            {s.t('secureStorage')}
          </Txt>
        </Card>
        <Card>
          <Txt weight="600">{s.t('source')}</Txt>
          <Txt size={12} color={c.muted}>
            {s.t('sourceDetail')}
          </Txt>
          <Txt size={12} color={c.muted}>
            {s.t('advancedNote')}
          </Txt>
          <Badge red>{s.t('noOfficial')}</Badge>
          <Txt size={11} color={c.muted}>
            {s.t('version')}: {content.version}
          </Txt>
          <Txt size={11} color={c.muted}>
            {s.t('copyNote')}
          </Txt>
        </Card>
        <Card>
          <Txt weight="600">{s.t('privacy')}</Txt>
          <Txt size={12} color={c.muted}>
            {s.t('termsNote')}
          </Txt>
          <Button
            label={s.t('reset')}
            variant="danger"
            onPress={() => {
              setConfirm('reset');
              setText('');
            }}
          />
          {s.user ? (
            <Button
              label={s.t('deleteAccount')}
              variant="danger"
              onPress={() => {
                setConfirm('delete');
                setText('');
              }}
            />
          ) : null}
        </Card>
        {confirm ? (
          <Card style={{ borderColor: c.red }}>
            <Txt weight="600" color={c.red}>
              {s.t(confirm === 'reset' ? 'reset' : 'deleteAccount')}
            </Txt>
            <Txt size={12}>{s.t(confirm === 'reset' ? 'resetWarning' : 'deleteWarning')}</Txt>
            {confirm === 'delete' ? (
              <Field
                label={s.t('password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            ) : null}
            <Field
              label={confirm === 'reset' ? 'RESET' : s.t('deleteConfirmWord')}
              value={text}
              onChangeText={setText}
            />
            <Row>
              <Button
                label={s.t(confirm === 'reset' ? 'resetConfirm' : 'confirmDelete')}
                variant="danger"
                busy={busy}
                disabled={
                  text !== (confirm === 'reset' ? 'RESET' : 'DELETE') ||
                  (confirm === 'delete' && !password)
                }
                onPress={() => {
                  void apply();
                }}
              />
              <Button label={s.t('cancel')} variant="ghost" onPress={() => setConfirm(null)} />
            </Row>
          </Card>
        ) : null}
        {message ? <Txt color={c.red}>{s.t(message)}</Txt> : null}
      </View>
    </Shell>
  );
}
