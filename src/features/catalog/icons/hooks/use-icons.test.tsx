import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { useCreateIcon, useIcons } from './use-icons';
import { renderHookWithQuery } from '@/test/utils';
import { ApiError } from '@/shared/lib/axios';

describe('icons feature', () => {
  it('useIcons unwraps the response envelope', async () => {
    const { result } = renderHookWithQuery(() => useIcons());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBeGreaterThanOrEqual(2);
    expect(result.current.data?.[0]).toMatchObject({ key: expect.any(String) });
  });

  it('useCreateIcon surfaces a 409 ApiError for duplicate keys', async () => {
    const { result } = renderHookWithQuery(() => useCreateIcon());
    const dup = { key: 'bras', svg: '<svg viewBox="0 0 24 24"></svg>', isActive: true };
    await result.current
      .mutateAsync(dup)
      .catch(() => undefined); // first call may seed
    let caught: unknown;
    try {
      await result.current.mutateAsync(dup);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).statusCode).toBe(409);
  });
});
