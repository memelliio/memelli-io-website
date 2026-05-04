export default function CreditLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 w-36 rounded-lg bg-muted" />
        <div className="mt-2 h-4 w-72 rounded-lg bg-muted" />
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-white/[0.04] bg-card" />
        ))}
      </div>

      {/* Latest Credit Score card */}
      <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
        <div className="mb-4 h-5 w-40 rounded-lg bg-muted" />
        <div className="flex flex-col items-center gap-6 py-4 sm:flex-row sm:items-start">
          <div className="h-32 w-32 shrink-0 rounded-full border-2 border-white/[0.04] bg-muted" />
          <div className="flex-1 space-y-4 w-full">
            <div className="space-y-2">
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-3 w-40 rounded bg-muted" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl border border-white/[0.04] bg-card" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reports + Documents side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
          <div className="mb-4 h-5 w-32 rounded-lg bg-muted" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="h-4 w-28 rounded bg-muted" />
                <div className="h-5 w-16 rounded-full bg-muted" />
                <div className="h-4 w-8 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
          <div className="mb-4 h-5 w-36 rounded-lg bg-muted" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-36 rounded bg-muted" />
                  <div className="h-3 w-28 rounded bg-muted" />
                </div>
                <div className="h-5 w-16 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="mb-3 h-3 w-28 rounded bg-muted" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl border border-white/[0.04] bg-card" />
          ))}
        </div>
      </div>
    </div>
  );
}
