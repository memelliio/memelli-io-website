import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthShell } from './_components/AuthShell';
import { OsBodyClass } from './_components/OsBodyClass';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'memelli',
  description: 'Memelli Universe — Command Center',
  themeColor: '#C41E3A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={inter.className}
        style={{
          margin: 0,
          padding: 0,
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          fontFamily: 'var(--font-inter), Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        <OsBodyClass />
        <AuthShell>{children}</AuthShell>
      </body>
    </html>
  );
}
