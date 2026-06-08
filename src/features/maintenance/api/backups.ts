import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';
import type { BackupHistory } from '@/shared/types/api';

/**
 * Reads MongoDB backup history + health straight from the backup bucket.
 * Read-only endpoint — there are no create/delete actions. Admin token is
 * attached by the shared axios request interceptor.
 */
export async function fetchBackupHistory(): Promise<BackupHistory> {
  const { data } = await api.get<ApiResponse<BackupHistory>>('/backup/admin/all');
  return data.data;
}
