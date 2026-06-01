import type { FallbackProps } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { Button } from '@/designs/shared/button';
import { Card } from '@/designs/shared/card';
import { logoutAndRedirect } from '@/features/auth/lib/logout';

export function AppErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const { t } = useTranslation('common');
  const message = error instanceof Error ? error.message : String(error);

  return (
    <div
      role="alert"
      className="flex min-h-screen items-center justify-center bg-background px-4 py-8"
    >
      <Card elevation="md" padding="lg" className="w-full max-w-lg">
        <h1 className="m-0 mb-2 font-display text-3xl italic leading-tight text-foreground">
          {t('errorBoundary.title')}
        </h1>
        <p className="mb-4 mt-0 text-sm text-muted-foreground">
          {t('errorBoundary.subtitle')}
        </p>
        <pre className="mb-4 max-h-40 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs text-muted-foreground">
          {message}
        </pre>
        <div className="flex gap-2">
          <Button onClick={resetErrorBoundary} className="flex-1">
            {t('states.tryAgain')}
          </Button>
          <Button variant="outline" onClick={logoutAndRedirect} className="flex-1">
            {t('header.logout')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
