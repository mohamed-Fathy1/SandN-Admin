import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Bot,
  Bug,
  Clock,
  Fingerprint,
  Flame,
  Gauge as GaugeIcon,
  Info,
  MousePointerClick,
  MoveVertical,
  RefreshCw,
  ScrollText,
  Undo2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  Button,
  Card,
  EmptyState,
  Eyebrow,
  FadeUp,
  FloatingOrb,
  MetricValue,
  QueryErrorState,
  Skeleton,
} from '@/designs/shared';
import { ApiError } from '@/shared/lib/axios';
import { accentAlpha } from '@/designs/layout/tokens';
import { useClarityInsights } from '@/features/analytics/hooks/use-clarity';
import {
  CLARITY_BEHAVIOUR_METRICS,
  CLARITY_DIMENSIONS,
  getBreakdownRows,
  getMetricValue,
  getTrafficTotals,
  isClarityEmpty,
  type ClarityBehaviourMetric,
} from '@/features/analytics/lib/clarity';
import {
  formatDateTime,
  formatDuration,
  formatNumber,
  formatRelativeTime,
} from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import type { ClarityDimension, ClarityInsights } from '@/shared/types/api';

interface ClarityPanelProps {
  dimension: ClarityDimension;
  onDimensionChange: (dimension: ClarityDimension) => void;
}

const BEHAVIOUR_ICONS: Record<ClarityBehaviourMetric, LucideIcon> = {
  DeadClickCount: MousePointerClick,
  RageClickCount: Flame,
  QuickbackClick: Undo2,
  ExcessiveScroll: MoveVertical,
  ScriptErrorCount: Bug,
  ErrorClickCount: AlertTriangle,
};

/** `12.5%` / `—`, locale-aware digits. */
function formatPercent(value: number | null): string {
  if (value == null) return '—';
  const rounded = Math.round(value * 10) / 10;
  return `${formatNumber(rounded)}%`;
}

// Friction severity — a nonzero share of affected sessions is a concern; the
// meter fill escalates accent → warning → danger. Colour is a *supplement* here:
// every meter also carries an icon, a label and the numeric percentage.
type Severity = 'none' | 'low' | 'medium' | 'high';
function frictionSeverity(pct: number | null): Severity {
  if (pct == null || pct <= 0) return 'none';
  if (pct >= 5) return 'high';
  if (pct >= 2) return 'medium';
  return 'low';
}
const SEVERITY_FILL: Record<Severity, string> = {
  none: 'bg-border-strong',
  low: 'bg-accent',
  medium: 'bg-warning',
  high: 'bg-destructive',
};

