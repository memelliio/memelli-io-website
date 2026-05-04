export default function LandingBuilderLoading() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-blue-500" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading landing builder...</p>
      </div>
    </div>
  );
}
