import * as Dialog from '@radix-ui/react-dialog';
import { useTranslation } from 'react-i18next';
import { useUiStore } from './ui-store';
import { Kbd } from '@/designs/shared/kbd';

const SHORTCUTS: { keys: string[]; labelKey: string; hintKey?: string }[] = [
  { keys: ['⌘', 'K'], labelKey: 'shortcuts.palette', hintKey: 'shortcuts.paletteHint' },
  { keys: ['⌘', 'B'], labelKey: 'shortcuts.toggleSidebar' },
  { keys: ['?'], labelKey: 'shortcuts.showHelp' },
];

export function ShortcutHelp() {
  const { t } = useTranslation('common');
  const open = useUiStore((s) => s.shortcutsOpen);
  const setOpen = useUiStore((s) => s.setShortcutsOpen);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          aria-label={t('shortcuts.title')}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-overlay focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <div className="border-b border-border bg-muted/30 px-5 py-4">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              {t('shortcuts.title')}
            </Dialog.Title>
            <Dialog.Description className="mt-0.5 text-sm text-muted-foreground">
              {t('shortcuts.subtitle')}
            </Dialog.Description>
          </div>
          <ul className="divide-y divide-border/60">
            {SHORTCUTS.map((s) => (
              <li
                key={s.labelKey}
                className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="text-foreground">{t(s.labelKey)}</p>
                  {s.hintKey ? (
                    <p className="text-xs text-light-foreground">{t(s.hintKey)}</p>
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
