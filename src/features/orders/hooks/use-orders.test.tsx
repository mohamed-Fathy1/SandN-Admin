import { describe, expect, it, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQuery } from '@/test/utils';
import {
  useApplyFreeShipping,
  useOrder,
  useRecordOrderPayment,
  useRecordOrderRefund,
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

  it('records a deposit → partially_paid with updated collected/remaining', async () => {
    const before = renderHookWithQuery(() => useOrder('ord-1'));
    await waitFor(() => expect(before.result.current.isSuccess).toBe(true));
    expect(before.result.current.data?.payment.status).toBe('unpaid');
    expect(before.result.current.data?.remainingAmount).toBe(1075);

    const mut = renderHookWithQuery(() => useRecordOrderPayment());
    mut.result.current.mutate({ id: 'ord-1', body: { amount: 200, method: 'instapay' } });
    await waitFor(() => expect(mut.result.current.isSuccess).toBe(true));

    const after = renderHookWithQuery(() => useOrder('ord-1'));
    await waitFor(() => expect(after.result.current.isSuccess).toBe(true));
    const payment = after.result.current.data?.payment;
    expect(payment?.status).toBe('partially_paid');
    expect(payment?.totalCollected).toBe(200);
    expect(after.result.current.data?.remainingAmount).toBe(875);
    expect(payment?.transactions).toHaveLength(1);
    expect(payment?.transactions[0]).toMatchObject({ amount: 200, type: 'deposit' });
  });

  it('rejects a payment that exceeds the remaining total', async () => {
    const mut = renderHookWithQuery(() => useRecordOrderPayment());
    mut.result.current.mutate({ id: 'ord-1', body: { amount: 99999, method: 'cash' } });
    await waitFor(() => expect(mut.result.current.isError).toBe(true));
    expect(mut.result.current.error).toMatchObject({
      message: 'Payment amount exceeds the remaining order total',
    });
  });

  it('records a refund on a refund_pending order → refunded, collected 0', async () => {
    const before = renderHookWithQuery(() => useOrder('ord-3'));
    await waitFor(() => expect(before.result.current.isSuccess).toBe(true));
    expect(before.result.current.data?.payment.status).toBe('refund_pending');

    const mut = renderHookWithQuery(() => useRecordOrderRefund());
    mut.result.current.mutate({ id: 'ord-3', body: { method: 'instapay' } });
    await waitFor(() => expect(mut.result.current.isSuccess).toBe(true));

    const after = renderHookWithQuery(() => useOrder('ord-3'));
    await waitFor(() => expect(after.result.current.isSuccess).toBe(true));
    expect(after.result.current.data?.payment.status).toBe('refunded');
    expect(after.result.current.data?.payment.totalCollected).toBe(0);
  });

  it('rejects a refund when there is no pending refund', async () => {
    const mut = renderHookWithQuery(() => useRecordOrderRefund());
    mut.result.current.mutate({ id: 'ord-1', body: { method: 'cash' } });
    await waitFor(() => expect(mut.result.current.isError).toBe(true));
  });
});
