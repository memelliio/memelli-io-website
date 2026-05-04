import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { AuthShell } from './_components/AuthShell';
import { OsBodyClass } from './_components/OsBodyClass';
import { loadOsTheme, themeToCss, loadOsExtraCss } from '@/lib/os-theme';
import { RegistryBoot } from './_components/RegistryBoot';
import './globals.css';

export const dynamic = 'force-dynamic';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
});

/**
 * Generate metadata at request‑time.
 * Attempts to fetch dynamic meta from `/api/os-node/os-config-meta`.
 * The endpoint is expected to return raw JavaScript that assigns
 * `module.exports.meta = { title, description, image }`.
 * If the fetch or compilation fails, static defaults are used.
 */
export async function generateMetadata(): Promise<Metadata> {
  // static fallback values
  const fallback: Metadata = {
    title: 'Memelli — Business OS',
    description: 'Memelli Universe — Command Center',
    themeColor: '#C41E3A',
  };

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/os-node/os-config-meta`, {
      cache: 'no-store',
    });

    if (!res.ok) return fallback;

    // Assume the API returns raw JS code (e.g. "module.exports.meta = { ... }")
    const code = await res.text();

    // Compile the code in an isolated context
    const m: { exports: any } = { exports: {} };
    const fn = new Function('module', 'exports', code);
    fn(m, m.exports);

    const meta = m.exports?.meta;
    if (!meta) return fallback;

    const ogImage = meta.image
      ? {
          images: [{ url: meta.image }],
        }
      : undefined;

    return {
      title: meta.title ?? fallback.title,
      description: meta.description ?? fallback.description,
      openGraph: ogImage,
      themeColor: '#C41E3A',
    };
  } catch {
    // any error – use fallback
    return fallback;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const initialPartnerSlug = h.get('x-partner-slug');
  const [theme, extraCss] = await Promise.all([loadOsTheme(), loadOsExtraCss()]);
  const combinedCss = themeToCss(theme) + '\n' + (extraCss || '');

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <style id="os-runtime-css" dangerouslySetInnerHTML={{ __html: combinedCss }} />
      </head>
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
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <OsBodyClass />
        <RegistryBoot />
        <main id="main">
          <AuthShell initialPartnerSlug={initialPartnerSlug}>{children}</AuthShell>
        </main>
      </body>
    </html>
  );
}