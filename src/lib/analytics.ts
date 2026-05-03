/**
 * Analytics abstraction layer.
 * Swap providers by calling initAnalytics() with a custom implementation.
 */

export interface AnalyticsProvider {
  pageView(path: string, properties?: Record<string, any>): void;
  event(name: string, properties?: Record<string, any>): void;
  identify(userId: string, traits?: Record<string, any>): void;
}

class ConsoleAnalytics implements AnalyticsProvider {
  pageView(path: string, properties?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] pageView', path, properties ?? '');
    }
  }

  event(name: string, properties?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] event', name, properties ?? '');
    }
  }

  identify(userId: string, traits?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] identify', userId, traits ?? '');
    }
  }
}

let _analytics: AnalyticsProvider = new ConsoleAnalytics();

export const analytics: AnalyticsProvider = {
  pageView(path, properties) {
    _analytics.pageView(path, properties);
  },
  event(name, properties) {
    _analytics.event(name, properties);
  },
  identify(userId, traits) {
    _analytics.identify(userId, traits);
  },
};

export function initAnalytics(provider?: AnalyticsProvider): void {
  _analytics = provider ?? new ConsoleAnalytics();
}
