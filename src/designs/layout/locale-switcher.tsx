import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LOCALES, type Locale } from '@/config/constants';
import { useLocaleStore } from '@/shared/stores/locale-store';

export function LocaleSwitcher() {
  const { t } = useTranslation('common');
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={t('header.language')}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Globe size={17} strokeWidth={1.5} aria-hidden />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="min-w-[180px] overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-popover data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          {LOCALES.map((code) => (
            <DropdownMenu.Item
              key={code}
              onSelect={() => setLocale(code as Locale)}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-colors data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
            >
              <span>{t(`locale.${code}`)}</span>
              {locale === code ? (
                <Check size={14} strokeWidth={2} aria-hidden className="text-accent" />
              ) : null}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
