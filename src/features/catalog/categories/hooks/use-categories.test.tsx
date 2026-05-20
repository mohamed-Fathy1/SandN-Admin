import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { useCategories } from './use-categories';
import { renderHookWithQuery } from '@/test/utils';

describe('useCategories', () => {
  it('unwraps the response envelope to `data.data.categories`', async () => {
    const { result } = renderHookWithQuery(() => useCategories());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toMatchObject({ _id: 'cat-1', name: { en: 'Bras' } });
  });
});
