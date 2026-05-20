import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from './redirect';

describe('safeRedirectPath', () => {
  it.each([
    [undefined, '/'],
    [null, '/'],
    ['', '/'],
    ['relative', '/'],
    ['//evil.com', '/'],
    ['/\\evil.com', '/'],
    ['/login', '/'],
    ['/login/verify', '/'],
    ['https://evil.com', '/'],
    ['/path?with://colon', '/'],
    ['/path\x00null', '/'],
    ['/products', '/products'],
    ['/orders/123', '/orders/123'],
    ['/catalog/categories?tab=active', '/catalog/categories?tab=active'],
  ])('safeRedirectPath(%j) → %j', (input, expected) => {
    expect(safeRedirectPath(input as string | null | undefined)).toBe(expected);
  });
});
