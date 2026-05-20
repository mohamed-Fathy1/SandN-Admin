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
        <Card elevation="lg" padding="lg">
          <button
            type="button"
            onClick={() => navigate({ to: '/login' })}
            className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none"
          >
            <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
            Change email
          </button>

          <div className="mb-8 text-center">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-accent">
              Verify
            </p>
            <h1 className="m-0 font-display text-3xl italic leading-tight text-foreground">
              Enter the code
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
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
              onClick={() => code.length === 6 && submitCode(code)}
              isLoading={activate.isPending}
              loadingText="Verifying…"
              disabled={code.length !== 6}
            >
              Verify
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Didn't get the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown.isActive || resend.isPending}
                className="font-semibold text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none"
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