export function ClarityPanel({ dimension, onDimensionChange }: ClarityPanelProps) {
  const { t } = useTranslation('analytics');
  const { query, refresh } = useClarityInsights(dimension);
  const data = query.data;

  const status = query.error instanceof ApiError ? query.error.statusCode : undefined;
  const remaining = data?.remainingLiveCalls ?? 0;
  const refreshDisabled = query.isPending || refresh.isPending || remaining <= 0;
  // Holds the previous render (dimmed) while a dimension switch is in flight.
  const isSwitching = query.isFetching && query.isPlaceholderData;

  return (
    <div className="space-y-6">
      <FreshnessStrip
        isPending={query.isPending}
        data={data}
        remaining={remaining}
        refreshing={refresh.isPending}
        refreshDisabled={refreshDisabled}
        onRefresh={() => refresh.mutate()}
      />

      {data?.stale ? <StaleBanner note={data.note} fetchedAt={data.fetchedAt} /> : null}

      {query.isPending ? (
        <ClaritySkeleton />
      ) : status === 429 ? (
        <RateLimitedState
          message={query.error instanceof ApiError ? query.error.message : undefined}
          onRetry={() => query.refetch()}
        />
      ) : query.isError ? (
        <QueryErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !data ? (
        <EmptyState title={t('clarity.empty.title')} description={t('clarity.empty.description')} />
      ) : (
        <ClarityContent
          data={data}
          dimension={dimension}
          onDimensionChange={onDimensionChange}
          dimming={isSwitching}
          empty={isClarityEmpty(data)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────── Content ──────────────────────────────────

function ClarityContent({
  data,
  dimension,
  onDimensionChange,
  dimming,
  empty,
}: {
  data: ClarityInsights;
  dimension: ClarityDimension;
  onDimensionChange: (dimension: ClarityDimension) => void;
  dimming: boolean;
  empty: boolean;
}) {
  const traffic = getTrafficTotals(data);
  const avgScroll = getMetricValue(data, 'ScrollDepth', 'averageScrollDepth');
  const activeTime = getMetricValue(data, 'EngagementTime', 'activeTime');
  const totalTime = getMetricValue(data, 'EngagementTime', 'totalTime');

  return (
    <div className="space-y-8">
      {/* Low-traffic notice — the full structure still renders (with zeros/—),
          so the page reads as "working, awaiting data" not "broken/blank". */}
      {empty ? <LowDataBanner /> : null}

      {/* Headline bento — one dominant hero + a 2×2 of supporting metrics. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        <FadeUp delay={0} className="h-full sm:col-span-2 lg:col-span-2 lg:row-span-2">
          <HeroTile traffic={traffic} />
        </FadeUp>
        <FadeUp delay={0.06} className="h-full">
          <NumberTile
            label="clarity.kpi.distinctUsersLabel"
            icon={Fingerprint}
            value={formatNumber(traffic.users)}
          />
        </FadeUp>
        <FadeUp delay={0.12} className="h-full">
          <GaugeTile
            label="clarity.kpi.botSessions"
            icon={Bot}
            value={traffic.botPercent}
            helperKey="clarity.kpi.botCount"
            helperCount={traffic.bots}
            tone={traffic.botPercent != null && traffic.botPercent >= 30 ? 'warning' : 'accent'}
          />
        </FadeUp>
        <FadeUp delay={0.18} className="h-full">
          <GaugeTile label="clarity.kpi.avgScroll" icon={ScrollText} value={avgScroll} />
        </FadeUp>
        <FadeUp delay={0.24} className="h-full">
          <NumberTile
            label="clarity.kpi.engagement"
            icon={Clock}
            value={activeTime != null ? formatDuration(activeTime) : '—'}
            helper={
              totalTime != null
                ? { key: 'clarity.kpi.engagementHelper', opts: { total: formatDuration(totalTime) } }
                : undefined
            }
          />
        </FadeUp>
      </div>

      {/* Session quality — six friction meters in one cohesive panel. */}
      <FadeUp delay={0.28}>
        <SessionQualityCard data={data} />
      </FadeUp>

      {/* Breakdown — chip selector (no dropdown) scoping a bar list. */}
      <FadeUp delay={0.32}>
        <BreakdownSection
          data={data}
          dimension={dimension}
          onDimensionChange={onDimensionChange}
          dimming={dimming}
        />
      </FadeUp>
    </div>
  );
}

// ─────────────────────────── Freshness strip ──────────────────────────────

function FreshnessStrip({
  isPending,
  data,
  remaining,
  refreshing,
  refreshDisabled,
  onRefresh,
}: {
  isPending: boolean;
  data: ClarityInsights | undefined;
  remaining: number;
  refreshing: boolean;
  refreshDisabled: boolean;
  onRefresh: () => void;
}) {
  const { t } = useTranslation('analytics');
  const dotClass = data?.stale
    ? 'bg-warning'
    : data?.fromCache
      ? 'bg-muted-foreground/50'
      : 'bg-success';

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <span className={cn('h-2 w-2 shrink-0 rounded-full', dotClass)} aria-hidden />
        <span className="text-eyebrow text-foreground">{t('clarity.window')}</span>
        {isPending ? (
          <Skeleton className="h-4 w-32" />
        ) : data ? (
          <span title={formatDateTime(data.fetchedAt)}>
            <span className="mx-1 text-border-strong" aria-hidden>
              ·
            </span>
            {t('clarity.lastUpdated', { time: formatRelativeTime(data.fetchedAt) })}
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="text-xs tabular-nums text-muted-foreground">
          {t('clarity.callsRemaining', { count: remaining })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          isLoading={refreshing}
          disabled={refreshDisabled}
          title={remaining <= 0 ? t('clarity.refreshExhausted') : undefined}
          className="shrink-0"
        >
          <RefreshCw size={14} strokeWidth={1.75} aria-hidden />
          {t('clarity.refresh')}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────── Hero tile ─────────────────────────────────

function HeroTile({ traffic }: { traffic: ReturnType<typeof getTrafficTotals> }) {
  const { t } = useTranslation('analytics');
  return (
    <Card padding="none" className="relative h-full overflow-hidden">
      <FloatingOrb
        size={200}
        color={accentAlpha(0.14)}
        top="-70px"
        right="-40px"
        delay={0}
        opacity={0.7}
      />
      <div className="relative flex h-full flex-col justify-between gap-6 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Eyebrow>{t('clarity.kpi.sessions')}</Eyebrow>
            {/* Hero figure: proportional (not tabular) sans, per dataviz spec. */}
            <div className="mt-3 text-[2.75rem] font-semibold leading-none tracking-tight text-foreground">
              {formatNumber(traffic.sessions)}
            </div>
            {traffic.pagesPerSession != null ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {t('clarity.kpi.pagesPerSession', {
                  value: formatNumber(traffic.pagesPerSession),
                })}
              </p>
            ) : null}
          </div>
          <span
            aria-hidden
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"
          >
            <Users size={18} strokeWidth={1.75} />
          </span>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────── Stat tiles ────────────────────────────────

function TileShell({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  const { t } = useTranslation('analytics');
  return (
    <Card padding="none" className="h-full overflow-hidden">
      <div className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <Eyebrow>{t(label)}</Eyebrow>
          <span
            aria-hidden
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
          >
            <Icon size={15} strokeWidth={1.75} />
          </span>
        </div>
        {children}
      </div>
    </Card>
  );
}

function NumberTile({
  label,
  icon,
  value,
  helper,
}: {
  label: string;
  icon: LucideIcon;
  value: string;
  helper?: { key: string; opts?: Record<string, unknown> };
}) {
  const { t } = useTranslation('analytics');
  return (
    <TileShell label={label} icon={icon}>
      <div className="mt-3 flex-1">
        <MetricValue size="lg" delta={null}>
          {value}
        </MetricValue>
        {helper ? (
          <p className="mt-2 text-xs text-muted-foreground">{t(helper.key, helper.opts)}</p>
        ) : null}
      </div>
    </TileShell>
  );
}

function GaugeTile({
  label,
  icon,
  value,
  helperKey,
  helperCount,
  tone = 'accent',
}: {
  label: string;
  icon: LucideIcon;
  value: number | null;
  helperKey?: string;
  helperCount?: number | null;
  tone?: 'accent' | 'warning';
}) {
  const { t } = useTranslation('analytics');
  return (
    <TileShell label={label} icon={icon}>
      <div className="mt-2 flex flex-1 items-center gap-4">
        <Gauge value={value} tone={tone} />
        {helperKey && helperCount != null ? (
          <p className="text-xs leading-snug text-muted-foreground">
            {t(helperKey, { count: helperCount })}
          </p>
        ) : null}
      </div>
    </TileShell>
  );
}

/** A small radial gauge; the value sits upright in the centre. */
function Gauge({ value, tone = 'accent' }: { value: number | null; tone?: 'accent' | 'warning' }) {
  const size = 76;
  const stroke = 8;
  const pct = value == null ? 0 : Math.min(100, Math.max(0, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="[stroke:var(--color-border-medium)]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={value == null ? c : offset}
          className={cn(
            'transition-[stroke-dashoffset] duration-700',
            tone === 'warning' ? 'text-warning' : 'text-accent'
          )}
        />
      </svg>
      <span className="absolute text-sm font-semibold tabular-nums text-foreground">
        {formatPercent(value)}
      </span>
    </div>
  );
}

// ───────────────────────────── Session quality ─────────────────────────────

function SessionQualityCard({ data }: { data: ClarityInsights }) {
  const { t } = useTranslation('analytics');

  const metrics = CLARITY_BEHAVIOUR_METRICS.map((name) => ({
    name,
    percent: getMetricValue(data, name, 'sessionsWithMetricPercentage'),
    sessions: getMetricValue(data, name, 'sessionsCount'),
  }));

  // Headline the worst friction signal so the section leads with a takeaway.
  const worst = metrics.reduce<(typeof metrics)[number] | null>((acc, m) => {
    if (m.percent == null) return acc;
    if (!acc || (acc.percent ?? 0) < m.percent) return m;
    return acc;
  }, null);

  return (
    <Card padding="none">
      <div className="flex flex-col gap-2 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="m-0 flex items-center gap-2 text-base font-semibold text-foreground">
            <GaugeIcon size={15} strokeWidth={1.75} aria-hidden className="text-accent" />
            {t('clarity.behaviour.title')}
          </h2>
          <Eyebrow as="p" className="mt-0.5">
            {t('clarity.behaviour.subtitle')}
          </Eyebrow>
        </div>
        {worst && worst.percent != null && worst.percent > 0 ? (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent sm:self-auto">
            {t('clarity.behaviour.worst', {
              metric: t(`clarity.behaviour.metrics.${worst.name}.label`),
              percent: formatPercent(worst.percent),
            })}
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-5 sm:px-6 md:grid-cols-2">
        {metrics.map((m) => (
          <FrictionMeter key={m.name} name={m.name} percent={m.percent} sessions={m.sessions} />
        ))}
      </div>
    </Card>
  );
}

function FrictionMeter({
  name,
  percent,
  sessions,
}: {
  name: ClarityBehaviourMetric;
  percent: number | null;
  sessions: number | null;
}) {
  const { t } = useTranslation('analytics');
  const Icon = BEHAVIOUR_ICONS[name];
  const severity = frictionSeverity(percent);
  const width = percent == null ? 0 : Math.min(100, Math.max(0, percent));
  const label = t(`clarity.behaviour.metrics.${name}.label`);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
          >
            <Icon size={14} strokeWidth={1.75} />
          </span>
          <span className="truncate text-sm font-medium text-foreground" title={label}>
            {label}
          </span>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
          {formatPercent(percent)}
        </span>
      </div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percent ?? undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', SEVERITY_FILL[severity])}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {t(`clarity.behaviour.metrics.${name}.description`)}
        {sessions != null ? (
          <>
            {' · '}
            <span className="tabular-nums">
              {t('clarity.behaviour.sessionsAffected', { count: sessions })}
            </span>
          </>
        ) : null}
      </p>
    </div>
  );
}

// ─────────────────────────────── Breakdown ─────────────────────────────────

function BreakdownSection({
  data,
  dimension,
  onDimensionChange,
  dimming,
}: {
  data: ClarityInsights;
  dimension: ClarityDimension;
  onDimensionChange: (dimension: ClarityDimension) => void;
  dimming: boolean;
}) {
  const { t } = useTranslation('analytics');
  const rows = getBreakdownRows(data);
  const max = rows.reduce((m, r) => Math.max(m, r.sessions), 0);
  const total = rows.reduce((sum, r) => sum + r.sessions, 0);

  return (
    <section className="space-y-3">
      {/* Chip filter row — scopes only the breakdown card below it. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="m-0 text-base font-semibold text-foreground">
          {t('clarity.breakdown.heading')}
        </h2>
        <div
          role="group"
          aria-label={t('clarity.breakdown.pickLabel')}
          className="-mx-1 flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {CLARITY_DIMENSIONS.map((d) => {
            const active = d === dimension;
            return (
              <button
                key={d}
                type="button"
                aria-pressed={active}
                onClick={() => onDimensionChange(d)}
                className={cn(
                  'inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-xs font-medium transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent-soft hover:text-accent'
                )}
              >
                {t(`clarity.dimension.options.${d}`)}
              </button>
            );
          })}
        </div>
      </div>

      <Card padding="none">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-6">
          <Eyebrow as="p">
            {t('clarity.breakdown.subtitle', {
              dimension: t(`clarity.dimension.options.${dimension}`),
            })}
          </Eyebrow>
          {total > 0 ? (
            <span className="text-xs tabular-nums text-muted-foreground">
              {t('clarity.breakdown.sessionsTotal', { count: total })}
            </span>
          ) : null}
        </div>
        {rows.length === 0 ? (
          <div className="px-6 py-6">
            <EmptyState
              title={t('clarity.breakdown.empty.title')}
              description={t('clarity.breakdown.empty.description')}
            />
          </div>
        ) : (
          <ul
            className={cn(
              'divide-y divide-border transition-opacity duration-200',
              dimming && 'opacity-50'
            )}
          >
            {rows.map((row, idx) => {
              const width = max > 0 ? Math.max(3, (row.sessions / max) * 100) : 0;
              const share = total > 0 ? Math.round((row.sessions / total) * 100) : 0;
              return (
                <li
                  key={`${row.name}-${idx}`}
                  className="px-4 py-3.5 sm:px-6"
                  title={`${row.name} · ${formatNumber(row.sessions)}`}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent-soft text-[11px] font-semibold text-accent"
                      >
                        {idx + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {row.name}
                      </span>
                    </div>
                    <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                      {formatNumber(row.sessions)}
                      <span className="ms-1.5 text-xs text-light-foreground">{share}%</span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent transition-[width] duration-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </section>
  );
}

// ─────────────────────────────── Sub-states ────────────────────────────────

function LowDataBanner() {
  const { t } = useTranslation('analytics');
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-2xl border border-dashed border-border-medium bg-muted/40 px-4 py-3"
    >
      <Info size={16} strokeWidth={1.75} aria-hidden className="mt-0.5 shrink-0 text-accent" />
      <div>
        <p className="m-0 text-sm font-semibold text-foreground">{t('clarity.lowData.title')}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t('clarity.lowData.description')}</p>
      </div>
    </div>
  );
}

function StaleBanner({ note, fetchedAt }: { note: string | null; fetchedAt: string }) {
  const { t } = useTranslation('analytics');
  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-2.5">
        <Info size={16} strokeWidth={1.75} aria-hidden className="mt-0.5 shrink-0 text-warning" />
        <div>
          <span className="inline-flex items-center rounded-full bg-warning/20 px-2 py-0.5 text-[11px] font-semibold text-warning">
            {t('clarity.stale.badge')}
          </span>
          <p className="mt-1 text-xs text-muted-foreground">
            {note ?? t('clarity.stale.description')}
          </p>
        </div>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground" title={formatDateTime(fetchedAt)}>
        {t('clarity.lastUpdated', { time: formatRelativeTime(fetchedAt) })}
      </span>
    </div>
  );
}

function RateLimitedState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  const { t } = useTranslation('analytics');
  return (
    <EmptyState
      icon={Clock}
      title={t('clarity.error.rateLimit.title')}
      description={message ?? t('clarity.error.rateLimit.description')}
      action={
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw size={14} strokeWidth={1.75} aria-hidden />
          {t('clarity.error.rateLimit.retry')}
        </Button>
      }
    />
  );
}

function ClaritySkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        <Skeleton className="h-40 w-full sm:col-span-2 lg:col-span-2 lg:row-span-2" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[122px] w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
