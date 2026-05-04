import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lockmail',
};

export default function LockMailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
