import type { ApiError } from '@/types';
import { env } from '@/config/env';

const TOKEN_KEY = 'esp32_iot_token';
const DEFAULT_TIMEOUT_MS = 15_000;

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function notifyAuthTokenChanged(): void {
  window.dispatchEvent(new Event('auth-token-changed'));
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  notifyAuthTokenChanged();
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  notifyAuthTokenChanged();
}

export function getApiUrl(): string {
  return env.apiUrl;
}

function extractMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;

  const value = body as Record<string, unknown>;
  if (typeof value.message === 'string') return value.message;

  if (value.data && typeof value.data === 'object') {
    const data = value.data as Record<string, unknown>;
    if (typeof data.message === 'string') return data.message;
  }

  if (value.error && typeof value.error === 'object') {
    const error = value.error as Record<string, unknown>;
    if (typeof error.message === 'string') return error.message;
  }

  if (typeof value.error === 'string') return value.error;
  return undefined;
}

function parseError(status: number, body: unknown): ApiError {
  const message =
    extractMessage(body) ??
    (status === 401
      ? 'Your session has expired. Please sign in again.'
      : status === 403
        ? 'You do not have permission to perform this action.'
        : status === 404
          ? 'The requested resource was not found.'
          : status >= 500
            ? 'The backend server is unavailable. Please try again.'
            : 'The request could not be completed.');

  const code =
    body && typeof body === 'object' && typeof (body as Record<string, unknown>).code === 'string'
      ? String((body as Record<string, unknown>).code)
      : undefined;

  return { message, status, code };
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = path.startsWith('http')
    ? path
    : `${env.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  // Preserve a caller supplied AbortSignal while adding a request timeout.
  const onCallerAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onCallerAbort, { once: true });

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;

    const isTimeout = controller.signal.aborted;
    throw {
      message: isTimeout
        ? 'The request timed out. Please try again.'
        : 'Unable to reach the backend server. Check that it is running.',
      status: 0,
      code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
    } satisfies ApiError;
  } finally {
    window.clearTimeout(timeoutId);
    options.signal?.removeEventListener('abort', onCallerAbort);
  }

  const contentType = response.headers.get('content-type') ?? '';
  const body =
    response.status === 204
      ? null
      : contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : await response.text().catch(() => null);

  if (response.status === 401) {
    clearToken();
    if (!window.location.pathname.includes('/login')) {
      window.location.assign('/login');
    }
  }

  if (!response.ok) {
    throw parseError(response.status, body);
  }

  return body as T;
}

export const apiClient = {
  get: <T>(path: string, signal?: AbortSignal) =>
    apiRequest<T>(path, { method: 'GET', signal }),
  post: <T>(path: string, data?: unknown, signal?: AbortSignal) =>
    apiRequest<T>(path, {
      method: 'POST',
      body: data === undefined ? undefined : JSON.stringify(data),
      signal,
    }),
  put: <T>(path: string, data?: unknown, signal?: AbortSignal) =>
    apiRequest<T>(path, {
      method: 'PUT',
      body: data === undefined ? undefined : JSON.stringify(data),
      signal,
    }),
  patch: <T>(path: string, data?: unknown, signal?: AbortSignal) =>
    apiRequest<T>(path, {
      method: 'PATCH',
      body: data === undefined ? undefined : JSON.stringify(data),
      signal,
    }),
  delete: <T>(path: string, signal?: AbortSignal) =>
    apiRequest<T>(path, { method: 'DELETE', signal }),
};
