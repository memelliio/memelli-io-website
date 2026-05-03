'use client';

import { usePartner } from '@/contexts/partner';

const DEFAULT_LOGO = '/memelli-logo-white.png';

export function PartnerLogo({
  alt = 'Logo',
  className,
  style,
}: {
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const partner = usePartner();
  const src = partner?.logoUrl || DEFAULT_LOGO;
  return <img src={src} alt={partner?.businessName || alt} className={className} style={style} />;
}
