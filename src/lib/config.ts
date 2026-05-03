// API_URL resolution — same-origin (''). No fallback, no legacy gateway. Operator law: fail loud, no silent api.memelli.io fallback.
// rev: 2026-05-04-no-fallback-bust-cache

function trimTrailingSlash(value: string): string {
	return value.replace(/\/+$/, '');
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

function resolveApiUrl(): string {
	const envUrl = trimTrailingSlash(process.env.NEXT_PUBLIC_API_URL || '');
	if (envUrl) {
		return envUrl;
	}

	const coreApiUrl = trimTrailingSlash(process.env.MEMELLI_CORE_API_URL || '');
	if (coreApiUrl) {
		return coreApiUrl;
	}

	if (typeof window === 'undefined') {
		// Server-side render: same-origin (next/headers will resolve)
		return '';
	}

	// Auth + access live INSIDE this Next.js app at /api/auth/*. Same-origin
	// always — the legacy api.memelli.io gateway is no longer the auth source.
	return '';
}

export const API_URL = resolveApiUrl();
