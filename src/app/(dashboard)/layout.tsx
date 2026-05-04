'use client';

import { AppShell } from '../../components/layout/AppShell';
import CommandPalette from '../../components/ai/CommandPalette';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <CommandPalette />
      {children}
    </AppShell>
  );
}
