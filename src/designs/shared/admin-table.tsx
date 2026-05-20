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
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

const sortedRowModel = getSortedRowModel();
import { Checkbox } from './checkbox';
import { EmptyState } from './empty-state';
import { QueryErrorState } from './query-error-state';
import { TableSkeleton } from './skeletons';
import { PaginationControls } from './pagination-controls';
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
  emptyState?: { title: string; description?: string; action?: React.ReactNode };
  onRowClick?: (row: T) => void;
  onRowHover?: (row: T) => void;
  getRowId: (row: T) => string;
  enableSorting?: boolean;
  className?: string;
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
  onRowClick,
  onRowHover,
  getRowId,
  enableSorting = true,
  className,
}: AdminTableProps<T>) {
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);

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
        title={emptyState?.title ?? 'Nothing here yet'}
        description={emptyState?.description}
        action={emptyState?.action}
      />
    );
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-card shadow-card',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className="sticky top-0 z-[1] px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                      style={{ width: header.getSize() === 0 ? undefined : header.getSize() }}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded text-left transition-colors',
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
                          <SortIcon dir={sortDir} />
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
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                onMouseEnter={onRowHover ? () => onRowHover(row.original) : undefined}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-muted/60',
                  !onRowClick && 'hover:bg-muted/30'
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-3.5 align-middle text-foreground">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
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

function SortIcon({ dir }: { dir: false | 'asc' | 'desc' }) {
  if (dir === 'asc') return <ChevronUp size={12} strokeWidth={2} aria-hidden />;
  if (dir === 'desc') return <ChevronDown size={12} strokeWidth={2} aria-hidden />;
  return (
    <ChevronsUpDown
      size={12}
      strokeWidth={1.5}
      aria-hidden
      className="text-light-foreground"
    />
  );
}
