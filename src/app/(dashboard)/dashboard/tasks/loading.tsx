export default function TasksLoading() {
  return (
    <div className="space-y-6 p-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-20 rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-24 rounded-lg bg-muted" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-muted" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-xl bg-muted" />
        ))}
      </div>

      {/* Data table */}
      <div className="rounded-2xl border border-white/[0.04] bg-card overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 border-b border-white/[0.04] px-6 py-3">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-white/[0.04] last:border-0 px-6 py-4">
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-5 w-20 rounded-full bg-muted" />
            <div className="h-5 w-16 rounded-full bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-4 w-14 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* AI Tasks section */}
      <div className="rounded-2xl border border-white/[0.04] bg-card overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-white/[0.04] px-6 py-4">
          <div className="h-4 w-4 rounded bg-muted" />
          <div className="h-4 w-40 rounded bg-muted" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3.5 px-6 py-4 border-b border-white/[0.04] last:border-0">
            <div className="h-3.5 w-3.5 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-64 rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
            <div className="h-5 w-20 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
