/**
 * MUA (legacy: Memelli Universe Agent → now: Memelli Cockpit Agent) — Client Error Handling Protocol
 *
 * When the MUA encounters an error, it follows this protocol:
 * 1. Never show raw errors, stack traces, or technical messages to the client
 * 2. Acknowledge the issue in plain language
 * 3. Auto-dispatch the error to agent pools for repair
 * 4. Give the client a specific wait time before retrying
 * 5. Track retry attempts and escalate if the issue persists
 */

import { API_URL } from '@/lib/config';

// ── Error severity → wait time mapping ────────────────────────────────────
// How long to tell the client to wait based on error type

interface ErrorConfig {
  waitSeconds: number;
  clientMessage: string;
  voiceMessage: string;
  maxRetries: number;
}

const ERROR_CONFIGS: Record<string, ErrorConfig> = {
  // API returned an error (server-side issue)
  api_error: {
    waitSeconds: 180, // 3 minutes
    clientMessage: "Something went wrong on my end. I'm already looking into it — give me about 3 minutes and try again.",
    voiceMessage: "Something went wrong on my end. I'm looking into it. Give me about 3 minutes.",
    maxRetries: 3,
  },

  // Network error (connection failed)
  network_error: {
    waitSeconds: 30, // 30 seconds
    clientMessage: "I lost connection for a moment. Let me try again — if it persists, check your internet and retry in about 30 seconds.",
    voiceMessage: "I lost connection for a moment. Let me try again in about 30 seconds.",
    maxRetries: 5,
  },

  // Melli returned an error-like response (AI hiccup)
  meli_error: {
    waitSeconds: 60, // 1 minute
    clientMessage: "I didn't quite get that right. Could you try rephrasing, or give me about a minute to sort things out?",
    voiceMessage: "I didn't quite get that right. Try rephrasing, or give me a minute.",
    maxRetries: 3,
  },

  // Authentication error
  auth_error: {
    waitSeconds: 0,
    clientMessage: "Looks like your session timed out. Just log in again and you'll be right back.",
    voiceMessage: "Your session timed out. Just log back in and you're good.",
    maxRetries: 0,
  },

  // Rate limited
  rate_limited: {
    waitSeconds: 60,
    clientMessage: "I'm getting a lot of requests right now. Give me a second — I'll be ready again in about a minute.",
    voiceMessage: "I'm getting a lot of requests right now. Give me a minute.",
    maxRetries: 2,
  },

  // Component/render crash
  render_crash: {
    waitSeconds: 10,
    clientMessage: "Something didn't load right. A quick page refresh should fix it.",
    voiceMessage: "Something didn't load right. Try refreshing the page.",
    maxRetries: 1,
  },

  // Unknown/fallback
  unknown: {
    waitSeconds: 120, // 2 minutes
    clientMessage: "Something didn't go as planned. I'm on it — try again in a couple of minutes.",
    voiceMessage: "Something didn't go as planned. I'm on it. Try again in a couple minutes.",
    maxRetries: 3,
  },
};

// ── Retry tracker ─────────────────────────────────────────────────────────

interface RetryEntry {
  count: number;
  firstSeen: number;
  lastSeen: number;
  errorType: string;
}

const retryTracker = new Map<string, RetryEntry>();

function getRetryKey(errorType: string, context: string): string {
  return `${errorType}:${context}`;
}

// ── Main API ──────────────────────────────────────────────────────────────

export function classifyError(error: string): string {
  const lower = error.toLowerCase();
  if (lower.includes('failed to fetch') || lower.includes('econnrefused') || lower.includes('networkerror') || lower.includes('network request failed')) return 'network_error';
  if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('session expired')) return 'auth_error';
  if (lower.includes('429') || lower.includes('rate limit') || lower.includes('too many requests')) return 'rate_limited';
  // Only match Melli-specific error patterns that would not appear in normal conversation
  if (lower.includes('i\'m temporarily unavailable') || lower.includes('meli_error')) return 'meli_error';
  if (lower.includes('hydration') || lower.includes('cannot read properties') || lower.includes('is not a function')) return 'render_crash';
  // Match actual HTTP error codes/phrases, not bare words like "server" which appear in normal AI responses
  if (lower.includes('http 500') || lower.includes('http 502') || lower.includes('http 503') || lower.includes('internal server error') || lower.includes('bad gateway') || lower.includes('service unavailable')) return 'api_error';
  return 'unknown';
}

export function getErrorConfig(errorType: string): ErrorConfig {
  return ERROR_CONFIGS[errorType] || ERROR_CONFIGS.unknown;
}

export interface MUAErrorResponse {
  clientMessage: string;
  voiceMessage: string;
  waitSeconds: number;
  shouldRetry: boolean;
  retryCount: number;
  escalated: boolean;
}

export function handleError(error: string, context: string): MUAErrorResponse {
  const errorType = classifyError(error);
  const config = getErrorConfig(errorType);

  // Track retries
  const key = getRetryKey(errorType, context);
  const existing = retryTracker.get(key);
  const now = Date.now();

  let retryCount = 0;
  let escalated = false;

  if (existing) {
    // Reset if last error was more than 10 minutes ago
    if (now - existing.lastSeen > 10 * 60 * 1000) {
      retryTracker.delete(key);
    } else {
      existing.count++;
      existing.lastSeen = now;
      retryCount = existing.count;

      if (retryCount >= config.maxRetries) {
        escalated = true;
      }
    }
  }

  if (!retryTracker.has(key)) {
    retryTracker.set(key, { count: 1, firstSeen: now, lastSeen: now, errorType });
    retryCount = 1;
  }

  const shouldRetry = retryCount < config.maxRetries && config.maxRetries > 0;

  // Build response
  let clientMessage = config.clientMessage;
  let voiceMessage = config.voiceMessage;

  if (escalated) {
    clientMessage = "This one's taking longer than expected. I've brought in extra help and I'm staying on it.";
    voiceMessage = "This one's taking a bit longer. I've brought in extra help. Hang tight.";
  }

  return {
    clientMessage,
    voiceMessage,
    waitSeconds: config.waitSeconds,
    shouldRetry,
    retryCount,
    escalated,
  };
}

/**
 * Dispatch error to agent pools for repair.
 * Fire-and-forget — never throws.
 */
export function dispatchErrorToAgents(
  error: string,
  context: string,
  muaResponse: MUAErrorResponse,
): void {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
    if (!token) return;

    const priority = muaResponse.escalated ? 'critical' : 'high';
    const prefix = muaResponse.escalated ? 'MUA_ESCALATED_ERROR' : 'MUA_ERROR';

    fetch(`${API_URL}/api/admin/command-center/dispatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        task: `${prefix}: ${error.slice(0, 300)}. Context: ${context}. Retry count: ${muaResponse.retryCount}. Escalated: ${muaResponse.escalated}. Wait time given to client: ${muaResponse.waitSeconds}s.`,
        priority,
      }),
    }).catch(() => {});
  } catch {
    // Never let dispatch crash the MUA
  }
}
