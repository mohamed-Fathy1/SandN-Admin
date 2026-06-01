import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { queryClient } from '@/shared/lib/query-client';
import { useLocaleStore } from '@/shared/stores/locale-store';
import { AppErrorFallback } from './error-boundary';
import { isDev } from '@/config/env';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const locale = useLocaleStore((s) => s.locale);
  const dir: 'rtl' | 'ltr' = locale === 'ar' ? 'rtl' : 'ltr';
  return (
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster
            position={dir === 'rtl' ? 'top-left' : 'top-right'}
            dir={dir}
            richColors
            closeButton
            duration={3500}
            toastOptions={{
              className: 'rounded-xl font-body',
            }}
          />
          {isDev && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />}
        </QueryClientProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
}
