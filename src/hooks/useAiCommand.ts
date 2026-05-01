'use client';

import { useState } from 'react';
import { API_URL as API } from '@/lib/config';

interface AiCommandResult {
  responseText?: string;
  actionsJson?: string | unknown[];
  [key: string]: unknown;
}

export function useAiCommand() {
  const [isLoading, setIsLoading] = useState(false);

  const execute = async (inputText: string, engine = 'core'): Promise<AiCommandResult | null> => {
    setIsLoading(true);
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
      const res = await fetch(`${API}/api/ai/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ inputText, inputMode: 'text', engine }),
      });
      const data = await res.json();
      return (data?.data ?? null) as AiCommandResult | null;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading };
}
