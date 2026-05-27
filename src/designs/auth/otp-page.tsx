import { useRef, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/designs/shared/button';
import { Card } from '@/designs/shared/card';
import { OtpInput, type OtpInputHandle } from '@/features/auth/components/otp-input';
import { useActivateAccount, useResendCode } from '@/features/auth/hooks/use-auth';
import { useCooldown } from '@/shared/hooks/use-cooldown';
import { safeRedirectPath } from '@/features/auth/lib/redirect';
import { A } from '@/designs/layout/tokens';

const RESEND_COOLDOWN_SECONDS = 60;

export function OtpPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/login_/verify' });
  const email = search.email;
  const redirect = safeRedirectPath(search.redirect);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const otpRef = useRef<OtpInputHandle>(null);
  const activate = useActivateAccount();
  const resend = useResendCode();
  const cooldown = useCooldown();

  const submitCode = (finalCode: string) => {
    setError(undefined);
    activate.mutate(
      { email, activeCode: finalCode },
      {
        onSuccess: () => {
          window.location.href = redirect;
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : 'Verification failed';
          if (/expired/i.test(msg)) setError('Code expired — request a new one.');
          else if (/incorrect/i.test(msg)) setError('Code is incorrect.');
          else setError(msg);
          setCode('');
          otpRef.current?.focusFirst();
        },
      }
    );
  };

  const handleResend = () => {
    resend.mutate(email, {
      onSuccess: () => {
        cooldown.start(RESEND_COOLDOWN_SECONDS);
        setCode('');
        setError(undefined);
        otpRef.current?.focusFirst();
      },
    });
  };

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-background px-4 py-12"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: A.easeOut }}
        className="w-full max-w-md"
      >
        <Card
          elevation="lg"
          padding="lg"
          className={`backdrop-blur-xl transition-colors ${error ? 'border-destructive/30' : ''}`}
          style={{
            background: 'var(--glass-bg)',
            borderColor: error ? undefined : 'var(--glass-border)',
            boxShadow: 'var(--shadow-overlay), var(--shadow-inset)',
          }}
        >
          <button
            type="button"
            onClick={() => navigate({ to: '/login' })}
            className="mb-6 inline-flex items-center gap-1 rounded-md px-1 -mx-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
            Change email
          </button>

          <div className="mb-8 text-center">
            <p className="mb-3 inline-flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">
              <span aria-hidden className="inline-block h-px w-6 bg-gradient-to-r from-transparent to-accent/70" />
              Verify
              <span aria-hidden className="inline-block h-px w-6 bg-gradient-to-l from-transparent to-accent/70" />
            </p>
            <h1 className="m-0 font-display text-3xl italic leading-tight tracking-tight text-foreground">
              Enter the code
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We sent a 6-digit code to <strong className="text-foreground">{email}</strong>.
            </p>
          </div>

          <div className="space-y-5">
            <OtpInput
              ref={otpRef}
              value={code}
              onChange={setCode}
              onComplete={submitCode}
              hasError={Boolean(error)}
              disabled={activate.isPending}
            />

            {error ? (
              <p role="alert" className="text-center text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={() => {
                if (code.length !== 6) {
                  setError('Enter the 6-digit code.');
                  otpRef.current?.focusFirst();
                  return;
                }
                submitCode(code);
              }}
              isLoading={activate.isPending}
              loadingText="Verifying…"
            >
              Verify
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Didn&rsquo;t get the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown.isActive || resend.isPending}
                className="rounded-md px-1 -mx-1 font-semibold text-accent transition-colors hover:underline disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {cooldown.isActive
                  ? `Resend in ${cooldown.secondsLeft}s`
                  : resend.isPending
                    ? 'Sending…'
                    : 'Resend code'}
              </button>
            </div>
          </div>
        </Card>
      </motion.div>
    </main>
  );
}
