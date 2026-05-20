import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { Button } from '@/designs/shared/button';
import { Input } from '@/designs/shared/input';
import { Card } from '@/designs/shared/card';
import { AdminFormField } from '@/designs/shared/admin-form-field';
import { useRegisterEmail } from '@/features/auth/hooks/use-auth';
import { emailSchema } from '@/features/auth/schemas/login-form';
import { A } from '@/designs/layout/tokens';

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
      className="flex min-h-screen items-center justify-center bg-background px-4 py-12"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: A.easeOut }}
        className="w-full max-w-md"
      >
        <Card elevation="lg" padding="lg">
          <div className="mb-8 text-center">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-accent">
              S&amp;N Admin
            </p>
            <h1 className="m-0 font-display text-4xl italic leading-tight text-foreground">
              Sign in
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Enter your admin email and we'll send you a one-time code.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <AdminFormField label="Email" error={error}>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-light-foreground"
                  size={18}
                  strokeWidth={1.5}
                  aria-hidden
                />
                <Input
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={register.isPending}
                />
              </div>
            </AdminFormField>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={register.isPending}
              loadingText="Sending code…"
              disabled={!email.trim()}
            >
              Send code
            </Button>
          </form>
        </Card>
      </motion.div>
    </main>
  );
}
