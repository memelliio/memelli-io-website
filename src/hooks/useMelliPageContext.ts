'use client';

/**
 * useMelliPageContext — global hook that auto-detects the current page,
 * fetches a lightweight data summary, AND scans the live DOM for
 * data-melli-context attributes on any element (forms, tables, modals,
 * sections, etc.) — merging everything into window.__memelliPageContext.
 *
 * Lives in AppShell — runs on every authenticated page automatically.
 * New pages and new UI sections are covered with zero per-page wiring.
 *
 * Usage anywhere in the app:
 *   <form data-melli-context="New contact form — collecting name, email, phone">
 *   <section data-melli-context="Deals table — 12 open deals visible">
 *   <div data-melli-context="Invoice modal — editing invoice #1042 for Acme Corp">
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/auth';
import { API_URL } from '@/lib/config';

/* ── Lightweight API helper ──────────────────────────────────────── */

async function apiFetch(path: string, token: string) {
  try {
    const res = await fetch(`${API_URL}${path}?limit=5&page=1`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json;
  } catch {
    return null;
  }
}

function fmt(val: any): string {
  if (val == null) return '';
  if (typeof val === 'number') return val.toLocaleString();
  return String(val);
}

function nameList(items: any[], nameKey = 'name'): string {
  if (!items?.length) return 'none';
  return items.slice(0, 3).map(i => i[nameKey] || i.firstName || i.title || '').filter(Boolean).join(', ');
}

/* ── DOM scanner: reads all data-melli-context attributes ────────── */

function scanDomContext(): string {
  if (typeof document === 'undefined') return '';
  const nodes = document.querySelectorAll('[data-melli-context]');
  const parts: string[] = [];
  nodes.forEach(el => {
    const val = (el as HTMLElement).dataset.melliContext?.trim();
    if (val) parts.push(val);
  });
  return parts.length ? '\nActive UI elements: ' + parts.join(' | ') : '';
}

/* ── Route → API context ─────────────────────────────────────────── */

async function buildRouteContext(pathname: string, token: string): Promise<string> {
  const seg = pathname.replace(/^\//, '').split('/');
  const page = seg[seg.length - 1] || seg[0] || 'dashboard';
  const pageName = page.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  if (pathname.includes('/contacts')) {
    const data = await apiFetch('/api/contacts', token);
    const list = Array.isArray(data) ? data : data?.data ?? [];
    return `Page: Contacts. Total: ${fmt(data?.meta?.total ?? list.length)} contacts. Recent: ${nameList(list, 'firstName')}. User can say a name to call, message, or look up a contact.`;
  }

  if (pathname.includes('/crm') || pathname.includes('/deals') || pathname.includes('/pipeline')) {
    const data = await apiFetch('/api/crm/deals', token);
    const list = Array.isArray(data) ? data : data?.data ?? [];
    const topDeal = list[0];
    return `Page: CRM. ${fmt(data?.meta?.total ?? list.length)} deals in pipeline. Top: ${topDeal?.title || topDeal?.name || 'none'} (${topDeal?.value ? '$' + fmt(topDeal.value) : 'no value'}). User can open a deal, move a stage, or add a contact.`;
  }

  if (pathname.includes('/communications') || pathname.includes('/voice') || pathname.includes('/messaging')) {
    const data = await apiFetch('/api/communications/calls', token);
    const list = Array.isArray(data) ? data : data?.data ?? [];
    return `Page: Communications. Recent calls: ${nameList(list, 'contactName')}. User can say a name to call, or ask about messages or voicemails.`;
  }

  if (pathname.includes('/commerce') || pathname.includes('/orders') || pathname.includes('/products')) {
    const orders = await apiFetch('/api/commerce/orders', token);
    const orderList = Array.isArray(orders) ? orders : orders?.data ?? [];
    return `Page: Commerce. ${fmt(orders?.meta?.total ?? orderList.length)} orders. Recent: ${nameList(orderList, 'customerName')}. User can ask about sales, products, revenue, or open an order.`;
  }

  if (pathname.includes('/analytics')) {
    const data = await apiFetch('/api/analytics/summary', token);
    const revenue = data?.totalRevenue ?? data?.revenue ?? null;
    const leads = data?.totalLeads ?? data?.leads ?? null;
    return `Page: Analytics.${revenue != null ? ' Revenue: $' + fmt(revenue) + '.' : ''}${leads != null ? ' Leads: ' + fmt(leads) + '.' : ''} User can ask about trends, products, conversions, or time periods.`;
  }

  if (pathname.includes('/coaching') || pathname.includes('/programs') || pathname.includes('/enrollments')) {
    const data = await apiFetch('/api/coaching/programs', token);
    const list = Array.isArray(data) ? data : data?.data ?? [];
    return `Page: Coaching. ${fmt(data?.meta?.total ?? list.length)} programs. Active: ${nameList(list)}. User can ask about enrollment, progress, certificates, or open a program.`;
  }

  if (pathname.includes('/seo') || pathname.includes('/content')) {
    return `Page: SEO & Content. User can generate an article, check rankings, run IndexNow, or see traffic analytics.`;
  }

  if (pathname.includes('/ai') || pathname.includes('/workflows') || pathname.includes('/automation')) {
    const data = await apiFetch('/api/agents', token);
    const list = Array.isArray(data) ? data : data?.data ?? [];
    return `Page: AI & Automation. ${fmt(data?.meta?.total ?? list.length)} agents. User can dispatch a task, check agent status, or trigger a workflow.`;
  }

  if (pathname.includes('/tasks')) {
    const data = await apiFetch('/api/tasks', token);
    const list = Array.isArray(data) ? data : data?.data ?? [];
    const pending = list.filter((t: any) => t.status === 'pending' || t.status === 'in_progress').length;
    return `Page: Tasks. ${fmt(data?.meta?.total ?? list.length)} total, ${pending} pending. User can add a task, mark complete, or filter by priority.`;
  }

  if (pathname.includes('/settings') || pathname.includes('/profile')) {
    return `Page: Settings. User can update profile, change password, manage integrations, or configure notifications.`;
  }

  return `Page: ${pageName}. User is on the ${pageName} page.`;
}

/* ── Hook ────────────────────────────────────────────────────────── */

export function useMelliPageContext() {
  const pathname = usePathname();
  const { token } = useAuth();
  const lastPathRef = useRef<string | null>(null);
  const routeContextRef = useRef<string>('');
  const observerRef = useRef<MutationObserver | null>(null);

  // Merge route context + live DOM context and write to window
  function pushContext() {
    const domCtx = scanDomContext();
    const full = (routeContextRef.current + domCtx).trim();
    if (typeof window !== 'undefined' && full) {
      (window as any).__memelliPageContext = full;
    }
  }

  // Re-scan DOM whenever elements are added/removed/mutated
  function startObserver() {
    if (typeof MutationObserver === 'undefined') return;
    observerRef.current?.disconnect();
    observerRef.current = new MutationObserver(() => pushContext());
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-melli-context'],
    });
  }

  // On route change: fetch API context, then start DOM observer
  useEffect(() => {
    if (!token || !pathname) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    buildRouteContext(pathname, token).then(ctx => {
      routeContextRef.current = ctx;
      pushContext();
      startObserver();
    });

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (typeof window !== 'undefined') {
        delete (window as any).__memelliPageContext;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, token]);
}
