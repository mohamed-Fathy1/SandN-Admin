import { ArrowLeft, FileQuestion } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  backLabel,
}: NotFoundStateProps) {
  const { t } = useTranslation('common');
  return (
    <EmptyState
      icon={FileQuestion}
      title={t('notFound.title')}
      description={messageFromError(error) ?? t('notFound.description')}
      action={
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
          {backLabel ?? t('actions.back')}
        </Button>
      }
    />
  );
}
