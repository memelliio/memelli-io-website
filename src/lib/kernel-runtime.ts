'use client';

import { API_URL } from './config';

export interface KernelRuntimeConfig {
  tenant: {
    tenantId: string | null;
    partnerId: string | null;
    organizationName: string | null;
    source: 'system' | 'tenant';
  };
  domain: {
    host: string;
    rootDomain: string;
    appUrl: string;
    apiUrl: string;
    currentUrl: string;
    environment: 'development' | 'staging' | 'production';
  };
  branding: {
    businessName: string;
    tagline?: string;
    logoUrl?: string;
    primaryColor: string;
    secondaryColor?: string;
    accentColor?: string;
  };
  communications: {
    defaultFromEmail: string;
    twilioWebhookBaseUrl: string;
  };
}

declare global {
  interface Window {
    __MEMELLI_KERNEL_RUNTIME__?: KernelRuntimeConfig;
  }
}

function resolveBootstrapBaseUrl(): string {
  if (API_URL) {
    return API_URL;
  }

  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.origin;
}

export async function fetchKernelRuntime(domain?: string): Promise<KernelRuntimeConfig | null> {
  const baseUrl = resolveBootstrapBaseUrl();
  const host = domain || (typeof window !== 'undefined' ? window.location.hostname : '');
  const query = host ? `?domain=${encodeURIComponent(host)}` : '';

  const response = await fetch(`${baseUrl}/api/public/kernel-runtime${query}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    return null;
  }

  const json = await response.json();
  return json?.data || null;
}

export function getKernelRuntime(): KernelRuntimeConfig | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.__MEMELLI_KERNEL_RUNTIME__ || null;
}
