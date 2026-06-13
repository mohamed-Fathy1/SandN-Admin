import { lazy, Suspense, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Home,
  PieChart as PieChartIcon,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  Card,
  EmptyState,
  Eyebrow,
  FadeUp,
  MetricValue,
  PageTransition,
  QueryErrorState,
  Skeleton,
  Thumbnail,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { useAnalytics, useAnalyticsOverview } from '@/features/analytics/hooks/use-analytics';
import { expandRangeToMinDays } from '@/features/analytics/lib/range';
import { useProduct } from '@/features/products/hooks/use-products';
import { STOREFRONT_URL } from '@/config/constants';
import { toLocalized } from '@/shared/utils/bilingual';
import { formatDuration, formatNumber } from '@/shared/utils/format';
import type {
  AnalyticsOverviewRow,
  AnalyticsParams,
  AnalyticsTopPage,
} from '@/shared/types/api';
import { AnalyticsRangeControls } from './analytics-range-controls';
import type { TrendMetric } from './analytics-trend-chart';
import { TRAFFIC_SOURCE_COLORS } from './palette';

const AnalyticsTrendChart = lazy(() => import('./analytics-trend-chart'));
const TrafficSourcesChart = lazy(() => import('./traffic-sources-chart'));

interface AnalyticsPageProps {
  range: AnalyticsParams;
  onRangeChange: (range: AnalyticsParams) => void;
}

const TREND_METRICS: TrendMetric[] = ['activeUsers', 'sessions', 'screenPageViews', 'newUsers'];

export function AnalyticsPage({ range, onRangeChange }: AnalyticsPageProps) {
  const { t } = useTranslation('analytics');
  const { overview, topPages, trafficSources } = useAnalytics(range);
  const [metric, setMetric] = useState<TrendMetric>('activeUsers');

  // The trend always spans ≥7 days so it never collapses to a single bar, even
  // when the cards are scoped to "today". Same query when the range is already
  // wide enough (React Query dedupes by key).
  const trendRange = useMemo(() => expandRangeToMinDays(range), [range]);
  const trendQuery = useAnalyticsOverview(trendRange);
  const trendExpanded = trendRange.startDate !== range.startDate;

  const isFetching =
    overview.isFetching ||
    topPages.isFetching ||
    trafficSources.isFetching ||
    trendQuery.isFetching;
  const refreshAll = () => {
    void overview.refetch();
    void topPages.refetch();
    void trafficSources.refetch();
    void trendQuery.refetch();
  };

  const totals = useMemo(() => {
    const rows = overview.data ?? [];
    const sum = (key: keyof AnalyticsOverviewRow) =>
      rows.reduce((acc, row) => acc + (Number(row[key]) || 0), 0);
    const avgDuration = rows.length
      ? rows.reduce((acc, row) => acc + row.averageSessionDuration, 0) / rows.length
      : 0;
    return {
      activeUsers: sum('activeUsers'),
      sessions: sum('sessions'),
      screenPageViews: sum('screenPageViews'),
      newUsers: sum('newUsers'),
      avgDuration,
    };
  }, [overview.data]);

  return (
    <PageTransition>
      <PageHeader
        eyebrow={t('header.eyebrow')}
        title={t('header.title')}
        subtitle={t('header.subtitle')}
      />

      <AnalyticsRangeControls
        range={range}
        onChange={onRangeChange}
        onRefresh={refreshAll}
        isFetching={isFetching}
      />

      {/* Summary cards — totals across the range (avg for session duration). */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FadeUp delay={0} className="h-full">
          <KpiCard
            label={t('kpi.activeUsers')}
            icon={Users}
            isPending={overview.isPending}
            isError={overview.isError}
            value={formatNumber(totals.activeUsers)}
            helper={t('kpi.newUsers', { count: totals.newUsers })}
          />
        </FadeUp>
        <FadeUp delay={0.06} className="h-full">
          <KpiCard
            label={t('kpi.sessions')}
            icon={BarChart3}
            isPending={overview.isPending}
            isError={overview.isError}
            value={formatNumber(totals.sessions)}
          />
        </FadeUp>
        <FadeUp delay={0.12} className="h-full">
          <KpiCard
            label={t('kpi.pageViews')}
            icon={Eye}
            isPending={overview.isPending}
            isError={overview.isError}
            value={formatNumber(totals.screenPageViews)}
          />
        </FadeUp>
        <FadeUp delay={0.18} className="h-full">
          <KpiCard
            label={t('kpi.avgSession')}
            icon={Clock}
            isPending={overview.isPending}
            isError={overview.isError}
            value={formatDuration(totals.avgDuration)}
            helper={t('kpi.avgSessionHelper')}
          />
        </FadeUp>
      </div>

      {/* Trend chart */}
      <div className="mt-8">
        <FadeUp delay={0.22}>
          <TrendCard
            query={trendQuery}
            metric={metric}
            onMetricChange={setMetric}
            metricLabel={t(`kpi.${metric}` as const)}
            expanded={trendExpanded}
          />
        </FadeUp>
      </div>

      {/* Top pages + traffic sources */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FadeUp delay={0.26}>
          <TopPagesCard query={topPages} />
        </FadeUp>
        <FadeUp delay={0.3}>
          <TrafficSourcesCard query={trafficSources} />
        </FadeUp>
      </div>
    </PageTransition>
  );
}

// ──────────────────────────────── KPI card ────────────────────────────────

interface KpiCardProps {
  label: string;
  icon: LucideIcon;
  isPending: boolean;
  isError: boolean;
  value: string;
  helper?: string;
}

function KpiCard({ label, icon: Icon, isPending, isError, value, helper }: KpiCardProps) {
  return (
    <Card padding="none" className="h-full overflow-hidden">
      <div className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <Eyebrow>{label}</Eyebrow>
          <span
            aria-hidden
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
          >
            <Icon size={15} strokeWidth={1.75} />
          </span>
        </div>
        <div className="mt-3 flex-1">
          {isPending ? (
            <Skeleton className="h-9 w-24" />
          ) : (
            <MetricValue size="lg" delta={null}>
              {isError ? '—' : value}
            </MetricValue>
          )}
          {helper && !isPending && !isError ? (
            <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────── Trend card ───────────────────────────────

interface TrendCardProps {
  query: ReturnType<typeof useAnalytics>['overview'];
  metric: TrendMetric;
  onMetricChange: (metric: TrendMetric) => void;
  metricLabel: string;
  /** True when the trend window was widened past the selected range. */
  expanded: boolean;
}

function TrendCard({ query, metric, onMetricChange, metricLabel, expanded }: TrendCardProps) {
  const { t } = useTranslation('analytics');
  const data = query.data ?? [];
  const empty = !query.isPending && !query.isError && data.length === 0;

  return (
    <Card padding="none">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="m-0 text-base font-semibold text-foreground">{t('trend.title')}</h2>
          <Eyebrow as="p" className="mt-0.5">
            {expanded ? t('trend.subtitleRecent', { count: data.length }) : t('trend.subtitle')}
          </Eyebrow>
        </div>
        <div
          role="tablist"
          aria-label={t('trend.metric')}
          className="-mx-1 flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TREND_METRICS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={metric === key}
              onClick={() => onMetricChange(key)}
              className={
                metric === key
                  ? 'inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full bg-accent px-3.5 text-xs font-medium text-accent-foreground'
                  : 'inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent-soft hover:text-accent'
              }
            >
              {t(`kpi.${key}`)}
            </button>
          ))}
        </div>
      </div>
      <div className="px-2 py-4 sm:px-4">
        {query.isPending ? (
          <Skeleton className="h-64 w-full" />
        ) : query.isError ? (
          <div className="px-4 py-6">
            <QueryErrorState error={query.error} onRetry={() => query.refetch()} />
          </div>
        ) : empty ? (
          <EmptyState title={t('empty.title')} description={t('empty.description')} />
        ) : (
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <AnalyticsTrendChart data={data} metric={metric} metricLabel={metricLabel} />
          </Suspense>
        )}
      </div>
    </Card>
  );
}

// ─────────────────────────────── Top pages ────────────────────────────────

/** Join the storefront origin with a GA page path without a doubled `//`. */
function storefrontUrl(pagePath: string): string {
  const base = STOREFRONT_URL.replace(/\/+$/, '');
  const path = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
  return `${base}${path}`;
}

type PageKind = 'home' | 'product' | 'other';

/** Classify a GA page path so the admin sees a meaningful label, not a raw URL. */
function parsePagePath(pagePath: string): { kind: PageKind; productId?: string } {
  const path = pagePath.split(/[?#]/)[0];
  if (path === '/' || path === '') return { kind: 'home' };
  const product = path.match(/^\/products\/([^/]+)/);
  if (product) return { kind: 'product', productId: product[1] };
  return { kind: 'other' };
}

function TopPagesCard({ query }: { query: ReturnType<typeof useAnalytics>['topPages'] }) {
  const { t } = useTranslation('analytics');
  const data = query.data ?? [];

  return (
    <Card padding="none">
      <CardHeader title={t('topPages.title')} subtitle={t('topPages.subtitle')} icon={Eye} />
      {query.isPending ? (
        <ul className="space-y-2 px-4 py-4 sm:px-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="h-12 w-full" />
            </li>
          ))}
        </ul>
      ) : query.isError ? (
        <div className="px-6 py-4">
          <QueryErrorState error={query.error} onRetry={() => query.refetch()} />
        </div>
      ) : data.length === 0 ? (
        <div className="px-6 py-6">
          <EmptyState title={t('empty.title')} description={t('empty.description')} />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {data.map((page, idx) => (
            <TopPageRow key={page.pagePath} page={page} rank={idx + 1} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function TopPageRow({ page, rank }: { page: AnalyticsTopPage; rank: number }) {
  const { t } = useTranslation('analytics');
  const parsed = parsePagePath(page.pagePath);
  const productQuery = useProduct(parsed.kind === 'product' ? parsed.productId : undefined);
  const product = productQuery.data;

  const kindLabel = t(`topPages.kinds.${parsed.kind}`);
  const Icon = parsed.kind === 'home' ? Home : FileText;

  // Resolve a human-readable title per page kind.
  let title: string;
  let loading = false;
  if (parsed.kind === 'home') {
    title = t('topPages.home');
  } else if (parsed.kind === 'product') {
    if (product) title = toLocalized(product.name) || t('topPages.unknownProduct');
    else if (productQuery.isError) title = t('topPages.unknownProduct');
    else {
      title = t('topPages.unknownProduct');
      loading = true;
    }
  } else {
    title = page.pagePath;
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-6">
      <span
        aria-hidden
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent"
      >
        {rank}
      </span>

      {parsed.kind === 'product' ? (
        <Thumbnail src={product?.defaultImage?.mediaUrl} size="sm" />
      ) : (
        <span
          aria-hidden
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
        >
          <Icon size={16} strokeWidth={1.75} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        {loading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <a
            href={storefrontUrl(page.pagePath)}
            target="_blank"
            rel="noopener noreferrer"
            title={page.pagePath}
            className="group inline-flex max-w-full items-center gap-1 text-sm font-medium text-foreground hover:text-accent"
          >
            <span className="truncate">{title}</span>
            <ExternalLink
              size={12}
              strokeWidth={1.75}
              aria-hidden
              className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            />
          </a>
        )}
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{kindLabel}</p>
      </div>

      <div className="shrink-0 text-end">
        <div className="text-base font-semibold leading-none tabular-nums text-foreground">
          {formatNumber(page.screenPageViews)}
        </div>
        <div className="mt-1 text-[11px] leading-none text-muted-foreground">
          {t('topPages.viewsLabel', { count: page.screenPageViews })}
        </div>
      </div>
    </li>
  );
}

// ───────────────────────────── Traffic sources ────────────────────────────

function TrafficSourcesCard({
  query,
}: {
  query: ReturnType<typeof useAnalytics>['trafficSources'];
}) {
  const { t } = useTranslation('analytics');
  const rows = query.data ?? [];

  const total = rows.reduce((sum, r) => sum + r.sessions, 0);
  // Localize GA's special buckets ("(direct)", "(not set)", …); real sources
  // (google, instagram) fall through to their raw name.
  const prepared = rows.map((r) => ({
    source: r.source,
    sessions: r.sessions,
    label: t(`sources.buckets.${r.source}`, { defaultValue: r.source }),
  }));

  return (
    <Card padding="none">
      <CardHeader
        title={t('sources.title')}
        subtitle={t('sources.subtitle')}
        icon={PieChartIcon}
      />
      <div className="px-4 py-4 sm:px-6">
        {query.isPending ? (
          <Skeleton className="h-56 w-full" />
        ) : query.isError ? (
          <QueryErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : prepared.length === 0 ? (
          <EmptyState title={t('empty.title')} description={t('empty.description')} />
        ) : (
          <div className="grid items-center gap-5 sm:grid-cols-2">
            <div className="relative mx-auto h-[220px] w-full max-w-[260px]">
              <Suspense fallback={<Skeleton className="h-full w-full" />}>
                <TrafficSourcesChart data={prepared} />
              </Suspense>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold tabular-nums text-foreground">
                  {formatNumber(total)}
                </span>
                <span className="text-eyebrow text-muted-foreground">
                  {t('sources.totalLabel')}
                </span>
              </div>
            </div>
            <ul className="space-y-2.5">
              {prepared.map((r, idx) => {
                const pct = total ? Math.round((r.sessions / total) * 100) : 0;
                return (
                  <li key={r.source} className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background: TRAFFIC_SOURCE_COLORS[idx % TRAFFIC_SOURCE_COLORS.length],
                      }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {r.label}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatNumber(r.sessions)} · {pct}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

function CardHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-4 sm:px-6">
      <div>
        <h2 className="m-0 flex items-center gap-2 text-base font-semibold text-foreground">
          <Icon size={14} strokeWidth={1.75} aria-hidden className="text-accent" />
          {title}
        </h2>
        <Eyebrow as="p" className="mt-0.5">
          {subtitle}
        </Eyebrow>
      </div>
    </div>
  );
}
