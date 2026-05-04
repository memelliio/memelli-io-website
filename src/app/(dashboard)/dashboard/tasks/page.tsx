'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/auth';

export interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' | string;
  description?: string | null;
  dueAt?: string | null;
  userId?: string | null;
  contactId?: string | null;
  contact?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null;
}

export default function TasksPage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.replace('/'); return; }
    const fn = (window as any).__memelliOpenModule;
    if (typeof fn === 'function') {
      router.replace('/');
      setTimeout(() => fn('tasks'), 100);
    } else {
      const q: string[] = (window as any).__memelliPendingQueue ?? [];
      q.push('tasks');
      (window as any).__memelliPendingQueue = q;
      router.replace('/');
    }
  }, [token, isLoading, router]);
  return null;
}
