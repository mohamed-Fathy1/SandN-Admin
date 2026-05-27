import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { Button } from '@/designs/shared/button';
import { Input } from '@/designs/shared/input';
import { Card } from '@/designs/shared/card';
import { AdminFormField } from '@/designs/shared/admin-form-field';
import { FloatingOrb } from '@/designs/shared/motion';
import { useRegisterEmail } from '@/features/auth/hooks/use-auth';
import { emailSchema } from '@/features/auth/schemas/login-form';
import { A, accentAlpha } from '@/designs/layout/tokens';

export function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/login' });
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const register = useRegisterEmail();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    const parsed = emailSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid email');
      return;
    }
    register.mutate(parsed.data.email, {
      onSuccess: () => {
        navigate({
          to: '/login/verify',
          search: { email: parsed.data.email, redirect: search.redirect },
        });
      },
    });
  };

  return (
    <main
      id="main-content"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12"
    >
      <FloatingOrb
        size={420}
        color={accentAlpha(0.22)}
        top="-120px"
        left="-80px"
        delay={0}
        opacity={0.6}
      />
      <FloatingOrb
        size={340}
        color="rgba(217,119,6,0.16)"
        bottom="-100px"
        right="-60px"
        delay={2}
        opacity={0.55}
      />
      <FloatingOrb
        size={260}
        color="rgba(64,20,35,0.12)"
        top="20%"
        right="12%"
        delay={4}
        opacity={0.35}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: A.easeOut }}
        className="relative z-10 w-full max-w-md"
      >
        <Card
          elevation="lg"
          padding="lg"
          className="backdrop-blur-xl"
          style={{
            background: 'var(--glass-bg)',
            borderColor: 'var(--glass-border)',
            boxShadow: 'var(--shadow-overlay), var(--shadow-inset)',
          }}
        >
          <div className="mb-8 text-center">
            <p className="mb-3 inline-flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">
              <span aria-hidden className="inline-block h-px w-6 bg-gradient-to-r from-transparent to-accent/70" />
              S&amp;N Admin
              <span aria-hidden className="inline-block h-px w-6 bg-gradient-to-l from-transparent to-accent/70" />
            </p>
            <h1 className="m-0 font-display text-4xl italic leading-tight tracking-tight text-foreground">
              Sign in
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Enter your admin email and we'll send you a one-time code.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <AdminFormField label="Email" error={error}>
              <Input
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                autoFocus
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={register.isPending}
                leadingIcon={<Mail size={18} strokeWidth={1.5} aria-hidden />}
              />
            </AdminFormField>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={register.isPending}
              loadingText="Sending code…"
            >
              Send code
            </Button>

            <p className="text-center text-[11px] text-light-foreground">
              We'll email a 6-digit code that expires in 10 minutes.
            </p>
          </form>
        </Card>
      </motion.div>
    </main>
  );
}
