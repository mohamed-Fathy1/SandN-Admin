import { describe, expect, it } from 'vitest';
import { productFormSchema } from './product-form';

const baseProduct = {
  name: { en: 'Cotton Bralette', ar: 'حمالة قطنية مريحة' },
  description: {
    en: '<p>Comfortable cotton bralette for daily wear</p>',
    ar: '<p>حمالة قطنية مريحة للاستخدام اليومي</p>',
  },
  price: 100,
  wholesalePrice: 60,
  salePrice: 0,
  saleStartDate: 0,
  saleEndDate: 0,
  category: 'bras',
  defaultImage: 'https://cdn.test/default.jpg',
  albumImages: ['https://cdn.test/1.jpg'],
  variants: [{ quantity: 5 }],
};

describe('productFormSchema description', () => {
  it('accepts a valid HTML description in both languages', () => {
    const r = productFormSchema.safeParse(baseProduct);
    expect(r.success).toBe(true);
  });

  it('accepts a legacy plain-text description (no tags)', () => {
    const r = productFormSchema.safeParse({
      ...baseProduct,
      description: { en: 'Just plain legacy text', ar: 'نص قديم عادي بدون أي وسوم' },
    });
    expect(r.success).toBe(true);
  });

  it('rejects an empty editor document and attaches the error to description.en', () => {
    const r = productFormSchema.safeParse({
      ...baseProduct,
      description: { en: '<p></p>', ar: baseProduct.description.ar },
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const issue = r.error.issues.find((i) => i.path.join('.') === 'description.en');
      expect(issue?.message).toBe('English description is required');
    }
  });

  it('rejects whitespace-only / markup-only descriptions', () => {
    const r = productFormSchema.safeParse({
      ...baseProduct,
      description: { en: '<p><strong></strong></p>', ar: '<ul><li></li></ul>' },
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('description.en');
      expect(paths).toContain('description.ar');
    }
  });
});
