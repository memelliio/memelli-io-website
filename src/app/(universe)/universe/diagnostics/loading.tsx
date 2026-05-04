import { LoadingGlobe } from '@/components/ui/loading-globe';

export default function DiagnosticsLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoadingGlobe size="lg" />
        <p className="text-sm text-[hsl(var(--muted-foreground))] animate-pulse">Loading diagnostics...</p>
      </div>
    </div>
  );
}
