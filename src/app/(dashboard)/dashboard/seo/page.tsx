'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/auth';
export default function SeoPage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.replace('/'); return; }
    const fn = (window as any).__memelliOpenModule;
    if (typeof fn === 'function') {
      router.replace('/');
      setTimeout(() => fn('seo'), 100);
    } else {
      const q: string[] = (window as any).__memelliPendingQueue ?? [];
      q.push('seo');
      (window as any).__memelliPendingQueue = q;
      router.replace('/');
    }
  }, [token, isLoading, router]);
  return null;
}
