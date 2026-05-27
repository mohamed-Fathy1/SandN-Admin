import { ApiError } from '@/shared/lib/axios';

/**
 * Convert an ApiError.errors[] array into a flat `{ fieldPath: message }`
 * map keyed by joined path (e.g. `name.en`, `variants.0.quantity`).
 *
 * Returns null if the error is not an ApiError or has no field errors —
 * callers fall back to the toast-level message in that case.
 */
export function mapApiErrorsToFields(
  error: unknown
): Record<string, string> | null {
  if (!(error instanceof ApiError) || error.errors.length === 0) return null;
  const out: Record<string, string> = {};
  for (const e of error.errors) {
    if (!e.path || e.path.length === 0) continue;
    const key = e.path.join('.');
    if (!(key in out)) out[key] = e.message;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * Pull a single field's server-side error by joined path.
 * Returns undefined if no API error exists for that field.
 */
export function getApiFieldError(
  fieldErrors: Record<string, string> | null,
  path: string
): string | undefined {
  return fieldErrors?.[path];
}
