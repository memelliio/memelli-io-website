'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './auth';

export type Partner = {
  slug: string;
  businessName: string;
  logoUrl: string | null;
  brandColor: string | null;
};

const PartnerContext = createContext<Partner | null>(null);

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.memelli.io';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

async function fetchPartner(slug: string): Promise<Partner | null> {
  try {
    const r = await fetch(API + '/api/partner/' + encodeURIComponent(slug), { cache: 'no-store' });
    if (!r.ok) return null;
    const j = await r.json();
    return {
      slug: j.slug,
      businessName: j.businessName,
      logoUrl: j.logoUrl ?? null,
      brandColor: j.brandColor ?? null,
    };
  } catch {
    return null;
  }
}

export function PartnerProvider({ initialSlug, children }: { initialSlug?: string | null; children: ReactNode }) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const auth = useAuth();
  const userPartnerSlug =
    (auth as any)?.user?.partnerSlug ?? (auth as any)?.user?.partner?.slug ?? null;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (partner?.brandColor) {
        document.documentElement.style.setProperty('--brand-color', partner.brandColor);
      } else {
        document.documentElement.style.removeProperty('--brand-color');
      }
    }
  }, [partner?.brandColor]);

  useEffect(() => {
    const slug = userPartnerSlug || readCookie('partner_slug') || initialSlug || null;
    if (!slug) {
      setPartner(null);
      return;
    }
    let cancelled = false;
    fetchPartner(slug).then((p) => {
      if (!cancelled) setPartner(p);
    });
    return () => {
      cancelled = true;
    };
  }, [userPartnerSlug, initialSlug]);

  return <PartnerContext.Provider value={partner}>{children}</PartnerContext.Provider>;
}

export function usePartner(): Partner | null {
  return useContext(PartnerContext);
}
