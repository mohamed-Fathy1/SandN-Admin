import { ArrowLeft, FileQuestion } from 'lucide-react';
import { Button } from './button';
import { EmptyState } from './empty-state';
import { ApiError } from '@/shared/lib/axios';

interface NotFoundStateProps {
  error?: unknown;
  onBack: () => void;
  backLabel?: string;
}

function messageFromError(error: unknown): string | undefined {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return undefined;
}

export function NotFoundState({
  error,
  onBack,
  backLabel = 'Go back',
}: NotFoundStateProps) {
  return (
    <EmptyState
      icon={FileQuestion}
      title="Not found"
      description={
        messageFromError(error) ??
        'This item may have been removed or the link is no longer valid.'
      }
      action={
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
          {backLabel}
        </Button>
      }
    />
  );
}
