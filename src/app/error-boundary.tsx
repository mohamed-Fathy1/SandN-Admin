import type { FallbackProps } from 'react-error-boundary';
import { Button } from '@/designs/shared/button';
import { Card } from '@/designs/shared/card';
import { logoutAndRedirect } from '@/features/auth/lib/logout';

export function AppErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    <div
      role="alert"
      className="flex min-h-screen items-center justify-center bg-background px-4 py-8"
    >
      <Card elevation="md" padding="lg" className="w-full max-w-lg">
        <h1 className="m-0 mb-2 font-display text-3xl italic leading-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mb-4 mt-0 text-sm text-muted-foreground">
          The admin dashboard hit an unexpected error.
        </p>
        <pre className="mb-4 max-h-40 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs text-muted-foreground">
          {message}
        </pre>
        <div className="flex gap-2">
          <Button onClick={resetErrorBoundary} className="flex-1">
            Try again
          </Button>
          <Button variant="outline" onClick={logoutAndRedirect} className="flex-1">
            Log out
          </Button>
        </div>
      </Card>
    </div>
  );
}
