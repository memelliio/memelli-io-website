export default function SEOLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-8 w-40 rounded-lg bg-muted" />
        <div className="mt-2 h-4 w-80 rounded-lg bg-muted" />
      </div>

      {/* Metric tiles */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-white/[0.04] bg-card" />
          ))}
        </div>

        {/* Pipeline card */}
        <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
          <div className="mb-4 h-5 w-36 rounded-lg bg-muted" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto h-8 w-16 rounded-lg bg-muted mb-2" />
                <div className="mx-auto h-3 w-20 rounded bg-muted" />
              </div>
            ))}
          </div>
          <div className="h-2.5 rounded-full bg-muted" />
        </div>

        {/* Content + Rankings side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
            <div className="mb-4 h-5 w-36 rounded-lg bg-muted" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl border border-white/[0.04] bg-card" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
            <div className="mb-4 h-5 w-24 rounded-lg bg-muted" />
            <div className="h-20 rounded-xl bg-muted" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
          <div className="mb-4 h-5 w-32 rounded-lg bg-muted" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl border border-white/[0.04] bg-card" />
            ))}
          </div>
        </div>

        {/* Quick Nav */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-2xl border border-white/[0.04] bg-card" />
          ))}
        </div>
      </div>
    </div>
  );
}
