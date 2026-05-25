import * as Dialog from '@radix-ui/react-dialog';
import { useUiStore } from './ui-store';
import { Kbd } from '@/designs/shared/kbd';

const SHORTCUTS: { keys: string[]; label: string; hint?: string }[] = [
  { keys: ['⌘', 'K'], label: 'Open command palette', hint: 'Jump to any page' },
  { keys: ['⌘', 'B'], label: 'Toggle sidebar' },
  { keys: ['?'], label: 'Show this help' },
];

export function ShortcutHelp() {
  const open = useUiStore((s) => s.shortcutsOpen);
  const setOpen = useUiStore((s) => s.setShortcutsOpen);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          aria-label="Keyboard shortcuts"
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-overlay focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <div className="border-b border-border bg-muted/30 px-5 py-4">
            <Dialog.Title className="font-display text-xl italic text-foreground">
              Keyboard shortcuts
            </Dialog.Title>
            <Dialog.Description className="mt-0.5 text-xs text-muted-foreground">
              Move faster with these.
            </Dialog.Description>
          </div>
          <ul className="divide-y divide-border/60">
            {SHORTCUTS.map((s) => (
              <li
                key={s.label}
                className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="text-foreground">{s.label}</p>
                  {s.hint ? (
                    <p className="text-[11px] text-light-foreground">{s.hint}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {s.keys.map((k, i) => (
                    <Kbd key={i}>{k}</Kbd>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
