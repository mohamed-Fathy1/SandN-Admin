import { describe, expect, it } from 'vitest';
import { offerFormSchema } from './offer-form';

const baseOffer = {
  isActive: true,
  image: 'https://cdn.test/banner.jpg',
  description: { en: 'Free shipping above 500 EGP', ar: 'شحن مجاني عند الشراء بـ 500 جنيه' },
  minOrderAmount: 500,
};

describe('offerFormSchema', () => {
  it('accepts a valid fixed_discount offer', () => {
    const r = offerFormSchema.safeParse({
      ...baseOffer,
      type: 'fixed_discount',
      discountAmount: 100,
    });
    expect(r.success).toBe(true);
  });

  it('accepts a valid free_shipping offer without discount', () => {
    const r = offerFormSchema.safeParse({
      ...baseOffer,
      type: 'free_shipping',
    });
    expect(r.success).toBe(true);
  });

  it('rejects fixed_discount with missing discountAmount', () => {
    const r = offerFormSchema.safeParse({ ...baseOffer, type: 'fixed_discount' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('discountAmount');
    }
  });

  it('rejects fixed_discount with zero discountAmount', () => {
    const r = offerFormSchema.safeParse({
      ...baseOffer,
      type: 'fixed_discount',
      discountAmount: 0,
    });
    expect(r.success).toBe(false);
  });

  it('rejects negative minOrderAmount', () => {
    const r = offerFormSchema.safeParse({
      ...baseOffer,
      type: 'free_shipping',
      minOrderAmount: -1,
    });
    expect(r.success).toBe(false);
  });

  it('rejects non-URL image', () => {
    const r = offerFormSchema.safeParse({
      ...baseOffer,
      image: 'not-a-url',
      type: 'free_shipping',
    });
    expect(r.success).toBe(false);
  });

  it('requires both languages in description', () => {
    const r = offerFormSchema.safeParse({
      ...baseOffer,
      description: { en: 'short', ar: '' },
      type: 'free_shipping',
    });
    expect(r.success).toBe(false);
  });
});
