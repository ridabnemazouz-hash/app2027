import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useLearning, type MessageKey } from '../state';
import { ApiError } from '../api';
import { Badge, Button, Card, Field, Heading, Row, Shell, Txt, usePalette } from '../ui';
export function AccountScreen() {
  const s = useLearning(),
    c = usePalette(),
    params = useLocalSearchParams<{ resetToken?: string; mode?: string }>(),
    [mode, setMode] = useState<'login' | 'register' | 'reset'>(
      params.resetToken ? 'reset' : params.mode === 'register' ? 'register' : 'login',
    ),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [name, setName] = useState(''),
    [resetToken, setResetToken] = useState(params.resetToken ?? ''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState<MessageKey | null>(null);
  async function submit(action: 'auth' | 'email' | 'password' | 'logout') {
    setMessage(null);
    if (
      action === 'auth' &&
      (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        password.length < 10 ||
        (mode === 'register' && !name.trim()))
    ) {
      setMessage('invalidForm');
      return;
    }
    setBusy(true);
    try {
      if (action === 'auth') {
        await s.authenticate(
          mode === 'register' ? 'register' : 'login',
          email.trim(),
          password,
          name.trim(),
        );
        router.replace('/');
      }
      if (action === 'email') {
        await s.request('/auth/reset-request', { email: email.trim() });
        setMessage('emailSent');
      }
      if (action === 'password') {
        await s.request('/auth/reset', { token: resetToken.trim(), password });
        setMessage('passwordUpdated');
        setPassword('');
        setResetToken('');
        setMode('login');
      }
      if (action === 'logout') await s.logout();
    } catch (e) {
      const key = e instanceof ApiError ? e.code : 'serviceError';
      setMessage(
        key in
          {
            INVALID_CREDENTIALS: 1,
            EMAIL_IN_USE: 1,
            EMAIL_NOT_CONFIGURED: 1,
            INVALID_RESET_TOKEN: 1,
            RATE_LIMITED: 1,
            UNAUTHORIZED: 1,
          }
          ? (key as MessageKey)
          : 'serviceError',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell>
      <View
        style={{ maxWidth: 520, width: '100%', alignSelf: 'center', gap: 22, paddingVertical: 20 }}
      >
        <Heading
          title={s.t(
            s.user
              ? 'account'
              : mode === 'login'
                ? 'signIn'
                : mode === 'register'
                  ? 'register'
                  : 'forgot',
          )}
          subtitle={s.t('tagline')}
        />
        {s.user ? (
          <Card>
            <Badge>{s.t('online')}</Badge>
            <Txt size={24} serif>
              {s.user.name}
            </Txt>
            <Txt color={c.muted}>{s.user.email}</Txt>
            <Button
              label={s.t('sync')}
              icon="sync-outline"
              variant="secondary"
              onPress={() => {
                void s.sync();
              }}
            />
            <Button
              label={s.t('settings')}
              variant="secondary"
              onPress={() => router.push('/settings')}
            />
            <Button
              label={s.t('signOut')}
              busy={busy}
              onPress={() => {
                void submit('logout');
              }}
            />
          </Card>
        ) : (
          <Card>
            {mode === 'register' ? (
              <Field label={s.t('name')} value={name} onChangeText={setName} />
            ) : null}
            <Field
              label={s.t('email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            {mode === 'reset' ? (
              <>
                <Button
                  label={s.t('sendReset')}
                  variant="secondary"
                  busy={busy}
                  disabled={!email.trim()}
                  onPress={() => {
                    void submit('email');
                  }}
                />
                <Txt color={c.muted} size={11}>
                  {s.t('resetTokenHint')}
                </Txt>
                <Field label={s.t('resetToken')} value={resetToken} onChangeText={setResetToken} />
              </>
            ) : null}
            <Field
              label={s.t('password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Button
              label={s.t(
                mode === 'reset' ? 'updatePassword' : mode === 'register' ? 'register' : 'signIn',
              )}
              busy={busy}
              disabled={mode === 'reset' && (!resetToken || password.length < 10)}
              onPress={() => {
                void submit(mode === 'reset' ? 'password' : 'auth');
              }}
            />
            <Row style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                small
                label={s.t(mode === 'login' ? 'register' : 'signIn')}
                variant="ghost"
                onPress={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setMessage(null);
                }}
              />
              {mode !== 'reset' ? (
                <Button
                  small
                  label={s.t('forgot')}
                  variant="ghost"
                  onPress={() => {
                    setMode('reset');
                    setMessage(null);
                  }}
                />
              ) : null}
            </Row>
            <Txt size={11} color={c.muted}>
              {s.t('offlineAccount')}
            </Txt>
            <Txt size={10} color={c.muted}>
              {s.t('secureStorage')}
            </Txt>
          </Card>
        )}
        {message ? (
          <Card style={{ backgroundColor: c.redBg }}>
            <Txt color={c.red}>{s.t(message)}</Txt>
          </Card>
        ) : null}
        <Button label={s.t('continueDemo')} variant="ghost" onPress={() => router.replace('/')} />
      </View>
    </Shell>
  );
}
