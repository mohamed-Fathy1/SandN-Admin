import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from '@tanstack/react-table';
import { ChevronsUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCallback, useMemo, useRef, useState } from 'react';

const sortedRowModel = getSortedRowModel();
import { Checkbox } from './checkbox';
import { EmptyState } from './empty-state';
import { QueryErrorState } from './query-error-state';
import { TableSkeleton } from './skeletons';
import { PaginationControls } from './pagination-controls';
import { usePrefersReducedMotion } from './motion';
import { A } from '@/designs/layout/tokens';
import { cn } from '@/shared/utils/cn';

export interface AdminTableProps<T> {
  data: T[] | undefined;
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
  pagination?: { page: number; totalPages: number; onPageChange: (page: number) => void };
  rowSelection?: boolean;
  onRowSelectionChange?: (rows: T[]) => void;
  emptyState?: { title?: string; description?: string; action?: React.ReactNode };
  /** Filtered state: switches EmptyState to no-results variant + offers Clear CTA. */
  isFiltered?: boolean;
  onClearFilters?: () => void;
  onRowClick?: (row: T) => void;
  onRowHover?: (row: T) => void;
  getRowId: (row: T) => string;
  enableSorting?: boolean;
  /**
   * Render a sticky selection bar above the table when ≥1 row is selected.
   * Receives the selected rows + a callback that clears the selection.
   */
  bulkActions?: (selected: T[], clear: () => void) => React.ReactNode;
  /** Pin the first non-selection column on horizontal scroll. */
  stickyFirstCol?: boolean;
  /**
   * Render this in place of the table on screens below `md`. When provided,
   * the table only shows from `md` upwards. Loading / empty / error states
   * still go through the standard AdminTable layout.
   */
  mobileRender?: (row: T) => React.ReactNode;
  /** Row density. `regular` (default) uses py-4; `compact` uses py-2.5. */
  density?: 'regular' | 'compact';
  className?: string;
}

/**
 * Column meta extensions consumed by AdminTable. Set `numeric: true` on a
 * column def to right-align the header + cell and apply tabular-nums so
 * money/counts line up vertically across rows.
 */
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    numeric?: boolean;
  }
}

