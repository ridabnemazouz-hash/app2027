import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Crypto from 'expo-crypto';
import {
  defaultPreferences,
  deriveProgress,
  mergeEvents,
  mergeServerEvents,
  preferencesSchema,
  eventSchema,
  curriculumSchema,
  type Curriculum,
  type LearningEvent,
  type Locale,
  type SyncCursor,
  type Localized,
  type Preferences,
} from '../../../packages/core/src';
import rawContent from '../../../data/curriculum/supplementary-v1/content.json';
import messages from './messages.json';
import { storage, tokens } from './storage';
import { api, ApiError } from './api';
export const content: Curriculum = curriculumSchema.parse(rawContent);
export type MessageKey = keyof typeof messages.en;
type User = { id: string; name: string; email: string; preferences: Preferences };
type Snapshot = {
  events: LearningEvent[];
  preferences: Preferences;
  pending: string[];
  /** Last server sync position (docs/SYNC.md); absent on old profiles. */
  cursor?: SyncCursor | null;
};
type Store = {
  ready: boolean;
  error: string;
  notice: string;
  user: User | null;
  preferences: Preferences;
  events: LearningEvent[];
  progress: ReturnType<typeof deriveProgress>;
  syncStatus: 'local' | 'syncing' | 'synced' | 'offline';
  pending: number;
  locale: Locale;
  rtl: boolean;
  t: (key: MessageKey) => string;
  localize: (v: Localized) => string;
  setPreferences: (p: Partial<Preferences>) => Promise<void>;
  record: (e: Omit<LearningEvent, 'id' | 'at'>) => Promise<void>;
  sync: () => Promise<void>;
  authenticate: (
    mode: 'login' | 'register',
    email: string,
    password: string,
    name: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  request: (path: string, body?: unknown, method?: string, timeoutMs?: number) => Promise<unknown>;
  clearError: () => void;
  owner: string;
};
const Context = createContext<Store | null>(null);
export function LearningProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [user, setUser] = useState<User | null>(null),
    [preferences, setPrefs] = useState<Preferences>(defaultPreferences),
    [events, setEvents] = useState<LearningEvent[]>([]),
    [syncStatus, setSyncStatus] = useState<Store['syncStatus']>('local'),
    [pending, setPending] = useState(0);
  const ownerRef = useRef('demo'),
    snapshot = useRef<Snapshot>({ events: [], preferences: defaultPreferences, pending: [] }),
    tokenRef = useRef<string | null>(null),
    syncing = useRef(false),
    writeQueue = useRef(Promise.resolve());
  async function loadOwner(owner: string, prefs?: Preferences) {
    const raw = await storage.get<Snapshot>(`profile:${owner}`);
    const loaded: Snapshot = raw
      ? {
          events: raw.events.map((e) => eventSchema.parse(e)),
          preferences: preferencesSchema.parse(raw.preferences),
          pending: raw.pending ?? [],
          cursor: raw.cursor ?? null,
        }
      : { events: [], preferences: prefs ?? defaultPreferences, pending: [], cursor: null };
    ownerRef.current = owner;
    snapshot.current = loaded;
    setEvents(loaded.events);
    setPrefs(loaded.preferences);
    setPending(loaded.pending.length);
  }
  function persist(update: (current: Snapshot) => Snapshot) {
    const owner = ownerRef.current,
      key = `profile:${owner}`;
    const task = writeQueue.current
      .catch(() => undefined)
      .then(async () => {
        if (owner !== ownerRef.current) throw new Error('Profile changed');
        const next = update(snapshot.current);
        await storage.set(key, next);
        if (owner === ownerRef.current) {
          snapshot.current = next;
          setEvents(next.events);
          setPrefs(next.preferences);
          setPending(next.pending.length);
        }
      });
    writeQueue.current = task;
    return task.catch((e) => {
      setError('saveError');
      throw e;
    });
  }
  async function sync() {
    if (!tokenRef.current || syncing.current) return;
    const owner = ownerRef.current,
      token = tokenRef.current;
    syncing.current = true;
    setSyncStatus('syncing');
    try {
      // Capture a batch, but preserve new local events added during the request.
      // Delta protocol (docs/SYNC.md): send the stored cursor, receive
      // only newer server events plus any conflicting stored versions.
      // Conflicting local copies are replaced by the server's first
      // stored version and leave the pending queue, so one bad event
      // can no longer poison every future upload.
      let batch = snapshot.current.pending.slice(0, 500);
      do {
        const sent = snapshot.current.events.filter((e) => batch.includes(e.id));
        const response = await api<{
          events: LearningEvent[];
          conflicts: string[];
          cursor: SyncCursor | null;
        }>('/sync', { events: sent, cursor: snapshot.current.cursor ?? null }, token);
        if (owner !== ownerRef.current) return;
        const serverEvents = response.events.map((e) => eventSchema.parse(e));
        const resolved = new Set([...batch, ...response.conflicts]);
        await persist((current) => ({
          ...current,
          events: mergeServerEvents(current.events, serverEvents, response.conflicts),
          pending: current.pending.filter((id) => !resolved.has(id)),
          cursor: response.cursor,
        }));
        batch = snapshot.current.pending.slice(0, 500);
      } while (batch.length);
      if (owner !== ownerRef.current) return;
      await api('/me/preferences', snapshot.current.preferences, token, 'PUT');
      if (owner === ownerRef.current) setSyncStatus('synced');
    } catch {
      if (owner === ownerRef.current) setSyncStatus('offline');
    } finally {
      syncing.current = false;
    }
  }
  useEffect(() => {
    void (async () => {
      try {
        await loadOwner('demo');
        const token = await tokens.get();
        if (token) {
          const cached = await storage.get<User>('last-user');
          if (cached) {
            tokenRef.current = token;
            setUser(cached);
            await loadOwner(cached.id, preferencesSchema.parse(cached.preferences));
          }
          try {
            const result = await api<{ user: User }>('/me', undefined, token);
            tokenRef.current = token;
            setUser(result.user);
            await loadOwner(result.user.id, result.user.preferences);
            await storage.set('last-user', result.user);
            void sync();
          } catch (e) {
            if (cached && !(e instanceof ApiError && e.code === 'UNAUTHORIZED')) {
              setSyncStatus('offline');
            } else {
              if (e instanceof ApiError && e.code === 'UNAUTHORIZED') {
                await tokens.set(null);
                await storage.remove('last-user');
                tokenRef.current = null;
                setUser(null);
                await loadOwner('demo');
              }
              setNotice('restoreFailed');
            }
          }
        }
        setReady(true);
      } catch {
        setError('restoreError');
        setReady(true);
      }
    })();
  }, []);
  useEffect(() => {
    const id = setInterval(() => {
      void sync();
    }, 30000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void sync();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);
  async function setPreferences(p: Partial<Preferences>) {
    try {
      await persist((current) => ({
        ...current,
        preferences: preferencesSchema.parse({ ...current.preferences, ...p }),
      }));
      if (tokenRef.current) void sync();
    } catch {
      /* persist reports the storage error in the UI */
    }
  }
  async function record(e: Omit<LearningEvent, 'id' | 'at'>) {
    const event = eventSchema.parse({
      ...e,
      id: Crypto.randomUUID(),
      at: new Date().toISOString(),
    });
    await persist((current) => ({
      ...current,
      events: mergeEvents(current.events, [event]),
      pending: [...current.pending, event.id],
    }));
    if (tokenRef.current) void sync();
  }
  async function authenticate(
    mode: 'login' | 'register',
    email: string,
    password: string,
    name: string,
  ) {
    await writeQueue.current.catch(() => undefined);
    const onboardingPrefs = snapshot.current.preferences;
    const result = await api<{ token: string; user: User }>(`/auth/${mode}`, {
      email,
      password,
      ...(mode === 'register' ? { name } : {}),
    });
    await tokens.set(result.token);
    await storage.set('last-user', result.user);
    tokenRef.current = result.token;
    setUser(result.user);
    await loadOwner(result.user.id, {
      ...(mode === 'register' ? onboardingPrefs : result.user.preferences),
      onboarded: true,
    });
    setSyncStatus('local');
    void sync();
  }
  async function logout() {
    const token = tokenRef.current;
    tokenRef.current = null;
    await writeQueue.current.catch(() => undefined);
    ownerRef.current = 'demo';
    await tokens.set(null);
    await storage.remove('last-user');
    setUser(null);
    await loadOwner('demo');
    setSyncStatus('local');
    if (token)
      try {
        await api('/auth/logout', {}, token);
      } catch {
        setNotice('offline');
      }
  }
  async function deleteAccount(password: string) {
    if (!tokenRef.current) return;
    await api('/me', { password }, tokenRef.current, 'DELETE');
    const deletedOwner = ownerRef.current;
    tokenRef.current = null;
    await writeQueue.current.catch(() => undefined);
    ownerRef.current = 'demo';
    await tokens.set(null);
    await storage.remove('last-user');
    setUser(null);
    await storage.remove(`profile:${deletedOwner}`);
    await storage.removePrefix(`draft:${deletedOwner}:`);
    await storage.removePrefix(`drawing:${deletedOwner}:`);
    await loadOwner('demo');
    setSyncStatus('local');
  }
  const locale = preferences.locale,
    t = (key: MessageKey) => messages[locale][key] ?? messages.en[key];
  const value: Store = {
    ready,
    error,
    notice,
    user,
    preferences,
    events,
    progress: useMemo(() => deriveProgress(events), [events]),
    syncStatus,
    pending,
    locale,
    rtl: locale === 'ar',
    t,
    localize: (v) => v[locale],
    setPreferences,
    record,
    sync,
    authenticate,
    logout,
    deleteAccount,
    request: (path, body, method, timeoutMs) =>
      api(path, body, tokenRef.current ?? undefined, method, timeoutMs),
    clearError: () => {
      setError('');
      setNotice('');
    },
    owner: ownerRef.current,
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useLearning() {
  const c = useContext(Context);
  if (!c) throw new Error('LearningProvider missing');
  return c;
}
