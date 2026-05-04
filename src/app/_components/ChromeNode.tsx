'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  nodeName: string;
  mountTo?: 'body' | 'container';
  viewport?: 'desktop' | 'mobile' | 'all';
};

type Bridge = {
  osState: Record<string, unknown>;
  __memelliWindows: {
    open(appId: string): void;
  };
  __chromeContainer?: HTMLElement | null;
};

const NODE_CACHE = new Map<string, { code: string; ts: number }>();
const TTL_MS = 60_000;

async function fetchNodeCode(
  name: string
): Promise<{ code: string; version?: number } | null> {
  const cached = NODE_CACHE.get(name);
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return { code: cached.code };
  }
  try {
    const resp = await fetch('/api/os-node/' + encodeURIComponent(name), {
      cache: 'no-store',
    });
    if (!resp.ok) return null;
    const json = (await resp.json()) as {
      ok?: boolean;
      code?: string;
      version?: number;
    };
    if (!json.ok || typeof json.code !== 'string') return null;
    NODE_CACHE.set(name, { code: json.code, ts: Date.now() });
    return { code: json.code, version: json.version };
  } catch {
    return null;
  }
}

/**
 * Returns a shared bridge object stored on `window.__memelliOsBridge`.
 * The bridge holds global OS state and a helper to open apps.
 */
function ensureBridge(): Bridge {
  if (typeof window === 'undefined') {
    // Server‑side fallback – never used because the component is client‑only.
    return {
      osState: {},
      __memelliWindows: { open: () => {} },
    };
  }
  const w = window as any;
  if (!w.__memelliOsBridge) {
    w.__memelliOsBridge = {
      osState: {},
      __memelliWindows: {
        open(appId: string) {
          window.dispatchEvent(
            new CustomEvent('memelli:open-app', { detail: { appId } })
          );
        },
      },
    };
  }
  return w.__memelliOsBridge as Bridge;
}

/**
 * ChromeNode – mounts a Memelli OS chrome node (CJS module) into the DOM.
 */
export function ChromeNode({
  nodeName,
  mountTo = 'container',
  viewport = 'all',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 900;
  });

  // Track viewport changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 900px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    // Initialise state in case the media query already matches.
    setIsMobile(mql.matches);
    return () => {
      mql.removeEventListener('change', handler);
    };
  }, []);

  const shouldRender =
    viewport === 'all' ||
    (viewport === 'mobile' && isMobile) ||
    (viewport === 'desktop' && !isMobile);

  // Effect that mounts / unmounts the node.
  useEffect(() => {
    if (!shouldRender) {
      // Ensure any previous mount is cleaned up.
      const prevContainer =
        mountTo === 'container' ? containerRef.current : document.body;
      if (prevContainer) {
        prevContainer.innerHTML = '';
      }
      return;
    }

    let isCancelled = false;
    let cleanupFn: (() => void) | undefined;

    async function mount() {
      const result = await fetchNodeCode(nodeName);
      if (!result?.code || isCancelled) return;

      const bridge = ensureBridge();

      const module = { exports: {} as any };
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const fn = new Function(
        'module',
        'exports',
        'require',
        'app',
        'helpers',
        result.code
      );
      try {
        fn(module, module.exports, () => ({}), bridge, {});
      } catch (e) {
        console.error('Error executing chrome node code:', e);
        return;
      }

      const register = module.exports?.register;
      if (typeof register !== 'function') {
        console.warn('Chrome node does not export a register function:', nodeName);
        return;
      }

      const container =
        mountTo === 'container' ? containerRef.current : document.body;
      if (!container) return;

      // Clear any previous content in the chosen container.
      container.innerHTML = '';

      // Expose the container to the node via the bridge (some nodes look for it).
      bridge.__chromeContainer = container;

      try {
        await register(bridge, {});
      } catch (e) {
        console.error('Error during chrome node register:', e);
      }

      // Record children added by the node so we can clean them up later.
      const initialChildren = new Set<Node>(container.childNodes);
      cleanupFn = () => {
        // Remove any nodes that were not present before mounting.
        Array.from(container.childNodes).forEach((node) => {
          if (!initialChildren.has(node) && node.parentNode) {
            node.parentNode.removeChild(node);
          }
        });
        // Also clear the bridge reference.
        bridge.__chromeContainer = null;
      };
    }

    mount();

    return () => {
      isCancelled = true;
      if (cleanupFn) cleanupFn();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeName, mountTo, shouldRender]);

  // Render placeholder only when mounting into a container.
  return mountTo === 'container' ? <div ref={containerRef} /> : null;
}