'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/auth';
export default function ContactsPage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.replace('/'); return; }
    const fn = (window as any).__memelliOpenModule;
    if (typeof fn === 'function') {
      router.replace('/');
      setTimeout(() => fn('contacts'), 100);
    } else {
      const q: string[] = (window as any).__memelliPendingQueue ?? [];
      q.push('contacts');
      (window as any).__memelliPendingQueue = q;
      router.replace('/');
    }
  }, [token, isLoading, router]);
  return null;
}
