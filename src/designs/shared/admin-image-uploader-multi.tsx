import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ImageAddTile } from './admin-image-uploader';
import { type S3Folder } from '@/config/constants';
import { cn } from '@/shared/utils/cn';

interface AdminImageUploaderMultiProps {
  folder: S3Folder;
  values: string[];
  onChange: (fileUrls: string[]) => void;
  max?: number;
  className?: string;
  label?: string;
  hint?: string;
}

export function AdminImageUploaderMulti({
  folder,
  values,
  onChange,
  max = 10,
  className,
  label,
  hint,
}: AdminImageUploaderMultiProps) {
  const handleAdd = (fileUrl: string) => {
    onChange([...values, fileUrl]);
  };

  const handleRemove = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= values.length) return;
    const next = [...values];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const atMax = values.length >= max;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {values.length} / {max}
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {values.map((url, idx) => (
          <div
            key={`${url}-${idx}`}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border-medium bg-card"
          >
            <img
              src={url}
              alt={`Image ${idx + 1}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent px-2 py-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <button
                type="button"
                onClick={() => move(idx, idx - 1)}
                disabled={idx === 0}
                aria-label="Move image left"
                className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-foreground disabled:opacity-40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronLeft size={14} strokeWidth={1.75} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => move(idx, idx + 1)}
                disabled={idx === values.length - 1}
                aria-label="Move image right"
                className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-foreground disabled:opacity-40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              aria-label={`Remove image ${idx + 1}`}
              className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X size={14} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        ))}

        {!atMax ? <ImageAddTile folder={folder} onUploaded={handleAdd} /> : null}
      </div>

      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
