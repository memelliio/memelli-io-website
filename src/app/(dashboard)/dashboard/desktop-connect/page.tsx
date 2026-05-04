'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DesktopConnectRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/desktop-connect');
  }, [router]);
  return null;
}
