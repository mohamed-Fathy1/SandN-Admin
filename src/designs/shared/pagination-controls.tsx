import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PaginationControls({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-wrap items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-5', className)}
    >
      <p className="text-[10px] text-muted-foreground sm:text-xs">
        <span className="text-[9px] uppercase tracking-[0.14em] text-light-foreground sm:text-[10px]">Page</span>{' '}
        <span className="font-display text-sm italic text-foreground tabular-nums sm:text-base">{page}</span>
        <span className="mx-1 text-light-foreground sm:mx-1.5">/</span>
        <span className="font-medium text-foreground tabular-nums">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1">
        <PageButton onClick={() => onPageChange(1)} disabled={!canPrev} label="First page">
          <ChevronsLeft size={15} strokeWidth={1.5} aria-hidden />
        </PageButton>
        <PageButton
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          label="Previous page"
        >
          <ChevronLeft size={15} strokeWidth={1.5} aria-hidden />
        </PageButton>
        <PageButton onClick={() => onPageChange(page + 1)} disabled={!canNext} label="Next page">
          <ChevronRight size={15} strokeWidth={1.5} aria-hidden />
        </PageButton>
        <PageButton
          onClick={() => onPageChange(totalPages)}
          disabled={!canNext}
          label="Last page"
        >
          <ChevronsRight size={15} strokeWidth={1.5} aria-hidden />
        </PageButton>
      </div>
    </nav>
  );
}

function PageButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-medium bg-card text-muted-foreground transition-colors hover:border-accent/40 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border-medium disabled:hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  );
}
