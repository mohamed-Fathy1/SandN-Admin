import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw, ShieldAlert, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  AdminTable,
  Button,
  Card,
  EmptyState,
  Eyebrow,
  GenericBadge,
  PageTransition,
  QueryErrorState,
  Skeleton,
  TableSkeleton,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { useBackupHistory } from '@/features/maintenance/hooks/use-backups';
import {
  buildBackupRows,
  countMissingDays,
  type BackupRow,
} from '@/features/maintenance/lib/backup-rows';
import { formatCalendarDay, formatDateTime, formatRelativeTime } from '@/shared/utils/format';
import type { BackupSummary } from '@/shared/types/api';
import { cn } from '@/shared/utils/cn';

// Developer-team support contact. Displayed as a local Egyptian number, linked
// in international wa.me format (drop the leading 0, prefix country code 20).
const WHATSAPP_NUMBER = '01025502697';
const WHATSAPP_URL = 'https://wa.me/201025502697';

/** WhatsApp brand glyph — lucide-react ships no brand icons, so inline the SVG. */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.477-.755zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export function BackupsPage() {
  const { t } = useTranslation('maintenance');
  const query = useBackupHistory();

  const rows = useMemo(() => buildBackupRows(query.data?.backups ?? []), [query.data]);
  const missingCount = useMemo(() => countMissingDays(rows), [rows]);

  const columns = useMemo<ColumnDef<BackupRow>[]>(
    () => [
      {
        id: 'date',
        header: t('table.date'),
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          if (r.kind === 'missing') {
            return (
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="bg-status-cancelled-bg text-status-cancelled inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                >
                  <AlertTriangle size={14} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="text-status-cancelled m-0 font-medium">
                    {formatCalendarDay(r.utcDay)}
                  </p>
                  <p className="text-status-cancelled/80 m-0 text-xs">{t('table.missing')}</p>
                </div>
              </div>
            );
          }
          return (
            <div className="min-w-0">
              <p className="text-foreground m-0 font-medium">
                {formatDateTime(r.backup.createdAt)}
              </p>
              <p className="text-muted-foreground m-0 text-xs">
                {formatRelativeTime(r.backup.createdAt)}
              </p>
            </div>
          );
        },
      },
      {
        id: 'size',
        header: t('table.size'),
        enableSorting: false,
        meta: { numeric: true },
        cell: ({ row }) =>
          row.original.kind === 'backup' ? (
            <span className="font-tabular text-foreground">{row.original.backup.size}</span>
          ) : (
            <span className="text-light-foreground">—</span>
          ),
      },
      {
        id: 'file',
        header: t('table.file'),
        enableSorting: false,
        cell: ({ row }) =>
          row.original.kind === 'backup' ? (
            <code dir="ltr" className="text-muted-foreground font-mono text-xs">
              {row.original.backup.fileName}
            </code>
          ) : (
            <span className="text-light-foreground">—</span>
          ),
      },
    ],
    [t]
  );

  const mobileRow = (r: BackupRow) => {
    if (r.kind === 'missing') {
      return (
        <div className="border-status-cancelled/30 bg-status-cancelled-bg/50 flex items-center gap-3 rounded-xl border p-3">
          <span
            aria-hidden
            className="bg-status-cancelled-bg text-status-cancelled inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          >
            <AlertTriangle size={15} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-status-cancelled m-0 font-medium">{formatCalendarDay(r.utcDay)}</p>
            <p className="text-status-cancelled/80 m-0 text-xs">{t('table.missing')}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="border-border bg-card rounded-xl border p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-foreground m-0 font-medium">{formatDateTime(r.backup.createdAt)}</p>
          <span className="font-tabular text-foreground shrink-0 text-sm">{r.backup.size}</span>
        </div>
        <p className="text-muted-foreground m-0 mt-0.5 text-xs">
          {formatRelativeTime(r.backup.createdAt)}
        </p>
        <code dir="ltr" className="text-light-foreground mt-1 block truncate font-mono text-[11px]">
          {r.backup.fileName}
        </code>
      </div>
    );
  };

  return (
    <PageTransition>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => query.refetch()}
            isLoading={query.isFetching}
            loadingText={t('refreshing')}
          >
            <RefreshCw size={14} strokeWidth={1.75} aria-hidden />
            {t('refresh')}
          </Button>
        }
      />

      <SupportContact />

      {query.isPending ? (
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <TableSkeleton rows={6} columns={3} />
        </div>
      ) : query.isError ? (
        <QueryErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data.summary.total === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title={t('empty.title')}
          description={t('empty.description')}
        />
      ) : (
        <div className="space-y-6">
          <HealthBanner summary={query.data.summary} missingCount={missingCount} />

          <section>
            <div className="mb-3 flex items-end justify-between gap-2">
              <div>
                <h2 className="text-foreground m-0 text-base font-semibold">{t('table.title')}</h2>
                <Eyebrow as="p" className="mt-0.5">
                  {t('table.subtitle')}
                </Eyebrow>
              </div>
            </div>
            <AdminTable
              data={rows}
              columns={columns}
              getRowId={(r) => r.id}
              enableSorting={false}
              mobileRender={mobileRow}
              density="compact"
            />
          </section>
        </div>
      )}
    </PageTransition>
  );
}

function SupportContact() {
  const { t } = useTranslation('maintenance');
  return (
    <div className="border-border bg-card shadow-card mb-6 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground m-0 text-sm">{t('contact.help')}</p>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('contact.aria')}
        className="focus-visible:ring-offset-background inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[opacity,transform] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:outline-none motion-safe:active:scale-[0.98] sm:self-auto"
      >
        <WhatsAppIcon className="h-4 w-4" />
        <span dir="ltr" className="font-tabular tracking-wide">
          {WHATSAPP_NUMBER}
        </span>
      </a>
    </div>
  );
}

function HealthBanner({ summary, missingCount }: { summary: BackupSummary; missingCount: number }) {
  const { t } = useTranslation('maintenance');
  const overdue =
    !summary.healthy || summary.hoursSinceLatest == null || summary.hoursSinceLatest > 26;
  const Icon: LucideIcon = overdue ? ShieldAlert : ShieldCheck;

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex">
        <div
          aria-hidden
          className={cn('w-1.5 shrink-0', overdue ? 'bg-status-cancelled' : 'bg-status-delivered')}
        />
        <div className="flex flex-1 flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className={cn(
                'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
                overdue
                  ? 'bg-status-cancelled-bg text-status-cancelled'
                  : 'bg-status-delivered-bg text-status-delivered'
              )}
            >
              <Icon size={22} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  className={cn(
                    'm-0 text-base font-semibold',
                    overdue ? 'text-status-cancelled' : 'text-foreground'
                  )}
                >
                  {overdue ? t('badge.overdue') : t('badge.healthy')}
                </h2>
                {missingCount > 0 ? (
                  <GenericBadge
                    tone="destructive"
                    size="sm"
                    icon={AlertTriangle}
                    label={t('badge.gaps', { count: missingCount })}
                  />
                ) : null}
              </div>
              <p className="text-muted-foreground m-0 mt-1 text-sm">
                {t('summary.lastBackup', { relative: formatRelativeTime(summary.latestAt) })}
                {' · '}
                {summary.latestSize ?? '—'}
                {' · '}
                {t('summary.kept', { count: summary.total })}
              </p>
              <p className="font-tabular text-light-foreground m-0 mt-1 text-xs" dir="ltr">
                {summary.bucket} · {summary.region}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
