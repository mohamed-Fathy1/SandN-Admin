import { useId, useState } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Input } from './input';
import { Textarea } from './textarea';
import { cn } from '@/shared/utils/cn';
import type { BilingualText } from '@/shared/types';
import { isBilingualFilled } from '@/shared/utils/bilingual';

type Lang = 'en' | 'ar';

interface BilingualInputProps {
  label?: string;
  value: BilingualText;
  onChange: (value: BilingualText) => void;
  multiline?: boolean;
  required?: boolean;
  placeholder?: { en?: string; ar?: string };
  error?: { ar?: string; en?: string };
  rows?: number;
  defaultTab?: Lang;
}

export function BilingualInput({
  label,
  value,
  onChange,
  multiline = false,
  required,
  placeholder,
  error,
  rows = 4,
  defaultTab = 'en',
}: BilingualInputProps) {
  const baseId = useId();
  const [tab, setTab] = useState<Lang>(defaultTab);
  const filled = isBilingualFilled(value);
  const hasEnError = Boolean(error?.en);
  const hasArError = Boolean(error?.ar);

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <div className="flex items-center justify-between">
          <label htmlFor={`${baseId}-${tab}`} className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </label>
          {filled && (
            <span
              aria-hidden
              className="inline-flex items-center gap-1 text-[11px] text-status-delivered"
            >
              <Check size={12} strokeWidth={2} aria-hidden />
              Both filled
            </span>
          )}
        </div>
      ) : null}

      <TabsPrimitive.Root value={tab} onValueChange={(v) => setTab(v as Lang)}>
        <TabsPrimitive.List className="relative mb-2 inline-flex gap-1 rounded-full border border-border bg-card p-1">
          <BilingualTabTrigger value="en" current={tab} hasError={hasEnError}>
            English
          </BilingualTabTrigger>
          <BilingualTabTrigger value="ar" current={tab} hasError={hasArError}>
            عربي
          </BilingualTabTrigger>
        </TabsPrimitive.List>

        <TabsPrimitive.Content value="en">
          {multiline ? (
            <Textarea
              id={`${baseId}-en`}
              dir="ltr"
              rows={rows}
              value={value.en}
              onChange={(e) => onChange({ ...value, en: e.target.value })}
              placeholder={placeholder?.en}
              hasError={hasEnError}
              className="font-body"
              aria-describedby={hasEnError ? `${baseId}-en-err` : undefined}
            />
          ) : (
            <Input
              id={`${baseId}-en`}
              dir="ltr"
              value={value.en}
              onChange={(e) => onChange({ ...value, en: e.target.value })}
              placeholder={placeholder?.en}
              hasError={hasEnError}
              className="font-body"
              aria-describedby={hasEnError ? `${baseId}-en-err` : undefined}
            />
          )}
          {hasEnError ? (
            <p id={`${baseId}-en-err`} role="alert" className="mt-1 text-xs text-destructive">
              {error?.en}
            </p>
          ) : null}
        </TabsPrimitive.Content>

        <TabsPrimitive.Content value="ar">
          {multiline ? (
            <Textarea
              id={`${baseId}-ar`}
              dir="rtl"
              rows={rows}
              value={value.ar}
              onChange={(e) => onChange({ ...value, ar: e.target.value })}
              placeholder={placeholder?.ar}
              hasError={hasArError}
              className="font-body-ar text-right"
              aria-describedby={hasArError ? `${baseId}-ar-err` : undefined}
            />
          ) : (
            <Input
              id={`${baseId}-ar`}
              dir="rtl"
              value={value.ar}
              onChange={(e) => onChange({ ...value, ar: e.target.value })}
              placeholder={placeholder?.ar}
              hasError={hasArError}
              className="font-body-ar text-right"
              aria-describedby={hasArError ? `${baseId}-ar-err` : undefined}
            />
          )}
          {hasArError ? (
            <p id={`${baseId}-ar-err`} role="alert" className="mt-1 text-xs text-destructive">
              {error?.ar}
            </p>
          ) : null}
        </TabsPrimitive.Content>
      </TabsPrimitive.Root>
    </div>
  );
}

function BilingualTabTrigger({
  value,
  current,
  hasError,
  children,
}: {
  value: Lang;
  current: Lang;
  hasError: boolean;
  children: React.ReactNode;
}) {
  const isActive = current === value;
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn(
        'relative inline-flex h-7 items-center gap-1 rounded-full px-3 text-[11px] font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive ? 'text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {isActive && (
        <motion.span
          layoutId="bilingual-tab-indicator"
          className="absolute inset-0 rounded-full bg-accent shadow-accent"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
      {hasError && (
        <span aria-hidden className="relative z-10 h-1.5 w-1.5 rounded-full bg-destructive" />
      )}
    </TabsPrimitive.Trigger>
  );
}
