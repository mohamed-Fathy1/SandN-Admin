import { useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertTriangle, Check } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { cn } from '@/shared/utils/cn';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'warning';
  isPending?: boolean;
  /** If set, user must type this exact string to enable the confirm button. */
  requireTypedConfirmation?: string;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'destructive',
  isPending,
  requireTypedConfirmation,
  onConfirm,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');

  const handleOpenChange = (next: boolean) => {
    if (!next) setTyped('');
    onOpenChange(next);
  };

  const typedOk = !requireTypedConfirmation || typed === requireTypedConfirmation;
  const confirmDisabled = isPending || !typedOk;

  return (
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          style={{ WebkitBackdropFilter: 'blur(12px)' }}
        />
        <AlertDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-5 shadow-overlay focus:outline-none sm:w-full sm:p-6',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=open]:slide-in-from-bottom-1 data-[state=open]:duration-200'
          )}
          style={{
            borderColor: 'var(--glass-border)',
            boxShadow: 'var(--shadow-overlay), var(--shadow-inset)',
            overscrollBehavior: 'contain',
            touchAction: 'manipulation',
          }}
        >
          <div className="mb-5 flex items-start gap-4">
            <span
              className={cn(
                'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ring-inset',
                variant === 'destructive'
                  ? 'bg-status-cancelled-bg text-destructive ring-destructive/15'
                  : 'bg-status-under-review-bg text-warning ring-warning/15'
              )}
            >
              <AlertTriangle size={20} strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <AlertDialog.Title className="m-0 text-lg font-semibold leading-tight text-foreground">
                {title}
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-1 text-sm text-muted-foreground">
                {description}
              </AlertDialog.Description>
            </div>
          </div>

          {requireTypedConfirmation ? (
            <div className="mb-5 space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Type{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                  {requireTypedConfirmation}
                </code>{' '}
                to confirm.
              </p>
              <Input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={requireTypedConfirmation}
                disabled={isPending}
                aria-label="Confirmation phrase"
                autoFocus
                trailing={
                  typedOk ? (
                    <span
                      aria-hidden
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-status-delivered-bg text-status-delivered"
                    >
                      <Check size={14} strokeWidth={2.25} />
                    </span>
                  ) : null
                }
              />
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button variant="ghost" disabled={isPending}>
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant={variant === 'destructive' ? 'destructive' : 'primary'}
              isLoading={isPending}
              disabled={confirmDisabled}
              onClick={() => {
                void onConfirm();
              }}
            >
              {confirmLabel ?? (variant === 'destructive' ? 'Delete' : 'Confirm')}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
