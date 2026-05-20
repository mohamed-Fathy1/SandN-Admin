import { useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertTriangle } from 'lucide-react';
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
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-overlay focus:outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
          )}
        >
          <div className="mb-4 flex items-start gap-3">
            <span
              className={cn(
                'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                variant === 'destructive'
                  ? 'bg-status-cancelled-bg text-destructive'
                  : 'bg-status-under-review-bg text-warning'
              )}
            >
              <AlertTriangle size={20} strokeWidth={1.5} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <AlertDialog.Title className="m-0 text-base font-semibold text-foreground">
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
