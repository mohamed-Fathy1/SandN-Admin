import type { Media } from '@/shared/types/api';

/**
 * Extract the public URL from a Media object. Returns undefined if the input is missing.
 * Use at every <img src={...}> site so a missing/malformed Media never produces "[object Object]".
 */
export function mediaUrlOf(m: Media | null | undefined): string | undefined {
  return m?.mediaUrl;
}
