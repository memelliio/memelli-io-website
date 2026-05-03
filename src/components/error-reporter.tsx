'use client';

import React, { useEffect, useRef, ReactNode } from 'react';
import { API_URL } from '@/lib/config';
import { handleError, dispatchErrorToAgents } from './mua-error-handler';

// ── Deduplication ──────────────────────────────────────────────────
const DEBOUNCE_MS = 30_000;
const recentErrors = new Map<string, number>();

function shouldReport(key: string): boolean {
  const now = Date.now();
  const last = recentErrors.get(key);
  if (last && now - last < DEBOUNCE_MS) return false;
  recentErrors.set(key, now);
  return true;
}

// ── Reporter ───────────────────────────────────────────────────────
function reportError(message: string, stack?: string) {
  try {
    const key = message + (stack || '');
    if (!shouldReport(key)) return;

    const url = typeof window !== 'undefined' ? window.location.href : 'unknown';
    const errorString = `${message}\n${stack || ''}`;
    const context = `global:${url}`;

    // Use MUA error protocol for classification, retry tracking, and dispatch
    const muaResponse = handleError(errorString, context);
    dispatchErrorToAgents(
      `FRONTEND_ERROR: ${message}\n\nStack: ${stack || 'N/A'}\nURL: ${url}`,
      context,
      muaResponse,
    );
  } catch {
    // Absolute last resort — swallow everything
  }
}

// ── Class-based Error Boundary ─────────────────────────────────────
interface BoundaryProps {
  children: ReactNode;
}

interface BoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const stack = [
      error.stack || '',
      info.componentStack || '',
    ].filter(Boolean).join('\n\n--- Component Stack ---\n');

    reportError(error.message, stack);
  }

  render() {
    if (this.state.hasError) {
      // Reset on next render attempt so the app can recover
      this.state = { hasError: false };
      return this.props.children;
    }
    return this.props.children;
  }
}

// ── Function component that wires global handlers ──────────────────
function GlobalHandlers({ children }: { children: ReactNode }) {
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const onError = (
      event: string | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error,
    ) => {
      const msg =
        error?.message || (typeof event === 'string' ? event : 'Unknown error');
      const stack =
        error?.stack || `${source || ''}:${lineno || 0}:${colno || 0}`;
      reportError(msg, stack);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg =
        reason instanceof Error
          ? reason.message
          : String(reason || 'Unhandled promise rejection');
      const stack = reason instanceof Error ? reason.stack : undefined;
      reportError(msg, stack);
    };

    window.onerror = onError;
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.onerror = null;
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return <>{children}</>;
}

// ── Default export ─────────────────────────────────────────────────
export default function ErrorReporter({ children }: { children: ReactNode }) {
  return (
    <GlobalHandlers>
      <ErrorBoundary>{children}</ErrorBoundary>
    </GlobalHandlers>
  );
}
