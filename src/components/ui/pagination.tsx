import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  total?: number;
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];

  if (current <= 3) {
    pages.push(1, 2, 3, 4, '...', total);
  } else if (current >= total - 2) {
    pages.push(1, '...', total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }

  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  perPage,
  total,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  const rangeStart = perPage ? (currentPage - 1) * perPage + 1 : undefined;
  const rangeEnd = perPage && total ? Math.min(currentPage * perPage, total) : undefined;

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      {/* Showing X-Y of Z */}
      {total !== undefined && rangeStart !== undefined && rangeEnd !== undefined ? (
        <p className="text-xs text-zinc-500">
          Showing <span className="text-zinc-300">{rangeStart}</span>–
          <span className="text-zinc-300">{rangeEnd}</span> of{' '}
          <span className="text-zinc-300">{total}</span>
        </p>
      ) : (
        <span />
      )}

      {/* Page controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-md border border-zinc-700 text-zinc-400 transition-colors',
            'hover:border-zinc-600 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40'
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((page, i) =>
          page === '...' ? (
            <span key={`ellipsis-${i}`} className="flex h-10 w-10 md:h-8 md:w-8 items-center justify-center text-sm text-zinc-600">
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={cn(
                'flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors',
                page === currentPage
                  ? 'border-red-500/60 bg-red-500/20 text-red-300'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100'
              )}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-md border border-zinc-700 text-zinc-400 transition-colors',
            'hover:border-zinc-600 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40'
          )}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
