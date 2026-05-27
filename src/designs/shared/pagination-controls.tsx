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
      <p className="flex items-baseline gap-1.5 text-xs text-muted-foreground">
        <span className="text-eyebrow text-light-foreground">Page</span>
        <span className="text-sm font-semibold font-tabular text-foreground sm:text-base">{page}</span>
        <span className="text-light-foreground">/</span>
        <span className="font-medium font-tabular text-foreground">{totalPages}</span>
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
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border-medium bg-card text-muted-foreground transition-colors hover:border-accent/40 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border-medium disabled:hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {children}
    </button>
  );
}
