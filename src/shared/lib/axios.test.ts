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
});
