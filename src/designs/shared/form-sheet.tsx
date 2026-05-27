import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/shared/utils/cn';

interface FormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: 'right' | 'left';
  size?: 'md' | 'lg';
}

export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = 'right',
  size = 'md',
}: FormSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          style={{ WebkitBackdropFilter: 'blur(4px)' }}
        />
        <Dialog.Content
          className={cn(
            'fixed z-50 flex h-full flex-col bg-card shadow-overlay',
            'top-0 w-full sm:top-2 sm:h-[calc(100vh-1rem)]',
            side === 'right' ? 'right-0 sm:right-2 sm:rounded-l-2xl' : 'left-0 sm:left-2 sm:rounded-r-2xl',
            'overflow-hidden',
            size === 'md' ? 'max-w-md' : 'max-w-2xl max-md:max-w-full',
            'data-[state=open]:animate-in data-[state=closed]:animate-out duration-300',
            side === 'right'
              ? 'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right'
              : 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
            'focus:outline-none'
          )}
        >
          <div className="relative flex items-start justify-between gap-3 border-b border-border px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px [background:var(--gradient-form-sheet-underline)]"
            />
            <div className="min-w-0">
              <Dialog.Title className="m-0 font-display text-2xl italic leading-tight text-foreground">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1.5 text-xs text-muted-foreground">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close"
                className="-mr-2 -mt-1 shrink-0"
              >
                <X size={18} strokeWidth={1.5} aria-hidden />
              </Button>
            </Dialog.Close>
          </div>

          <div
            className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5"
            style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
          >
            {children}
          </div>

          {footer ? (
            <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/85 sm:px-6 sm:py-4">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
