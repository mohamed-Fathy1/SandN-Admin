import { describe, expect, it } from 'vitest';
import { colorFormSchema } from './color-form';

describe('colorFormSchema', () => {
  it('accepts a valid color and uppercases the hex', () => {
    const r = colorFormSchema.safeParse({
      name: { en: 'Dusty Rose', ar: 'وردي مغبر' },
      hex: '#bf3c68',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.hex).toBe('#BF3C68');
  });

  it('rejects malformed hex', () => {
    const r = colorFormSchema.safeParse({
      name: { en: 'Red', ar: 'أحمر' },
      hex: 'BF3C68',
    });
    expect(r.success).toBe(false);
  });

  it('rejects empty names', () => {
    const r = colorFormSchema.safeParse({
      name: { en: '', ar: '' },
      hex: '#FFFFFF',
    });
    expect(r.success).toBe(false);
  });
});
