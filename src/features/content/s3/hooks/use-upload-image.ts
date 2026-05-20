import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getPresignedUrl, uploadToS3 } from '../api/s3';
import { UPLOAD_LIMITS, type S3Folder } from '@/config/constants';
import { ApiError } from '@/shared/lib/axios';

interface UploadParams {
  folder: S3Folder;
  file: File;
}

const ACCEPTED_TYPES = UPLOAD_LIMITS.acceptedImageTypes.split(',');

function validateFile(file: File): string | null {
  if (file.size > UPLOAD_LIMITS.maxImageSizeBytes) {
    return `File exceeds ${UPLOAD_LIMITS.maxImageSizeBytes / (1024 * 1024)} MB`;
  }
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Unsupported file type. Use JPEG, PNG, or WebP.';
  }
  return null;
}

export function useUploadImage() {
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async ({ folder, file }: UploadParams): Promise<string> => {
      const reason = validateFile(file);
      if (reason) throw new Error(reason);

      setProgress(0);
      const { uploadUrl, fileUrl } = await getPresignedUrl(folder, file.type);
      await uploadToS3(uploadUrl, file, setProgress);
      return fileUrl;
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg);
    },
    onSettled: () => setProgress(0),
  });

  return { ...mutation, progress };
}
