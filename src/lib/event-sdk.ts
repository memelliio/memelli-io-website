/**
 * Memelli Cockpit (Command Center) Frontend Event SDK — see CLAUDE.md naming note
 * Universal event tracking across all portals (dashboard, Lite, Pro).
 * Auto-captures events + provides manual tracking API.
 *
 * Client-only code — all browser APIs are guarded for SSR safety.
 */

import { getKernelRuntime } from './kernel-runtime';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EventSDKConfig {
  apiUrl: string;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  debug: boolean;
}

export type EventType =
  | 'system_event'
  | 'ui_event'
  | 'user_event'
  | 'ai_event'
  | 'admin_event'
  | 'affiliate_event'
  | 'security_event'
  | 'financial_event';

export interface TrackEvent {
  eventType: EventType;
  eventName: string;
  metadata?: Record<string, unknown>;
  path?: string;
}

interface EnrichedEvent extends TrackEvent {
  eventId: string;
  muUid: string | null;
  tenantId: string | null;
  sessionId: string | null;
  host: string;
  path: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isBrowser = typeof window !== 'undefined';

function generateHex(bytes: number): string {
  if (isBrowser && window.crypto && window.crypto.getRandomValues) {
    const buf = new Uint8Array(bytes);
    window.crypto.getRandomValues(buf);
    return Array.from(buf)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback
  let hex = '';
  for (let i = 0; i < bytes; i++) {
    hex += Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0');
  }
  return hex;
}

function generateEventId(): string {
  return `evt_${generateHex(6)}`;
}

function readStorage(key: string): string | null {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(key) ?? getCookie(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, value);
    setCookie(key, value, 365);
  } catch {
    // storage unavailable
  }
}

function getCookie(name: string): string | null {
  if (!isBrowser) return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number): void {
  if (!isBrowser) return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

function readSession(key: string): string | null {
  if (!isBrowser) return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string): void {
  if (!isBrowser) return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // session storage unavailable
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEYS = {
  UID: 'memelli_uid',
  TENANT: 'memelli_tenant',
  SESSION: 'memelli_session',
  FAILED_EVENTS: 'memelli_failed_events',
} as const;

const MAX_FAILED_STORED = 500;

const DEFAULT_CONFIG: EventSDKConfig = {
  apiUrl:
    (isBrowser && getKernelRuntime()?.domain?.apiUrl) ||
    (isBrowser && typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
    '/api',
  batchSize: 20,
  flushInterval: 5000,
  maxRetries: 3,
  debug: false,
};

function buildEventsEndpoint(baseUrl: string): string {
  const normalized = (baseUrl || '').replace(/\/+$/, '');
  if (normalized.endsWith('/api')) {
    return `${normalized}/events`;
  }
  if (normalized.length === 0) {
    return '/api/events';
  }
  return `${normalized}/api/events`;
}

// ---------------------------------------------------------------------------
// SDK Class
// ---------------------------------------------------------------------------

export class MemelliEventSDK {
  private config: EventSDKConfig = { ...DEFAULT_CONFIG };
  private buffer: EnrichedEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private muUid: string | null = null;
  private tenantId: string | null = null;
  private sessionId: string | null = null;
  private initialized = false;
  private lastPath: string = '';
  private retryCount = 0;

  // Keep references so we can remove listeners on destroy
  private clickHandler: ((e: MouseEvent) => void) | null = null;
  private submitHandler: ((e: SubmitEvent) => void) | null = null;
  private errorHandler: ((e: ErrorEvent) => void) | null = null;
  private rejectionHandler: ((e: PromiseRejectionEvent) => void) | null = null;
  private visibilityHandler: (() => void) | null = null;
  private beforeUnloadHandler: (() => void) | null = null;
  private popstateHandler: (() => void) | null = null;

  // Original history methods for cleanup
  private originalPushState: typeof history.pushState | null = null;
  private originalReplaceState: typeof history.replaceState | null = null;

  // -------------------------------------------------------------------
  // Core methods
  // -------------------------------------------------------------------

  init(config?: Partial<EventSDKConfig>): void {
    if (this.initialized) return;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.muUid = readStorage(STORAGE_KEYS.UID);
    this.tenantId = readStorage(STORAGE_KEYS.TENANT);
    this.sessionId = readSession(STORAGE_KEYS.SESSION);

    if (!this.sessionId && isBrowser) {
      this.sessionId = `ses_${generateHex(8)}`;
      writeSession(STORAGE_KEYS.SESSION, this.sessionId);
    }

    if (isBrowser) {
      this.lastPath = window.location.pathname;
      this.setupAutoCapture();
      this.flushTimer = setInterval(() => this.flush(), this.config.flushInterval);
      this.trackPageView();
    }

    this.initialized = true;
    this.log('SDK initialized', this.config);
  }

  track(event: TrackEvent): void {
    const enriched: EnrichedEvent = {
      ...event,
      eventId: generateEventId(),
      muUid: this.muUid,
      tenantId: this.tenantId,
      sessionId: this.sessionId,
      host: isBrowser ? window.location.hostname : '',
      path: event.path || (isBrowser ? window.location.pathname : '/'),
      timestamp: new Date().toISOString(),
    };

    this.buffer.push(enriched);
    this.log('Event tracked', enriched);

    if (this.buffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0 && !this.hasFailed()) return;

    const events = [...this.buffer];
    this.buffer = [];

    // Merge previously failed events
    const failed = this.loadFailedEvents();
    const payload = [...failed, ...events];

    if (payload.length === 0) return;

    try {
      const res = await fetch(buildEventsEndpoint(this.config.apiUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: payload }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Success — clear failed store
      this.clearFailedEvents();
      this.retryCount = 0;
      this.log(`Flushed ${payload.length} events`);
    } catch (err) {
      this.retryCount++;
      this.log('Flush failed', err);
      this.storeFailedEvents([...payload, ...this.buffer]);
      // Put un-sent buffer-during-flight events back (buffer may have grown)
      // We already stored everything, clear buffer to avoid duplication
      this.buffer = [];

      if (this.retryCount < this.config.maxRetries) {
        this.log(`Will retry (${this.retryCount}/${this.config.maxRetries})`);
      }
    }
  }

  identify(muUid: string): void {
    this.muUid = muUid;
    writeStorage(STORAGE_KEYS.UID, muUid);
    this.log('Identified user', muUid);
  }

  setTenant(tenantId: string): void {
    this.tenantId = tenantId;
    writeStorage(STORAGE_KEYS.TENANT, tenantId);
    this.log('Tenant set', tenantId);
  }

  setSession(sessionId: string): void {
    this.sessionId = sessionId;
    writeSession(STORAGE_KEYS.SESSION, sessionId);
    this.log('Session set', sessionId);
  }

  getBufferSize(): number {
    return this.buffer.length;
  }

  destroy(): void {
    if (!isBrowser) return;

    // Flush remaining
    this.flushSync();

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.clickHandler) document.removeEventListener('click', this.clickHandler);
    if (this.submitHandler) document.removeEventListener('submit', this.submitHandler as EventListener);
    if (this.errorHandler) window.removeEventListener('error', this.errorHandler);
    if (this.rejectionHandler) window.removeEventListener('unhandledrejection', this.rejectionHandler);
    if (this.visibilityHandler) document.removeEventListener('visibilitychange', this.visibilityHandler);
    if (this.beforeUnloadHandler) window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    if (this.popstateHandler) window.removeEventListener('popstate', this.popstateHandler);

    // Restore history methods
    if (this.originalPushState) history.pushState = this.originalPushState;
    if (this.originalReplaceState) history.replaceState = this.originalReplaceState;

    this.initialized = false;
    this.log('SDK destroyed');
  }

  // -------------------------------------------------------------------
  // Convenience methods
  // -------------------------------------------------------------------

  trackPageView(path?: string): void {
    this.track({
      eventType: 'ui_event',
      eventName: 'page_view',
      path: path || (isBrowser ? window.location.pathname : '/'),
      metadata: {
        referrer: isBrowser ? document.referrer : '',
        title: isBrowser ? document.title : '',
      },
    });
  }

  trackClick(elementId: string, metadata?: Record<string, unknown>): void {
    this.track({
      eventType: 'ui_event',
      eventName: 'button_click',
      metadata: { elementId, ...metadata },
    });
  }

  trackLogin(metadata?: Record<string, unknown>): void {
    this.track({
      eventType: 'user_event',
      eventName: 'login',
      metadata,
    });
  }

  trackLogout(): void {
    this.track({
      eventType: 'user_event',
      eventName: 'logout',
    });
  }

  trackAiPrompt(prompt: string, metadata?: Record<string, unknown>): void {
    this.track({
      eventType: 'ai_event',
      eventName: 'ai_prompt',
      metadata: { prompt, ...metadata },
    });
  }

  trackAiResponse(metadata?: Record<string, unknown>): void {
    this.track({
      eventType: 'ai_event',
      eventName: 'ai_response',
      metadata,
    });
  }

  trackSignup(metadata?: Record<string, unknown>): void {
    this.track({
      eventType: 'user_event',
      eventName: 'signup_completed',
      metadata,
    });
  }

  trackError(error: Error | string, metadata?: Record<string, unknown>): void {
    const message = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;
    this.track({
      eventType: 'system_event',
      eventName: 'client_error',
      metadata: { message, stack, ...metadata },
    });
  }

  trackAffiliateClick(affiliateCode: string, metadata?: Record<string, unknown>): void {
    this.track({
      eventType: 'affiliate_event',
      eventName: 'referral_click',
      metadata: { affiliateCode, ...metadata },
    });
  }

  // -------------------------------------------------------------------
  // Auto-capture
  // -------------------------------------------------------------------

  private setupAutoCapture(): void {
    if (!isBrowser) return;

    this.setupRouteTracking();
    this.setupClickTracking();
    this.setupFormTracking();
    this.setupErrorTracking();
    this.setupVisibilityTracking();
    this.setupBeforeUnload();
  }

  private setupRouteTracking(): void {
    // popstate (back/forward)
    this.popstateHandler = () => this.onRouteChange();
    window.addEventListener('popstate', this.popstateHandler);

    // Monkey-patch pushState
    this.originalPushState = history.pushState.bind(history);
    const sdk = this;
    history.pushState = function (...args: Parameters<typeof history.pushState>) {
      sdk.originalPushState!(...args);
      sdk.onRouteChange();
    };

    // Monkey-patch replaceState
    this.originalReplaceState = history.replaceState.bind(history);
    history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
      sdk.originalReplaceState!(...args);
      sdk.onRouteChange();
    };
  }

  private onRouteChange(): void {
    const newPath = window.location.pathname;
    if (newPath === this.lastPath) return;

    this.track({
      eventType: 'ui_event',
      eventName: 'route_change',
      metadata: {
        from: this.lastPath,
        to: newPath,
      },
      path: newPath,
    });

    this.lastPath = newPath;
    this.trackPageView(newPath);
  }

  private setupClickTracking(): void {
    this.clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Walk up to find the nearest [data-track] element
      const tracked = target.closest('[data-track]') as HTMLElement | null;
      if (!tracked) return;

      const trackValue = tracked.getAttribute('data-track') ?? '';
      const id = tracked.id || tracked.getAttribute('data-id') || '';
      const text = (tracked.textContent ?? '').trim().slice(0, 200);

      this.track({
        eventType: 'ui_event',
        eventName: 'button_click',
        metadata: {
          elementId: id,
          text,
          trackValue,
          tagName: tracked.tagName.toLowerCase(),
        },
      });
    };

    document.addEventListener('click', this.clickHandler, { capture: true });
  }

  private setupFormTracking(): void {
    this.submitHandler = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement | null;
      if (!form) return;

      this.track({
        eventType: 'ui_event',
        eventName: 'form_submit',
        metadata: {
          formId: form.id || '',
          action: form.action || '',
          method: form.method || 'get',
        },
      });
    };

    document.addEventListener('submit', this.submitHandler as EventListener, { capture: true });
  }

  private setupErrorTracking(): void {
    this.errorHandler = (e: ErrorEvent) => {
      this.track({
        eventType: 'system_event',
        eventName: 'client_error',
        metadata: {
          message: e.message,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
        },
      });
    };

    this.rejectionHandler = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      this.track({
        eventType: 'system_event',
        eventName: 'client_error',
        metadata: {
          message: reason instanceof Error ? reason.message : String(reason),
          stack: reason instanceof Error ? reason.stack : undefined,
          type: 'unhandled_rejection',
        },
      });
    };

    window.addEventListener('error', this.errorHandler);
    window.addEventListener('unhandledrejection', this.rejectionHandler);
  }

