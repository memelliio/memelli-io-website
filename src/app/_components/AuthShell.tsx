'use client';

import { AuthProvider } from '@/contexts/auth';
import { PartnerProvider } from '@/contexts/partner';

export function AuthShell({
  initialPartnerSlug,
  children,
}: {
  initialPartnerSlug?: string | null;
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <PartnerProvider initialSlug={initialPartnerSlug}>{children}</PartnerProvider>
    </AuthProvider>
  );
}
