'use client';

import { useCallback } from 'react';
import { analytics } from '../lib/analytics';

export function useAnalytics() {
  const trackPageView = useCallback(
    (path?: string, properties?: Record<string, any>) => {
      const resolvedPath =
        path ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
      analytics.pageView(resolvedPath, properties);
    },
    []
  );

  const trackEvent = useCallback(
    (name: string, properties?: Record<string, any>) => {
      analytics.event(name, properties);
    },
    []
  );

  const identify = useCallback(
    (userId: string, traits?: Record<string, any>) => {
      analytics.identify(userId, traits);
    },
    []
  );

  return { trackPageView, trackEvent, identify };
}
