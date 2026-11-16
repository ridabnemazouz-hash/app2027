import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';

let database: Promise<SQLite.SQLiteDatabase> | undefined;
async function db() {
  if (!database)
    database = (async () => {
      const d = await SQLite.openDatabaseAsync('hanzigo.db');
      await d.execAsync(
        'PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);',
      );
      return d;
    })();
  return database;
}
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    const row = await (
      await db()
    ).getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', key);
    return row ? (JSON.parse(row.value) as T) : null;
  },
  async set(key: string, value: unknown) {
    await (
      await db()
    ).runAsync(
      'INSERT INTO kv(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      key,
      JSON.stringify(value),
    );
  },
  async removePrefix(prefix: string) {
    await (await db()).runAsync('DELETE FROM kv WHERE substr(key,1,?) = ?', prefix.length, prefix);
  },
  async remove(key: string) {
    await (await db()).runAsync('DELETE FROM kv WHERE key = ?', key);
  },
};
export const tokens = {
  async get() {
    return SecureStore.getItemAsync('hanzigo-session');
  },
  async set(value: string | null) {
    if (value) await SecureStore.setItemAsync('hanzigo-session', value);
    else await SecureStore.deleteItemAsync('hanzigo-session');
  },
};
