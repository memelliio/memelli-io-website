'use client';

import { Palette } from 'lucide-react';

export default function ThemesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted border border-border mb-6">
        <Palette className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Themes</h1>
      <p className="text-muted-foreground text-sm mb-6">Customize your website themes</p>
      <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 border border-red-500/20 px-4 py-2">
        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-sm text-red-400 font-medium">Coming soon</span>
      </div>
    </div>
  );
}
