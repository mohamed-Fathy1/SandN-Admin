import { describe, expect, it } from 'vitest';
import { shippingFormSchema } from './shipping-form';

describe('shippingFormSchema', () => {
  it('accepts a valid region', () => {
    const r = shippingFormSchema.safeParse({
      name: { en: 'Cairo', ar: 'القاهرة' },
      cost: 75,
    });
    expect(r.success).toBe(true);
  });

  it('rejects negative cost', () => {
    const r = shippingFormSchema.safeParse({
      name: { en: 'Cairo', ar: 'القاهرة' },
      cost: -1,
    });
    expect(r.success).toBe(false);
  });

  it('rejects non-integer cost', () => {
    const r = shippingFormSchema.safeParse({
      name: { en: 'Cairo', ar: 'القاهرة' },
      cost: 1.5,
    });
    expect(r.success).toBe(false);
  });

  it('requires both languages', () => {
    const r = shippingFormSchema.safeParse({
      name: { en: '', ar: 'القاهرة' },
      cost: 75,
    });
    expect(r.success).toBe(false);
  });

  it('rejects missing cost as NaN', () => {
    const r = shippingFormSchema.safeParse({
      name: { en: 'Cairo', ar: 'القاهرة' },
      cost: Number.NaN,
    });
    expect(r.success).toBe(false);
  });
});
