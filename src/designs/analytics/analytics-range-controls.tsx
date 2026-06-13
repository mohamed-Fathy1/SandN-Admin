import { format, parse } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Card, DateInput } from '@/designs/shared';
import { cn } from '@/shared/utils/cn';
import {
  detectPreset,
  PRESET_KEYS,
  presetRange,
  todayIso,
  type PresetKey,
} from '@/features/analytics/lib/range';
import type { AnalyticsParams } from '@/shared/types/api';

interface AnalyticsRangeControlsProps {
  range: AnalyticsParams;
  onChange: (range: AnalyticsParams) => void;
  onRefresh: () => void;
  isFetching: boolean;
}

const YMD = 'yyyy-MM-dd';

function ymdToMs(ymd: string): number {
  if (!ymd) return 0;
  const parsed = parse(ymd, YMD, new Date(0));
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function msToYmd(ms: number): string {
  if (!ms) return '';
  return format(new Date(ms), YMD);
}

export function AnalyticsRangeControls({
  range,
  onChange,
  onRefresh,
  isFetching,
}: AnalyticsRangeControlsProps) {
  const { t } = useTranslation('analytics');
  const activePreset = detectPreset(range);
  const maxDay = todayIso();

  function selectPreset(key: PresetKey) {
    onChange(presetRange(key));
  }

  return (
    <Card padding="md" className="mb-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        {/* Quick presets */}
        <div>
          <p className="mb-2 text-eyebrow text-muted-foreground">{t('range.quickRanges')}</p>
          <div
            role="group"
            aria-label={t('range.quickRanges')}
            className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-border bg-card p-1"
          >
            {PRESET_KEYS.map((key) => {
              const isActive = activePreset === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => selectPreset(key)}
                  className={cn(
                    'inline-flex h-8 items-center rounded-full px-3.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t(`range.presets.${key}`)}
                </button>
              );
            })}
            {activePreset === null ? (
              <span className="inline-flex h-8 items-center rounded-full bg-accent-soft px-3.5 text-xs font-medium text-accent">
                {t('range.presets.custom')}
              </span>
            ) : null}
          </div>
        </div>

        {/* Custom range + refresh */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1">
            <label className="text-eyebrow text-muted-foreground" htmlFor="analytics-from">
              {t('range.from')}
            </label>
            <DateInput
              id="analytics-from"
              className="w-full sm:w-44"
              value={ymdToMs(range.startDate)}
              max={maxDay}
              onChange={(ms) => {
                const startDate = msToYmd(ms) || todayIso();
                onChange({ startDate, endDate: range.endDate });
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-eyebrow text-muted-foreground" htmlFor="analytics-to">
              {t('range.to')}
            </label>
            <DateInput
              id="analytics-to"
              className="w-full sm:w-44"
              value={ymdToMs(range.endDate)}
              min={range.startDate}
              max={maxDay}
              onChange={(ms) => {
                const endDate = msToYmd(ms) || todayIso();
                onChange({ startDate: range.startDate, endDate });
              }}
            />
          </div>
          <Button
            variant="ghost"
            size="md"
            onClick={onRefresh}
            isLoading={isFetching}
            className="shrink-0"
          >
            <RefreshCw size={14} strokeWidth={1.75} aria-hidden />
            {t('range.refresh')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