  private setupVisibilityTracking(): void {
    this.visibilityHandler = () => {
      const hidden = document.visibilityState === 'hidden';
      this.track({
        eventType: 'ui_event',
        eventName: hidden ? 'session_pause' : 'session_resume',
      });

      // Flush when the tab is hidden — may not get another chance
      if (hidden) {
        this.flush();
      }
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private setupBeforeUnload(): void {
    this.beforeUnloadHandler = () => {
      this.flushSync();
    };

    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  // -------------------------------------------------------------------
  // Retry / failed events persistence
  // -------------------------------------------------------------------

  private setupRetry(): void {
    // Retry is handled inline during flush — failed events are persisted
    // to localStorage and merged on next flush attempt.
  }

  private hasFailed(): boolean {
    if (!isBrowser) return false;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FAILED_EVENTS);
      if (!raw) return false;
      const arr = JSON.parse(raw);
      return Array.isArray(arr) && arr.length > 0;
    } catch {
      return false;
    }
  }

  private loadFailedEvents(): EnrichedEvent[] {
    if (!isBrowser) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FAILED_EVENTS);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      this.clearFailedEvents();
      return arr as EnrichedEvent[];
    } catch {
      return [];
    }
  }

  private storeFailedEvents(events: EnrichedEvent[]): void {
    if (!isBrowser) return;
    try {
      // Merge with existing and cap at MAX_FAILED_STORED
      const existing = this.loadFailedEventsRaw();
      const merged = [...existing, ...events].slice(-MAX_FAILED_STORED);
      localStorage.setItem(STORAGE_KEYS.FAILED_EVENTS, JSON.stringify(merged));
    } catch {
      // storage full or unavailable
    }
  }

  private loadFailedEventsRaw(): EnrichedEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FAILED_EVENTS);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? (arr as EnrichedEvent[]) : [];
    } catch {
      return [];
    }
  }

  private clearFailedEvents(): void {
    if (!isBrowser) return;
    try {
      localStorage.removeItem(STORAGE_KEYS.FAILED_EVENTS);
    } catch {
      // ignore
    }
  }

  // -------------------------------------------------------------------
  // Sync flush (for beforeunload / destroy)
  // -------------------------------------------------------------------

  private flushSync(): void {
    if (!isBrowser) return;
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    const failed = this.loadFailedEvents();
    const payload = [...failed, ...events];

    if (payload.length === 0) return;

    const blob = new Blob([JSON.stringify({ events: payload })], {
      type: 'application/json',
    });

    const sent = navigator.sendBeacon(`${this.config.apiUrl}/events`, blob);

    if (!sent) {
      // sendBeacon failed — persist for next session
      this.storeFailedEvents(payload);
    }
  }

  // -------------------------------------------------------------------
  // Debug logging
  // -------------------------------------------------------------------

  private log(...args: unknown[]): void {
    if (this.config.debug && isBrowser) {
      // eslint-disable-next-line no-console
      console.log('[MemelliSDK]', ...args);
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let instance: MemelliEventSDK | null = null;

export function getEventSDK(config?: Partial<EventSDKConfig>): MemelliEventSDK {
  if (!instance) {
    instance = new MemelliEventSDK();
    instance.init(config);
  }
  return instance;
}

// ---------------------------------------------------------------------------
// Convenience global object
// ---------------------------------------------------------------------------

export const Memelli = {
  track: (event: TrackEvent) => getEventSDK().track(event),
  trackPageView: (path?: string) => getEventSDK().trackPageView(path),
  trackClick: (id: string, meta?: Record<string, unknown>) => getEventSDK().trackClick(id, meta),
  trackLogin: (meta?: Record<string, unknown>) => getEventSDK().trackLogin(meta),
  trackLogout: () => getEventSDK().trackLogout(),
  trackAiPrompt: (prompt: string, meta?: Record<string, unknown>) =>
    getEventSDK().trackAiPrompt(prompt, meta),
  trackAiResponse: (meta?: Record<string, unknown>) => getEventSDK().trackAiResponse(meta),
  trackSignup: (meta?: Record<string, unknown>) => getEventSDK().trackSignup(meta),
  trackError: (err: Error | string, meta?: Record<string, unknown>) =>
    getEventSDK().trackError(err, meta),
  trackAffiliateClick: (code: string, meta?: Record<string, unknown>) =>
    getEventSDK().trackAffiliateClick(code, meta),
  flush: () => getEventSDK().flush(),
  identify: (muUid: string) => getEventSDK().identify(muUid),
  setTenant: (tenantId: string) => getEventSDK().setTenant(tenantId),
  setSession: (sessionId: string) => getEventSDK().setSession(sessionId),
  init: (config?: Partial<EventSDKConfig>) => getEventSDK(config),
  destroy: () => {
    if (instance) {
      instance.destroy();
      instance = null;
    }
  },
  getBufferSize: () => (instance ? instance.getBufferSize() : 0),
};
