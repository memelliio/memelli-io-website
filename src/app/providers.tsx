'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../contexts/auth';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { Toaster } from 'sonner';
import { VoiceSessionProvider } from '../providers/voice-session';
import { PageContextProvider } from '../providers/page-context';
import { ContextEngineProvider } from '../providers/context-engine';
import { MelliProvider } from '../providers/jessica-provider';
import { MUAProvider } from '../providers/mua-provider';
import ErrorReporter from '../components/error-reporter';
import { KernelRuntimeBootstrap } from '../components/kernel-runtime-bootstrap';
import { revokeFullPanelMounted } from '../components/mobile-fallback-chat';



// Stable QueryClient instance — created once outside component to avoid
// re-creation across hot reloads while still being lazily initialized.
let _queryClient: QueryClient | null = null;
function getQueryClient() {
  if (!_queryClient) {
    _queryClient = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60_000, retry: 1 },
      },
    });
  }
  return _queryClient;
}

/**
 * Deferred providers that aren't needed for the first paint.
 * VoiceSession, ContextEngine, Melli, and MUA all perform
 * expensive work on mount (mic permission, API calls, polling).
 * We wrap them so they only mount after the initial render commits.
 */
/**
 * Global inactivity warning overlay — shown when user has been idle for 10 minutes.
 * Rendered inside AuthProvider so it can use useAuth.
 */
function InactivityWarning() {
  const { showInactivityWarning, dismissInactivityWarning, logout } = useAuth();
  if (!showInactivityWarning) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="rounded-2xl border border-yellow-500/20 bg-zinc-900 p-8 shadow-2xl max-w-sm text-center">
        <div className="text-yellow-400 text-lg font-semibold mb-2">Session Timeout</div>
        <p className="text-zinc-400 text-sm mb-6">
          You have been inactive for 10 minutes. You will be logged out in 1 minute unless you continue.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={dismissInactivityWarning}
            className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors"
          >
            Stay Logged In
          </button>
          <button
            onClick={logout}
            className="rounded-xl border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Fallback UI if the deferred providers (Melli/MUA/Voice) crash.
 * Shows a non-intrusive banner — the mobile fallback chat remains
 * functional because it lives outside DeferredProviders.
 */
function DeferredProvidersFallback() {
  // Revoke the full panel signal so the mobile fallback chat re-appears
  useEffect(() => {
    revokeFullPanelMounted();
    console.log('[DeferredProvidersFallback] providers crashed, revoked full panel signal');
  }, []);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] rounded-xl border border-yellow-500/20 bg-zinc-900/95 backdrop-blur-lg px-4 py-3 shadow-xl max-w-xs text-center">
      <div className="text-xs text-yellow-400 font-medium mb-1">Full chat system failed to load</div>
      <div className="text-[11px] text-zinc-500">You can still use the basic chat below.</div>
    </div>
  );
}

function DeferredProviders({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Use requestIdleCallback (with rAF fallback) so deferred providers
    // mount after the browser has finished painting the first frame.
    // On iOS Safari < 17, requestIdleCallback may not exist — the
    // setTimeout fallback ensures we still mount within ~50ms.
    const schedule =
      typeof requestIdleCallback === 'function'
        ? requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 50);
    const id = schedule(() => setReady(true));
    return () => {
      if (typeof cancelIdleCallback === 'function') {
        cancelIdleCallback(id as number);
      } else {
        clearTimeout(id as ReturnType<typeof setTimeout>);
      }
    };
  }, []);

  if (!ready) {
    // Render children immediately without heavy providers so the page
    // appears fast. Melli/MUA/Voice/ContextEngine are not needed for
    // the initial static content.
    return <>{children}</>;
  }

  // Wrap in ErrorBoundary so provider crashes don't white-screen the app.
  // The mobile fallback chat lives OUTSIDE DeferredProviders and stays alive.
  return (
    <ErrorBoundary fallback={<DeferredProvidersFallback />}>
      <VoiceSessionProvider>
        <ContextEngineProvider>
          <MelliProvider>
            <MUAProvider>
              {children}
            </MUAProvider>
          </MelliProvider>
        </ContextEngineProvider>
      </VoiceSessionProvider>
    </ErrorBoundary>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Defer Event SDK initialization until after first paint
  const sdkRef = useRef<{ destroy: () => void } | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      import('../lib/event-sdk').then(({ getEventSDK }) => {
        sdkRef.current = getEventSDK();
      });
    }, 2000); // 2s delay — event tracking is non-critical
    return () => {
      clearTimeout(timer);
      sdkRef.current?.destroy();
    };
  }, []);

  const queryClient = getQueryClient();

  return (
    <ErrorReporter>
      <KernelRuntimeBootstrap />
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <InactivityWarning />
            <PageContextProvider>
              <DeferredProviders>
                {children}
              </DeferredProviders>
            </PageContextProvider>
            <Toaster theme="dark" position="bottom-right" richColors />
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </ErrorReporter>
  );
}
