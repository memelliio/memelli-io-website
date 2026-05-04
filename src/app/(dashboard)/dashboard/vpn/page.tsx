'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/auth';

/**
 * VPN route — always opens as a workspace panel on the home hero, never standalone.
 * Redirects to / and signals the workspace to open the VPN panel.
 */
export default function VpnPage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!token) {
      router.replace('/vpn');
      return;
    }

    // If workspace is already mounted, open the panel directly and go home
    const fn = (window as any).__memelliOpenModule;
    if (typeof fn === 'function') {
      router.replace('/');
      setTimeout(() => fn('vpn'), 100);
    } else {
      // Workspace not mounted yet — queue it and redirect to home
      const q: string[] = (window as any).__memelliPendingQueue ?? [];
      q.push('vpn');
      (window as any).__memelliPendingQueue = q;
      router.replace('/');
    }
  }, [token, isLoading, router]);

  return null;
}
