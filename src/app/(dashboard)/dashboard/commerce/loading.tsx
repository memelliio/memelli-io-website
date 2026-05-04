export default function CommerceLoading() {
  return (
    <div className="min-h-screen bg-card animate-pulse">
      <div className="space-y-8 p-8">
        {/* Header */}
        <div>
          <div className="h-8 w-40 rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-72 rounded-lg bg-muted" />
        </div>

        {/* Metric tiles */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-white/[0.04] bg-card" />
          ))}
        </div>

        {/* Revenue chart */}
        <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
          <div className="mb-4 h-6 w-48 rounded-lg bg-muted" />
          <div className="h-[280px] rounded-xl bg-muted" />
        </div>

        {/* Recent Orders + Top Products */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.04] bg-card overflow-hidden">
            <div className="p-6 pb-4">
              <div className="h-6 w-32 rounded-lg bg-muted" />
            </div>
            <div className="divide-y divide-white/[0.04]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4">
                  <div className="space-y-2">
                    <div className="h-4 w-36 rounded bg-muted" />
                    <div className="h-3 w-20 rounded bg-muted" />
                  </div>
                  <div className="h-4 w-16 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.04] bg-card overflow-hidden">
            <div className="p-6 pb-4">
              <div className="h-6 w-32 rounded-lg bg-muted" />
            </div>
            <div className="divide-y divide-white/[0.04]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-xl bg-muted" />
                    <div className="space-y-2">
                      <div className="h-4 w-28 rounded bg-muted" />
                      <div className="h-3 w-16 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="h-4 w-16 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
          <div className="mb-4 h-6 w-32 rounded-lg bg-muted" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl border border-white/[0.04] bg-card" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
