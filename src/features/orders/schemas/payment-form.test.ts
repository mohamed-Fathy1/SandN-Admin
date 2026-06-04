import { describe, expect, it } from 'vitest';
import { makePaymentFormSchema, refundFormSchema } from './payment-form';

describe('makePaymentFormSchema', () => {
  const schema = makePaymentFormSchema(300);

  it('accepts a valid deposit within the remaining balance', () => {
    const result = schema.safeParse({ amount: 200, method: 'instapay' });
    expect(result.success).toBe(true);
  });

  it('rejects a non-positive amount', () => {
    expect(schema.safeParse({ amount: 0, method: 'cash' }).success).toBe(false);
    expect(schema.safeParse({ amount: -5, method: 'cash' }).success).toBe(false);
  });

  it('rejects an amount that exceeds the remaining balance', () => {
    const result = schema.safeParse({ amount: 301, method: 'cash' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/exceeds the remaining/i);
    }
  });

  it('rejects an unknown method', () => {
    expect(schema.safeParse({ amount: 100, method: 'paypal' }).success).toBe(false);
  });

  it('accepts an optional note and receipt url, treating empty string as allowed', () => {
    expect(
      schema.safeParse({ amount: 100, method: 'bank_transfer', note: 'ref 123', receiptImageUrl: '' })
        .success
    ).toBe(true);
  });
});

describe('refundFormSchema', () => {
  it('requires a method', () => {
    expect(refundFormSchema.safeParse({}).success).toBe(false);
    expect(refundFormSchema.safeParse({ method: 'instapay' }).success).toBe(true);
  });
});
