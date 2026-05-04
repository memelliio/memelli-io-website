import type { Metadata } from 'next';
import { headers } from 'next/headers';

interface KernelRuntimeResponse {
  data?: {
    branding?: {
      businessName?: string;
      tagline?: string;
      logoUrl?: string;
    };
    domain?: {
      appUrl?: string;
      apiUrl?: string;
    };
  };
}

function deriveRootDomain(hostname: string): string {
  const normalized = hostname.toLowerCase().replace(/:\d+$/, '');
  if (!normalized || normalized === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(normalized)) {
    return '';
  }

  const parts = normalized.split('.').filter(Boolean);
  if (parts.length < 2) {
    return normalized;
  }

  return parts.slice(-2).join('.');
}

async function fetchRuntimeMetadata(): Promise<KernelRuntimeResponse['data'] | null> {
  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') || headerStore.get('host') || '';
  const forwardedProto = headerStore.get('x-forwarded-proto') || 'https';
  const normalizedHost = host.split(',')[0].trim();

  if (!normalizedHost) {
    return null;
  }

  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.MEMELLI_CORE_API_URL || '';
  const apiBaseUrl = configuredApiUrl || (() => {
    const rootDomain = deriveRootDomain(normalizedHost);
    if (!rootDomain) {
      // Local OS=:3000 and Terminal=:3001 are the only local services.
      // API is always api.memelli.io (dev shares prod DB per CLAUDE.md).
      return 'https://api.memelli.io';
    }
    if (normalizedHost.startsWith('api.')) {
      return `${forwardedProto}://${normalizedHost}`;
    }
    return `${forwardedProto}://api.${rootDomain}`;
  })();

  try {
    const response = await fetch(`${apiBaseUrl}/api/public/kernel-runtime?domain=${encodeURIComponent(normalizedHost)}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as KernelRuntimeResponse;
    return json.data || null;
  } catch {
    return null;
  }
}

export async function buildKernelMetadata(): Promise<Metadata> {
  const runtime = await fetchRuntimeMetadata();
  const appUrl = runtime?.domain?.appUrl || process.env.APP_URL || 'http://localhost:3000';
  const businessName = runtime?.branding?.businessName || 'Memelli OS';
  const description = runtime?.branding?.tagline || 'AI-powered business operating system.';

  return {
    title: `${businessName} — AI-Powered Business Operating System`,
    description,
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '48x48' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    },
    manifest: '/manifest.json',
    metadataBase: new URL(appUrl),
    openGraph: {
      title: `${businessName} — AI-Powered Business Operating System`,
      description,
      url: appUrl,
      siteName: businessName,
      images: [{ url: runtime?.branding?.logoUrl || '/memelli-logo.png', width: 1200, height: 630, alt: businessName }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${businessName} — AI-Powered Business Operating System`,
      description,
      images: [runtime?.branding?.logoUrl || '/memelli-logo.png'],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: businessName,
    },
  };
}
