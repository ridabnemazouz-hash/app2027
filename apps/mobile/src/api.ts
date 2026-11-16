export class ApiError extends Error {
  constructor(public code: string) {
    super(code);
  }
}
const base = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
export async function api<T>(
  path: string,
  body?: unknown,
  token?: string,
  method?: string,
  timeoutMs = 12000,
): Promise<T> {
  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    response = await fetch(base + path, {
      method: method ?? (body ? 'POST' : 'GET'),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('serviceError');
  } finally {
    clearTimeout(timeout);
  }
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new ApiError(data.error ?? 'serviceError');
  return data;
}
