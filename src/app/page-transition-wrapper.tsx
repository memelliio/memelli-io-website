'use client';

import { PageTransition } from '@/components/ui/page-transition';

export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
