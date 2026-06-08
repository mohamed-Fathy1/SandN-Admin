import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQuery } from '@/test/utils';
import { useBackupHistory } from './use-backups';

describe('useBackupHistory', () => {
  it('unwraps the envelope and returns summary + backups', async () => {
    const { result } = renderHookWithQuery(() => useBackupHistory());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.summary.healthy).toBe(true);
    expect(result.current.data?.summary.bucket).toBe('snlingeri-db-backups');
    expect(result.current.data?.backups).toHaveLength(2);
    expect(result.current.data?.backups[0].fileName).toBe('backup-2026-06-08_043744.gz');
  });
});
