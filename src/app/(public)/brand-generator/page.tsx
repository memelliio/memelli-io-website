'use client';

import Link from 'next/link';

const PACKAGES = [
  {
    icon: '🎨',
    title: 'Brand Package',
    price: '$1,997',
    description: 'Complete brand identity system built by AI in minutes.',
    items: ['Logo suite (SVG, PNG, dark/light)', 'Color palette + hex codes', 'Typography system', 'Brand voice & tone guide', 'Business card design', 'Social media kit', 'Email signature templates', 'Brand usage guidelines', 'Favicon + app icon set', 'Letterhead & invoice template'],
    color: '#a78bfa',
  },
  {
    icon: '🌐',
    title: 'Website Package',
    price: '$2,497',
    description: 'Turn-key responsive website with full content — ready to publish.',
    items: ['Home page with hero section', 'Services / Products page', 'About & team page', 'Contact + lead capture', 'Blog structure ready', 'Mobile-responsive design', 'SEO meta tags included', 'Privacy policy + terms', 'Google Analytics ready', 'Form + CRM integration'],
    color: '#60a5fa',
  },
  {
    icon: '📣',
    title: 'Marketing Kit',
    price: '$1,441',
    description: 'Multi-channel marketing assets across social, email, and ads.',
    items: ['30 social media posts', 'Email welcome sequence (7 emails)', 'Facebook & Instagram ad copy', 'Google Ads headlines & descriptions', 'Content calendar (3 months)', 'SMS campaign templates', 'Press release template', 'Pitch deck outline', 'Testimonial request templates', 'Referral program copy'],
    color: '#fb923c',
  },
  {
    icon: '🔍',
    title: 'SEO Bundle',
    price: '$497',
    description: 'Keyword strategy + article content to drive organic traffic.',
    items: ['Target keyword research (50 keywords)', '5 long-form article outlines', 'Meta title & description for all pages', 'Local SEO setup guide', 'Google Business Profile optimization', 'Backlink outreach templates', 'Schema markup recommendations', 'Internal linking strategy', 'Competitor gap analysis', 'Monthly tracking setup'],
    color: '#34d399',
  },
];

const TOTAL = '$6,432';

export default function BrandGeneratorPage() {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Hero */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px 48px' }}>
        <div style={{ display: 'inline-block', background: '#a78bfa22', border: '1px solid #a78bfa44', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#a78bfa', fontWeight: 700, marginBottom: 24, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Brand & Site Generator · LIVE
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 6vw, 64px)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 20px', background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Complete Business Package.<br />Generated in Minutes.
        </h1>
        <p style={{ fontSize: 18, color: '#888', maxWidth: 600, lineHeight: 1.6, margin: '0 0 40px' }}>
          Brand identity, website, marketing assets, and SEO content — everything a business needs to launch. AI builds it. You sell it or use it.
        </p>

        {/* Value summary */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 48 }}>
          {PACKAGES.map(p => (
            <div key={p.title} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#111', border: '1px solid #222', borderRadius: 12, padding: '8px 16px' }}>
              <span style={{ fontSize: 16 }}>{p.icon}</span>
              <span style={{ fontSize: 13, color: '#aaa' }}>{p.title}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: p.color }}>{p.price}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#10b98120', border: '1px solid #10b98140', borderRadius: 12, padding: '8px 16px' }}>
            <span style={{ fontSize: 13, color: '#10b981', fontWeight: 700 }}>Total Stack Value: {TOTAL}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/dashboard/brand-engine" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#a78bfa', color: '#000', fontWeight: 800, padding: '14px 28px', borderRadius: 12, textDecoration: 'none', fontSize: 15 }}>
            ⚡ Generate Now — Free to Try
          </Link>
          <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', background: '#111', border: '1px solid #333', color: '#ccc', fontWeight: 600, padding: '14px 24px', borderRadius: 12, textDecoration: 'none', fontSize: 15 }}>
            View Pricing →
          </Link>
        </div>
      </div>

      {/* Package Cards */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#555', marginBottom: 24 }}>What&apos;s Included</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {PACKAGES.map(pkg => (
            <div key={pkg.title} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{pkg.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{pkg.title}</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 900, color: pkg.color }}>{pkg.price}</span>
              </div>

              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, margin: 0 }}>{pkg.description}</p>

              {/* Deliverables */}
              <div style={{ borderTop: '1px solid #1e1e1e', paddingTop: 12 }}>
                {pkg.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                    <span style={{ color: '#10b981', fontSize: 12, marginTop: 2 }}>✓</span>
                    <span style={{ fontSize: 12, color: '#777' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Full Stack CTA */}
        <div style={{ marginTop: 48, background: 'linear-gradient(135deg, #1e1040, #0f0f0f)', border: '1px solid #a78bfa33', borderRadius: 20, padding: 40, display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a78bfa', margin: '0 0 8px' }}>Full Stack Bundle</p>
            <h3 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 8px', color: '#fff' }}>Everything. One client. {TOTAL}.</h3>
            <p style={{ fontSize: 14, color: '#666', margin: 0 }}>Generate all 4 products in parallel. Deliver in under 2 minutes. Keep 100% margin.</p>
          </div>
          <Link href="/dashboard/brand-engine" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#a78bfa', color: '#000', fontWeight: 900, padding: '16px 32px', borderRadius: 12, textDecoration: 'none', fontSize: 16, whiteSpace: 'nowrap' }}>
            ⚡ Generate Full Stack Bundle
          </Link>
        </div>
      </div>
    </div>
  );
}
