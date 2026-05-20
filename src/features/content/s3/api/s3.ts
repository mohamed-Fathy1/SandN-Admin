import { api } from '@/shared/lib/axios';
import { s3 } from '@/shared/lib/axios-s3';
import type { ApiResponse } from '@/shared/types';
import type { ApiPresignedUrlResponse } from '@/shared/types/api';
import type { S3Folder } from '@/config/constants';

interface PresignFile {
  contentType: string;
  fileName?: string;
}

interface PresignResponse {
  files: ApiPresignedUrlResponse[];
}

export async function getPresignedUrl(
  folder: S3Folder,
  contentType: string,
  fileName?: string
): Promise<ApiPresignedUrlResponse> {
  const body: { folder: S3Folder; files: PresignFile[] } = {
    folder,
    files: [{ contentType, ...(fileName ? { fileName } : {}) }],
  };
  const { data } = await api.post<ApiResponse<PresignResponse>>('/aws/get-presigned-url', body);
  const file = data.data.files?.[0];
  if (!file) {
    throw new Error('Presigned URL response was empty');
  }
  return file;
}

export async function uploadToS3(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  await s3.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    onUploadProgress: (e) => {
      if (!onProgress || !e.total) return;
      onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
}

export async function deleteS3Image(fileName: string): Promise<void> {
  await api.delete('/aws/delete-presigned-url', { params: { fileName } });
}
