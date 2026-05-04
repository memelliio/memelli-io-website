'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /dashboard/admin/claude — redirects to workspace hero and opens the
 * Admin Claude Terminal as a dockview panel (same pattern as /dashboard/vpn).
 */
export default function AdminClaudePage() {
  const router = useRouter();

  useEffect(() => {
    const fn = (window as any).__memelliOpenModule;
    if (typeof fn === 'function') {
      router.replace('/');
      setTimeout(() => fn('admin-claude'), 100);
    } else {
      const q: string[] = (window as any).__memelliPendingQueue ?? [];
      q.push('admin-claude');
      (window as any).__memelliPendingQueue = q;
      router.replace('/');
    }
  }, [router]);

  return null;
}
