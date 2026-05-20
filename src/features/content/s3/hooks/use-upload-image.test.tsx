import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { useUploadImage } from './use-upload-image';
import { renderHookWithQuery } from '@/test/utils';
import { s3PublicUrl } from '@/test/mocks/handlers/s3';

function makeFile(size = 1024, type = 'image/png') {
  return new File([new Uint8Array(size)], 'test.png', { type });
}

describe('useUploadImage', () => {
  it('returns the public fileUrl after a successful presign + PUT', async () => {
    const { result } = renderHookWithQuery(() => useUploadImage());
    result.current.mutate({ folder: 'Category', file: makeFile() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(s3PublicUrl);
  });

  it('rejects unsupported file types', async () => {
    const { result } = renderHookWithQuery(() => useUploadImage());
    result.current.mutate({
      folder: 'Category',
      file: makeFile(1024, 'application/pdf'),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toMatch(/unsupported/i);
  });

  it('rejects files larger than 5 MB', async () => {
    const { result } = renderHookWithQuery(() => useUploadImage());
    result.current.mutate({
      folder: 'Category',
      file: makeFile(6 * 1024 * 1024),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toMatch(/exceeds/i);
  });
});
