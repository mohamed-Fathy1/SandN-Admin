import { describe, expect, it, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQuery } from '@/test/utils';
import {
  useApplyFreeShipping,
  useOrder,
  useUpdateOrderStatus,
} from './use-orders';
import { resetOrdersStore } from '@/test/mocks/handlers/orders';

describe('order mutations integration', () => {
  beforeEach(() => {
    resetOrdersStore();
  });

  it('transitions ordered → confirmed via the status machine', async () => {
    const fetched = renderHookWithQuery(() => useOrder('ord-1'));
    await waitFor(() => expect(fetched.result.current.isSuccess).toBe(true));
    expect(fetched.result.current.data?.status).toBe('ordered');

    const mut = renderHookWithQuery(() => useUpdateOrderStatus());
    mut.result.current.mutate({ id: 'ord-1', status: 'confirmed' });
    await waitFor(() => expect(mut.result.current.isSuccess).toBe(true));

    const refetched = renderHookWithQuery(() => useOrder('ord-1'));
    await waitFor(() => expect(refetched.result.current.isSuccess).toBe(true));
    expect(refetched.result.current.data?.status).toBe('confirmed');
  });

  it('applies free shipping and zeroes the shipping cost', async () => {
    const before = renderHookWithQuery(() => useOrder('ord-1'));
    await waitFor(() => expect(before.result.current.isSuccess).toBe(true));
    expect(before.result.current.data?.shippingCost).toBeGreaterThan(0);

    const mut = renderHookWithQuery(() => useApplyFreeShipping());
    mut.result.current.mutate('ord-1');
    await waitFor(() => expect(mut.result.current.isSuccess).toBe(true));

    const after = renderHookWithQuery(() => useOrder('ord-1'));
    await waitFor(() => expect(after.result.current.isSuccess).toBe(true));
    expect(after.result.current.data?.shippingCost).toBe(0);
  });

  it('surfaces a 404 when the order does not exist', async () => {
    const mut = renderHookWithQuery(() => useUpdateOrderStatus());
    mut.result.current.mutate({ id: 'does-not-exist', status: 'confirmed' });
    await waitFor(() => expect(mut.result.current.isError).toBe(true));
  });
});
