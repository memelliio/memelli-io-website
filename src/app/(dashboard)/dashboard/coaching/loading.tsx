export default function CoachingLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 w-40 rounded-lg bg-muted" />
        <div className="mt-2 h-4 w-72 rounded-lg bg-muted" />
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-white/[0.04] bg-card" />
        ))}
      </div>

      {/* Quick action buttons */}
      <div className="flex gap-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-32 rounded-xl bg-muted" />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
          <div className="mb-4 h-5 w-48 rounded-lg bg-muted" />
          <div className="h-[260px] rounded-xl bg-muted" />
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
          <div className="mb-4 h-5 w-40 rounded-lg bg-muted" />
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3.5">
                <div className="space-y-1.5">
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="h-3 w-20 rounded bg-muted" />
                </div>
                <div className="h-4 w-10 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Enrollments table */}
      <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
        <div className="mb-4 h-5 w-40 rounded-lg bg-muted" />
        <div className="space-y-0">
          <div className="flex gap-6 border-b border-white/[0.04] pb-3">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-3 w-14 rounded bg-muted" />
            <div className="ml-auto h-3 w-16 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 py-3.5 border-b border-white/[0.04] last:border-0">
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-5 w-16 rounded-full bg-muted" />
              <div className="ml-auto h-4 w-8 rounded bg-muted" />
              <div className="h-4 w-14 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
