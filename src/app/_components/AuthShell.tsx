'use client';

import { AuthProvider } from '@/contexts/auth';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
