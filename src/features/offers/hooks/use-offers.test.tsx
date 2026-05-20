import { describe, expect, it, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useOffers, useToggleOffer } from './use-offers';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { resetOffersStore } from '@/test/mocks/handlers/offers';
import type { ApiOffer } from '@/shared/types/api';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe('useToggleOffer optimism', () => {
  beforeEach(() => {
    resetOffersStore();
  });

  it('optimistically flips isActive in the cache and confirms with the server', async () => {
    const { client, wrapper } = makeWrapper();

    const list = renderHook(() => useOffers(), { wrapper });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    const offer = list.result.current.data!.find((o) => o._id === 'off-2');
    expect(offer?.isActive).toBe(false);

    const mut = renderHook(() => useToggleOffer(), { wrapper });
    mut.result.current.mutate({ id: 'off-2', isActive: true });

    await waitFor(() => {
      const cached = client.getQueryData<ApiOffer[]>(adminQueryKeys.offers.all);
      expect(cached?.find((o) => o._id === 'off-2')?.isActive).toBe(true);
    });

    await waitFor(() => expect(mut.result.current.isSuccess).toBe(true));
  });
});
