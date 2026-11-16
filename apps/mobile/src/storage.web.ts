/** Web demo data is local to this browser. Tokens intentionally stay in memory. */
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    const raw = globalThis.localStorage.getItem(`hanzigo:${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async set(key: string, value: unknown) {
    globalThis.localStorage.setItem(`hanzigo:${key}`, JSON.stringify(value));
  },
  async removePrefix(prefix: string) {
    for (const key of Object.keys(globalThis.localStorage).filter((k) =>
      k.startsWith(`hanzigo:${prefix}`),
    ))
      globalThis.localStorage.removeItem(key);
  },
  async remove(key: string) {
    globalThis.localStorage.removeItem(`hanzigo:${key}`);
  },
};
let token: string | null = null;
export const tokens = {
  async get() {
    return token;
  },
  async set(value: string | null) {
    token = value;
  },
};
