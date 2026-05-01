'use client';

import nextDynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const GlobalMemelliOrb = nextDynamic(
  () => import('./GlobalMemelliOrb').then(m => ({ default: m.GlobalMemelliOrb })),
  { ssr: false }
);

interface GlobalMemelliOrbLoaderProps {
  /** Force hero mode (large, inline). Omit to auto-detect from route. */
  hero?: boolean;
  /** When true, suppress chat UI below the globe (it will render in the form panel instead). */
  formMode?: boolean;
  /** Hide conversation bubbles below the orb */
  hideChat?: boolean;
  /** Hide quick-prompt suggestion pills */
  hidePrompts?: boolean;
}

export function GlobalMemelliOrbLoader({ hero, formMode, hideChat, hidePrompts }: GlobalMemelliOrbLoaderProps = {}) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isDashboard = pathname?.startsWith('/dashboard') || pathname?.startsWith('/universe');

  // Skip on homepage (hero=true version handles it there).
  // Skip on dashboard/universe — the MUA panel embeds the globe directly.
  if (!hero && (isHome || isDashboard)) return null;

  return <GlobalMemelliOrb heroMode={hero ?? false} formMode={formMode} hideChat={hideChat} hidePrompts={hidePrompts} />;
}
