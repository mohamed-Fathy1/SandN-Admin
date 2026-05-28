import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, formatEGP, formatGroupName, formatNumber } from './format';

describe('format', () => {
  describe('formatEGP', () => {
    it('renders an integer with the EGP currency symbol', () => {
      const out = formatEGP(1500);
      expect(out).toMatch(/1,?500/);
      expect(out.toUpperCase()).toContain('EGP');
    });

    it('returns an em-dash for null / undefined', () => {
      expect(formatEGP(null)).toBe('—');
      expect(formatEGP(undefined)).toBe('—');
    });

    it('keeps zero distinct from the missing-value dash', () => {
      const zero = formatEGP(0);
      expect(zero).not.toBe('—');
      expect(zero).toMatch(/0/);
    });
  });

  describe('formatNumber', () => {
    it('thousands-separates a number', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
    });
    it('returns dash for null', () => {
      expect(formatNumber(null)).toBe('—');
    });
  });

  describe('formatDate / formatDateTime', () => {
    const iso = '2026-05-20T13:45:00.000Z';
    it('formats a known ISO string', () => {
      expect(formatDate(iso)).toMatch(/2026/);
      expect(formatDateTime(iso)).toMatch(/2026/);
    });
    it('returns dash for null and invalid input', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate('not-a-date')).toBe('—');
      expect(formatDateTime(undefined)).toBe('—');
    });
  });

  describe('formatGroupName', () => {
    it('title-cases free-form group names', () => {
      expect(formatGroupName('letters')).toBe('Letters');
      expect(formatGroupName('numeric')).toBe('Numeric');
      expect(formatGroupName('one size')).toBe('One Size');
      expect(formatGroupName('custom')).toBe('Custom');
    });
  });
});
