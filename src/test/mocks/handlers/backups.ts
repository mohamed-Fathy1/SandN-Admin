import { http, HttpResponse } from 'msw';
import type { BackupHistory } from '@/shared/types/api';

const API = 'https://api.test.local';

// 08th + 06th present, 07th deliberately absent → one missing-day gap.
const sample: BackupHistory = {
  summary: {
    bucket: 'snlingeri-db-backups',
    region: 'ap-northeast-1',
    total: 2,
    latestAt: '2026-06-08T04:38:00.000Z',
    latestSize: '40.3 KB',
    hoursSinceLatest: 3.1,
    healthy: true,
  },
  backups: [
    {
      fileName: 'backup-2026-06-08_043744.gz',
      key: 'mongo/backup-2026-06-08_043744.gz',
      createdAt: '2026-06-08T04:38:00.000Z',
      sizeBytes: 41296,
      size: '40.3 KB',
    },
    {
      fileName: 'backup-2026-06-06_043700.gz',
      key: 'mongo/backup-2026-06-06_043700.gz',
      createdAt: '2026-06-06T04:37:00.000Z',
      sizeBytes: 40180,
      size: '39.2 KB',
    },
  ],
};

export const backupHandlers = [
  http.get(`${API}/backup/admin/all`, () =>
    HttpResponse.json({
      statusCode: 200,
      data: sample,
      message: 'Success',
      success: true,
    })
  ),
];
