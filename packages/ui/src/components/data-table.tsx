import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";
import { Spinner } from "./spinner";
import { EmptyState } from "./empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

export interface DataTableColumn<T> {
  header: string;
  accessor: keyof T | string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  pageSize?: number;
  className?: string;
  rowKey?: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
}

function getCellValue<T>(row: T, accessor: keyof T | string): React.ReactNode {
  const value = (row as Record<string, unknown>)[accessor as string];
  if (value === null || value === undefined) return "\u2014";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value as React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyState,
  pageSize = 20,
  className,
  rowKey,
  onRowClick,
}: DataTableProps<T>) {
  const [page, setPage] = React.useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const paginated = data.slice((page - 1) * pageSize, page * pageSize);

  // Reset to page 1 if data shrinks
  React.useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : data.length === 0 ? (
        emptyState ?? (
          <EmptyState
            title="No data"
            description="There's nothing here yet."
          />
        )
      ) : (
        <>
          <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/[0.04] hover:bg-transparent">
                  {columns.map((col) => (
                    <TableHead
                      key={col.accessor as string}
                      className={cn("text-xs font-medium text-zinc-500 tracking-tight bg-zinc-900/40", col.className)}
                    >
                      {col.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((row, i) => (
                  <TableRow
                    key={rowKey ? rowKey(row, i) : i}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "border-b border-white/[0.02] transition-all duration-200",
                      onRowClick && "cursor-pointer hover:bg-white/[0.03]",
                    )}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.accessor as string}
                        className={cn("text-sm text-zinc-100", col.className)}
                      >
                        {col.render ? col.render(row) : getCellValue(row, col.accessor)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-zinc-500 tabular-nums">
                Showing {(page - 1) * pageSize + 1}&ndash;{Math.min(page * pageSize, data.length)} of{" "}
                {data.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-40 transition-all duration-200"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "\u2026")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("\u2026");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "\u2026" ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-zinc-600 text-xs">
                        {"\u2026"}
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={cn(
                          "min-w-[2rem] rounded-lg px-2 py-1 text-xs font-medium transition-all duration-200",
                          page === p
                            ? "bg-red-600 text-white shadow-lg shadow-red-500/20"
                            : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100",
                        )}
                        aria-current={page === p ? "page" : undefined}
                      >
                        {p}
                      </button>
                    ),
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-40 transition-all duration-200"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
