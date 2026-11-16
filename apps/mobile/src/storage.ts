import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
let database: Promise<SQLiteDatabase> | undefined;
async function db() {
  if (!database)
    database = (async () => {
      const sqlite = await import('expo-sqlite');
      const d = await sqlite.openDatabaseAsync('hanzigo.db');
      await d.execAsync(
        'PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);',
      );
      return d;
    })();
  return database;
}
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    if (Platform.OS === 'web') {
      const raw = globalThis.localStorage.getItem(`hanzigo:${key}`);
      return raw ? (JSON.parse(raw) as T) : null;
    }
    const row = await (
      await db()
    ).getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', key);
    return row ? (JSON.parse(row.value) as T) : null;
  },
  async set(key: string, value: unknown) {
    const raw = JSON.stringify(value);
    if (Platform.OS === 'web') {
      globalThis.localStorage.setItem(`hanzigo:${key}`, raw);
      return;
    }
    await (
      await db()
    ).runAsync(
      'INSERT INTO kv(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      key,
      raw,
    );
  },
  async removePrefix(prefix: string) {
    if (Platform.OS === 'web') {
      const keys = Object.keys(globalThis.localStorage).filter((k) =>
        k.startsWith(`hanzigo:${prefix}`),
      );
      for (const k of keys) globalThis.localStorage.removeItem(k);
      return;
    }
    await (await db()).runAsync('DELETE FROM kv WHERE substr(key,1,?) = ?', prefix.length, prefix);
  },
  async remove(key: string) {
    if (Platform.OS === 'web') {
      globalThis.localStorage.removeItem(`hanzigo:${key}`);
      return;
    }
    await (await db()).runAsync('DELETE FROM kv WHERE key = ?', key);
  },
};
let webToken: string | null = null;
export const tokens = {
  async get() {
    if (Platform.OS === 'web') return webToken;
    const secure = await import('expo-secure-store');
    return secure.getItemAsync('hanzigo-session');
  },
  async set(value: string | null) {
    if (Platform.OS === 'web') {
      webToken = value;
      return;
    }
    const secure = await import('expo-secure-store');
    if (value) await secure.setItemAsync('hanzigo-session', value);
    else await secure.deleteItemAsync('hanzigo-session');
  },
};
