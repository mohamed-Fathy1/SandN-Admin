import { describe, expect, it } from 'vitest';
import { canCancel, isTerminal, nextStatus } from './status-machine';
import { ORDER_STATUSES } from '@/config/constants';

describe('status-machine', () => {
  it('walks ordered → confirmed → under_review → shipped → delivered', () => {
    expect(nextStatus('ordered')).toBe('confirmed');
    expect(nextStatus('confirmed')).toBe('under_review');
    expect(nextStatus('under_review')).toBe('shipped');
    expect(nextStatus('shipped')).toBe('delivered');
  });

  it('returns null for terminal states', () => {
    expect(nextStatus('delivered')).toBeNull();
    expect(nextStatus('cancelled')).toBeNull();
    expect(nextStatus('deleted')).toBeNull();
  });

  it('allows cancel for ordered, confirmed, under_review', () => {
    expect(canCancel('ordered')).toBe(true);
    expect(canCancel('confirmed')).toBe(true);
    expect(canCancel('under_review')).toBe(true);
  });

  it('disallows cancel once shipped or after a terminal state', () => {
    expect(canCancel('shipped')).toBe(false);
    expect(canCancel('delivered')).toBe(false);
    expect(canCancel('cancelled')).toBe(false);
    expect(canCancel('deleted')).toBe(false);
  });

  it('marks delivered/cancelled/deleted as terminal', () => {
    expect(isTerminal('delivered')).toBe(true);
    expect(isTerminal('cancelled')).toBe(true);
    expect(isTerminal('deleted')).toBe(true);
  });

  it('non-terminal states return false', () => {
    for (const s of ORDER_STATUSES) {
      if (s === 'delivered' || s === 'cancelled' || s === 'deleted') continue;
      expect(isTerminal(s)).toBe(false);
    }
  });
});
