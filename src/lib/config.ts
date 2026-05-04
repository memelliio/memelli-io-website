function trimTrailingSlash(value: string): string {
	return value.replace(/\/+$/, '');
}

const FALLBACK_CORE_API_URL = 'https://api-production-057c.up.railway.app';

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
		return FALLBACK_CORE_API_URL;
	}

	const { protocol, hostname } = window.location;
	if (hostname === 'localhost' || hostname === '127.0.0.1') {
		// Local OS (port 3000) and Terminal (port 3001) are the only canonical
		// local services. The API is always api.memelli.io — dev shares the
		// production universe DB per CLAUDE.md.
		return 'https://api.memelli.io';
	}

	const rootDomain = deriveRootDomain(hostname);
	if (!rootDomain) {
		return FALLBACK_CORE_API_URL;
	}

	if (rootDomain === 'memelli.io') {
		return 'https://api.memelli.io';
	}

	return `${protocol}//api.${rootDomain}`;
}

export const API_URL = resolveApiUrl();
