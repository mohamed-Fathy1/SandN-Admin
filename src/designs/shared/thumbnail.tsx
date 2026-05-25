import { cn } from '@/shared/utils/cn';

interface ThumbnailProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE: Record<NonNullable<ThumbnailProps['size']>, string> = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-14 w-14',
};

const SIZE_PX: Record<NonNullable<ThumbnailProps['size']>, number> = {
  sm: 40,
  md: 48,
  lg: 56,
};

const RADIUS: Record<NonNullable<ThumbnailProps['rounded']>, string> = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
};

export function Thumbnail({
  src,
  alt = '',
  size = 'sm',
  rounded = 'lg',
  className,
}: ThumbnailProps) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden bg-muted ring-1 ring-border-medium',
        SIZE[size],
        RADIUS[rounded],
        className
      )}
      aria-hidden={!src}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          width={SIZE_PX[size]}
          height={SIZE_PX[size]}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-light-foreground">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
        </span>
      )}
    </div>
  );
}
