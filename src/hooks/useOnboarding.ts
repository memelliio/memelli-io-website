'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'melli_onboarding_complete';

export interface UseOnboardingReturn {
  isComplete: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export function useOnboarding(): UseOnboardingReturn {
  const [isComplete, setIsComplete] = useState<boolean>(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setIsComplete(stored === 'true');
    } catch {
      // ignore security errors
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore QuotaExceededError or security errors
    }
    setIsComplete(true);
  }, []);

  const resetOnboarding = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore security errors
    }
    setIsComplete(false);
  }, []);

  return { isComplete, completeOnboarding, resetOnboarding };
}
