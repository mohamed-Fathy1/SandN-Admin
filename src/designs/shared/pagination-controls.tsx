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
      className={cn('flex items-center justify-between gap-3 px-4 py-3', className)}
    >
      <p className="text-xs text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span> of{' '}
        <span className="font-medium text-foreground">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1">
        <PageButton onClick={() => onPageChange(1)} disabled={!canPrev} label="First page">
          <ChevronsLeft size={14} strokeWidth={1.5} aria-hidden />
        </PageButton>
        <PageButton
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          label="Previous page"
        >
          <ChevronLeft size={14} strokeWidth={1.5} aria-hidden />
        </PageButton>
        <PageButton onClick={() => onPageChange(page + 1)} disabled={!canNext} label="Next page">
          <ChevronRight size={14} strokeWidth={1.5} aria-hidden />
        </PageButton>
        <PageButton
          onClick={() => onPageChange(totalPages)}
          disabled={!canNext}
          label="Last page"
        >
          <ChevronsRight size={14} strokeWidth={1.5} aria-hidden />
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
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  );
}
