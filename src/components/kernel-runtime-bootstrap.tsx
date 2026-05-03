'use client';

import { useEffect } from 'react';
import { fetchKernelRuntime } from '../lib/kernel-runtime';

export function KernelRuntimeBootstrap() {
  useEffect(() => {
    let active = true;

    void fetchKernelRuntime()
      .then((runtime) => {
        if (!active || !runtime || typeof window === 'undefined') {
          return;
        }

        window.__MEMELLI_KERNEL_RUNTIME__ = runtime;
        document.documentElement.dataset.kernelEnvironment = runtime.domain.environment;
        document.documentElement.style.setProperty('--kernel-primary', runtime.branding.primaryColor);

        if (runtime.branding.secondaryColor) {
          document.documentElement.style.setProperty('--kernel-secondary', runtime.branding.secondaryColor);
        }

        if (runtime.branding.accentColor) {
          document.documentElement.style.setProperty('--kernel-accent', runtime.branding.accentColor);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return null;
}
