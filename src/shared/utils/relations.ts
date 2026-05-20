/**
 * Relation helpers — backend frequently returns either a raw `_id` string or a populated
 * sub-document depending on the endpoint. These keep call sites concise without leaking
 * the `typeof === 'string'` check into every component.
 */

import type { BilingualText } from '@/shared/types';

export interface IdRef {
  _id: string;
}

export type Ref<T extends IdRef> = string | T | undefined | null;

export function idOf<T extends IdRef>(ref: Ref<T>): string {
  if (!ref) return '';
  return typeof ref === 'string' ? ref : ref._id;
}

export function nameOf<T extends IdRef & { name?: BilingualText }>(ref: Ref<T>): string {
  if (!ref || typeof ref === 'string') return '—';
  return ref.name?.en ?? '—';
}
