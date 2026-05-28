import { http, HttpResponse } from 'msw';
import { describe, expect, it, beforeEach } from 'vitest';
import { server } from '@/test/mocks/server';
import { api, ApiError } from './axios';
import { useAuthStore } from '@/features/auth/store/auth-store';

const API = 'https://api.test.local';

describe('axios interceptors', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: { token: 'tk', email: 'a@b.c' } });
  });

  it('attaches Authorization header when a session token exists', async () => {
    let captured: string | null = null;
    server.use(
      http.get(`${API}/ping`, ({ request }) => {
        captured = request.headers.get('authorization');
        return HttpResponse.json({ statusCode: 200, data: {}, message: 'OK', success: true });
      })
    );
    await api.get('/ping');
    expect(captured).toBe('Bearer tk');
  });

  it('throws ApiError with payload message and status', async () => {
    server.use(
      http.get(`${API}/boom`, () =>
        HttpResponse.json(
          { statusCode: 422, message: 'Validation failed', errors: [], success: false },
          { status: 422 }
        )
      )
    );
    await expect(api.get('/boom')).rejects.toMatchObject({
      name: 'ApiError',
      statusCode: 422,
      message: 'Validation failed',
    });
  });

  it('clears session and dispatches auth:expired on 401', async () => {
    server.use(
      http.get(`${API}/secure`, () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
      )
    );
    const events: Event[] = [];
    const handler = (e: Event) => events.push(e);
    window.addEventListener('auth:expired', handler);
    await expect(api.get('/secure')).rejects.toBeInstanceOf(ApiError);
    window.removeEventListener('auth:expired', handler);
    expect(events.length).toBe(1);
    expect(useAuthStore.getState().session).toBeNull();
  });

  it.each([
    ['Authorization token is missing', 'missing'],
    ['Access token has expired', 'expired'],
    ['Access token is invalid', 'invalid'],
    ['Invalid token payload', 'payload'],
    ['user token is invalid', 'revoked'],
  ])('classifies 401 "%s" as %s', async (message, reason) => {
    server.use(
      http.get(`${API}/c`, () => HttpResponse.json({ message }, { status: 401 }))
    );
    let detail: { reason: string; message: string } | null = null;
    const handler = (e: Event) => {
      detail = (e as CustomEvent<{ reason: string; message: string }>).detail;
    };
    window.addEventListener('auth:expired', handler);
    await expect(api.get('/c')).rejects.toBeInstanceOf(ApiError);
    window.removeEventListener('auth:expired', handler);
    expect(detail).toEqual({ reason, message });
  });

  it('dispatches auth:forbidden on 403 without clearing session', async () => {
    server.use(
      http.get(`${API}/admin-only`, () =>
        HttpResponse.json(
          { message: 'Forbidden: You must have the role to access this resource' },
          { status: 403 }
        )
      )
    );
    const events: CustomEvent<string>[] = [];
    const handler = (e: Event) => events.push(e as CustomEvent<string>);
    window.addEventListener('auth:forbidden', handler);
    await expect(api.get('/admin-only')).rejects.toBeInstanceOf(ApiError);
    window.removeEventListener('auth:forbidden', handler);
    expect(events.length).toBe(1);
    expect(useAuthStore.getState().session).not.toBeNull();
  });

  it('dispatches server:misconfigured on 500 token signature error', async () => {
    server.use(
      http.get(`${API}/cfg`, () =>
        HttpResponse.json({ message: 'Token signature is not configured' }, { status: 500 })
      )
    );
    const events: Event[] = [];
    const handler = (e: Event) => events.push(e);
    window.addEventListener('server:misconfigured', handler);
    await expect(api.get('/cfg')).rejects.toBeInstanceOf(ApiError);
    window.removeEventListener('server:misconfigured', handler);
    expect(events.length).toBe(1);
    expect(useAuthStore.getState().session).not.toBeNull();
  });
});
