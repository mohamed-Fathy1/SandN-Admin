import { useEffect, useState, type ImgHTMLAttributes, type ReactNode } from 'react';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface SafeImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onError'> {
  fallback?: ReactNode;
  fallbackClassName?: string;
}

export function SafeImage({
  src,
  alt = '',
  className,
  fallback,
  fallbackClassName,
  ...rest
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt || undefined}
        className={cn(
          'flex items-center justify-center bg-muted text-light-foreground',
          className,
          fallbackClassName
        )}
      >
        {fallback ?? <ImageIcon size={18} strokeWidth={1.5} aria-hidden />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
