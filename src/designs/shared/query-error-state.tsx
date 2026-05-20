import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from './button';
import { ApiError } from '@/shared/lib/axios';
import { cn } from '@/shared/utils/cn';

interface QueryErrorStateProps {
  error?: unknown;
  onRetry?: () => void;
  className?: string;
  title?: string;
}

export function QueryErrorState({ error, onRetry, className, title }: QueryErrorStateProps) {
  const message =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Something went wrong loading this data.';

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-card',
        className
      )}
    >
      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-status-cancelled-bg text-status-cancelled">
        <AlertTriangle size={22} strokeWidth={1.5} aria-hidden />
      </div>
      <h3 className="m-0 text-base font-semibold text-foreground">
        {title ?? "Couldn't load"}
      </h3>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-5">
          <RefreshCcw size={14} strokeWidth={1.5} aria-hidden />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
