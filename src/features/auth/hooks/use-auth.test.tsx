import { describe, expect, it, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { useActivateAccount, useRegisterEmail } from './use-auth';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { renderHookWithQuery } from '@/test/utils';

describe('auth hooks', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null });
  });

  it('registers an email without crashing', async () => {
    const { result } = renderHookWithQuery(() => useRegisterEmail());
    result.current.mutate('admin@example.com');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('stores session on successful activation', async () => {
    const { result } = renderHookWithQuery(() => useActivateAccount());
    result.current.mutate({ email: 'admin@example.com', activeCode: '123456' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useAuthStore.getState().session).toEqual({
      token: 'test-token-abc',
      email: 'admin@example.com',
    });
  });

  it('does not store session when activation fails', async () => {
    const { result } = renderHookWithQuery(() => useActivateAccount());
    result.current.mutate({ email: 'admin@example.com', activeCode: '000000' });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useAuthStore.getState().session).toBeNull();
  });
});
