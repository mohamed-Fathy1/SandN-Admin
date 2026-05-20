import { useCallback, useId, useRef, useState } from 'react';
import { ImagePlus, Loader2, Upload, X } from 'lucide-react';
import { useUploadImage } from '@/features/content/s3/hooks/use-upload-image';
import { UPLOAD_LIMITS, type S3Folder } from '@/config/constants';
import { cn } from '@/shared/utils/cn';

interface AdminImageUploaderProps {
  folder: S3Folder;
  value?: string;
  onChange: (fileUrl: string) => void;
  onClear?: () => void;
  label?: string;
  aspectRatio?: string;
  className?: string;
  disabled?: boolean;
  hasError?: boolean;
}

const MAX_MB = UPLOAD_LIMITS.maxImageSizeBytes / (1024 * 1024);

export function AdminImageUploader({
  folder,
  value,
  onChange,
  onClear,
  label,
  aspectRatio = '4 / 5',
  className,
  disabled,
  hasError,
}: AdminImageUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const upload = useUploadImage();

  const handleFile = useCallback(
    (file: File) => {
      upload.mutate(
        { folder, file },
        {
          onSuccess: (fileUrl) => onChange(fileUrl),
        }
      );
    },
    [folder, onChange, upload]
  );

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || upload.isPending) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      ) : null}

      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !upload.isPending) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-card transition-all',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1',
          disabled && 'cursor-not-allowed opacity-50',
          isDragging
            ? 'border-accent bg-accent-soft'
            : hasError
              ? 'border-destructive'
              : 'border-border-medium hover:border-accent'
        )}
        style={{ aspectRatio }}
        aria-invalid={hasError || undefined}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={UPLOAD_LIMITS.acceptedImageTypes}
          onChange={onFileInput}
          disabled={disabled || upload.isPending}
          className="sr-only"
        />

        {value && !upload.isPending ? (
          <>
            <img
              src={value}
              alt="Uploaded preview"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
            {onClear && !disabled ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onClear();
                }}
                aria-label="Remove image"
                className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X size={14} strokeWidth={1.75} aria-hidden />
              </button>
            ) : null}
          </>
        ) : upload.isPending ? (
          <ProgressOverlay progress={upload.progress} />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ImagePlus size={18} strokeWidth={1.5} aria-hidden />
            </span>
            <p className="text-xs font-medium text-foreground">Drop an image or click to browse</p>
            <p className="text-[11px] text-muted-foreground">
              JPEG, PNG, WebP · max {MAX_MB} MB
            </p>
          </div>
        )}
      </label>
    </div>
  );
}

function ProgressOverlay({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col items-center gap-3 text-muted-foreground">
      <Loader2 size={22} strokeWidth={1.5} aria-hidden className="animate-spin text-accent" />
      <p className="text-xs font-medium text-foreground">
        {progress > 0 ? (
          <>
            Uploading <span className="tabular-nums">{progress}%</span>
          </>
        ) : (
          'Preparing upload…'
        )}
      </p>
    </div>
  );
}

/* ─────────── Used inside the multi-uploader gallery ─────────── */

export function ImageAddTile({
  folder,
  onUploaded,
  className,
}: {
  folder: S3Folder;
  onUploaded: (fileUrl: string) => void;
  className?: string;
}) {
  const upload = useUploadImage();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={upload.isPending}
      className={cn(
        'flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-medium bg-card text-muted-foreground transition-colors',
        'hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_LIMITS.acceptedImageTypes}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            upload.mutate(
              { folder, file },
              {
                onSuccess: (fileUrl) => onUploaded(fileUrl),
              }
            );
          }
          e.target.value = '';
        }}
        className="sr-only"
      />
      {upload.isPending ? (
        <Loader2 size={20} strokeWidth={1.5} className="animate-spin text-accent" aria-hidden />
      ) : (
        <Upload size={20} strokeWidth={1.5} aria-hidden />
      )}
      <span className="text-[11px] font-medium">
        {upload.isPending
          ? upload.progress > 0
            ? `Uploading ${upload.progress}%`
            : 'Preparing…'
          : 'Add image'}
      </span>
    </button>
  );
}