export function AdminTable<T>({
  data,
  columns,
  isLoading,
  isError,
  error,
  onRetry,
  pagination,
  rowSelection,
  onRowSelectionChange,
  emptyState,
  isFiltered,
  onClearFilters,
  onRowClick,
  onRowHover,
  getRowId,
  enableSorting = true,
  bulkActions,
  stickyFirstCol,
  mobileRender,
  density = 'regular',
  className,
}: AdminTableProps<T>) {
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const reduced = usePrefersReducedMotion();
  const hasAnimatedRef = useRef(false);

  const allColumns = useMemo<ColumnDef<T>[]>(() => {
    if (!rowSelection) return columns;
    const selectionCol: ColumnDef<T> = {
      id: '__select',
      size: 36,
      enableSorting: false,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          indeterminate={!table.getIsAllRowsSelected() && table.getIsSomeRowsSelected()}
          onCheckedChange={(checked) => table.toggleAllRowsSelected(Boolean(checked))}
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
    };
    return [selectionCol, ...columns];
  }, [columns, rowSelection]);

  const handleSelectionChange = useCallback(
    (updater: Updater<RowSelectionState>) => {
      setSelection((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (onRowSelectionChange) {
          const selected = (data ?? []).filter((row) => next[getRowId(row)]);
          onRowSelectionChange(selected);
        }
        return next;
      });
    },
    [data, getRowId, onRowSelectionChange]
  );

  const table = useReactTable({
    data: data ?? [],
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? sortedRowModel : undefined,
    getRowId,
    enableRowSelection: Boolean(rowSelection),
    enableSorting,
    state: { rowSelection: selection, sorting },
    onRowSelectionChange: handleSelectionChange,
    onSortingChange: setSorting,
  });

  if (isLoading) {
    return <TableSkeleton rows={pagination ? 10 : 6} columns={allColumns.length} />;
  }

  if (isError) {
    return <QueryErrorState error={error} onRetry={onRetry} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        variant={isFiltered ? 'no-results' : 'no-data'}
        title={emptyState?.title}
        description={emptyState?.description}
        action={emptyState?.action}
        onClearFilters={onClearFilters}
      />
    );
  }

  const selectedRows = (data ?? []).filter((row) => selection[getRowId(row)]);
  const selectedCount = selectedRows.length;
  const clearSelection = () => setSelection({});

  const shouldAnimateRows = !reduced && !hasAnimatedRef.current;
  if (data && data.length > 0) hasAnimatedRef.current = true;

  // First non-selection column id — used for sticky-col targeting.
  const firstDataColId = allColumns.find((c) => c.id !== '__select')?.id;
  const isStickyCol = (colId: string | undefined) =>
    Boolean(stickyFirstCol && colId && colId === firstDataColId);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-card shadow-card',
        className
      )}
    >
      {bulkActions && selectedCount > 0 ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-accent-soft/60 px-5 py-3"
          role="region"
          aria-label="Bulk actions"
        >
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-7 items-center rounded-full bg-accent px-3 text-xs font-semibold text-accent-foreground"
              aria-live="polite"
            >
              {selectedCount} selected
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-eyebrow text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">{bulkActions(selectedRows, clearSelection)}</div>
        </div>
      ) : null}
      {mobileRender ? (
        <ul className="grid gap-2 p-3 md:hidden" role="list">
          {table.getRowModel().rows.map((row) => (
            <li key={row.id}>{mobileRender(row.original)}</li>
          ))}
        </ul>
      ) : null}
      <div className={cn('overflow-x-auto', mobileRender && 'hidden md:block')}>
        <table
          className={cn(
            'w-full text-sm',
            stickyFirstCol && 'border-separate border-spacing-0'
          )}
        >
          <thead
            className="border-b border-border"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-blur)',
              WebkitBackdropFilter: 'var(--glass-blur)',
            }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();
                  const sticky = isStickyCol(header.column.id);
                  const numeric = header.column.columnDef.meta?.numeric;
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className={cn(
                        'sticky top-0 z-[1] px-6 text-eyebrow text-muted-foreground',
                        density === 'compact' ? 'py-2.5' : 'py-3.5',
                        numeric ? 'text-right' : 'text-left',
                        sticky &&
                          'md:sticky md:left-0 md:z-[2] md:bg-[color-mix(in_srgb,var(--card)_92%,transparent)] md:shadow-[1px_0_0_0_var(--border)]'
                      )}
                      style={{ width: header.getSize() === 0 ? undefined : header.getSize() }}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded transition-colors',
                            numeric ? 'text-right' : 'text-left',
                            'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            sortDir && 'text-accent'
                          )}
                          aria-sort={
                            sortDir === 'asc'
                              ? 'ascending'
                              : sortDir === 'desc'
                                ? 'descending'
                                : 'none'
                          }
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIcon dir={sortDir} reduced={reduced} />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border/60">
            {table.getRowModel().rows.map((row, idx) => {
              const initial = shouldAnimateRows ? { opacity: 0, y: 6 } : false;
              const animate = shouldAnimateRows ? { opacity: 1, y: 0 } : undefined;
              const delay = Math.min(idx, 11) * 0.025;
              return (
                <motion.tr
                  key={row.id}
                  initial={initial}
                  animate={animate}
                  transition={{
                    duration: A.motionDuration.fast,
                    delay,
                    ease: A.easeOut,
                  }}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  onMouseEnter={onRowHover ? () => onRowHover(row.original) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-label={onRowClick ? 'Open row' : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onRowClick(row.original);
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    'group/row transition-[color,background-color] duration-150 ease-out',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                    onRowClick &&
                      'cursor-pointer hover:bg-accent-soft/60 motion-safe:hover:shadow-[inset_3px_0_0_0_var(--accent)]',
                    !onRowClick && 'hover:bg-accent-soft/30',
                    row.getIsSelected() && 'bg-accent-soft/30'
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const sticky = isStickyCol(cell.column.id);
                    const isSelected = row.getIsSelected();
                    const numeric = cell.column.columnDef.meta?.numeric;
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          'px-6 align-middle text-foreground',
                          density === 'compact' ? 'py-2.5' : 'py-4',
                          numeric && 'text-right font-tabular',
                          stickyFirstCol && 'border-b border-border/60',
                          sticky &&
                            'md:sticky md:left-0 md:z-[1] md:shadow-[1px_0_0_0_var(--border)]',
                          sticky &&
                            (isSelected
                              ? 'md:bg-[color-mix(in_srgb,var(--accent-soft)_30%,var(--card))]'
                              : 'md:bg-card')
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="border-t border-border">
          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      ) : null}
    </div>
  );
}

function SortIcon({ dir, reduced }: { dir: false | 'asc' | 'desc'; reduced: boolean }) {
  if (!dir) {
    return (
      <ChevronsUpDown
        size={12}
        strokeWidth={1.5}
        aria-hidden
        className="text-light-foreground"
      />
    );
  }
  const rotate = dir === 'asc' ? 180 : 0;
  return (
    <motion.span
      aria-hidden
      initial={false}
      animate={{ rotate }}
      transition={reduced ? { duration: 0 } : A.springSnappy}
      style={{ display: 'inline-flex', transformOrigin: 'center' }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </motion.span>
  );
}
