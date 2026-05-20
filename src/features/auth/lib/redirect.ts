/**
 * Sanitize a user-supplied `redirect` query parameter to prevent open-redirects.
 * Only same-origin relative paths are accepted.
 */
export function safeRedirectPath(value: string | undefined | null): string {
  if (!value || typeof value !== 'string') return '/';
  if (!value.startsWith('/')) return '/';
  // Reject protocol-relative (`//evil`), backslash tricks (`/\evil`), and embedded schemes.
  if (/^\/[/\\]/.test(value)) return '/';
  if (value.includes('\\')) return '/';
  if (value.includes('://')) return '/';
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) < 0x20) return '/';
  }
  if (value.startsWith('/login')) return '/';
  return value;
}
