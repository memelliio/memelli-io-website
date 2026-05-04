import Link from 'next/link';

export const metadata = { title: 'Email Templates — Memelli OS' };

const templates = [
  {
    name: 'Welcome',
    slug: 'welcome',
    description: 'New user welcome email with platform overview and dashboard CTA.',
  },
  {
    name: 'Platform Overview',
    slug: 'overview',
    description: 'Full platform overview showcasing all engines: Commerce, CRM, Coaching, SEO, AI, and Communications.',
  },
  {
    name: 'Funding',
    slug: 'funding',
    description: 'Business funding focused email — credit cards, lines of credit, tradelines, lender matching.',
  },
  {
    name: 'Credit Repair',
    slug: 'credit',
    description: 'Credit repair process email — analysis, disputes, tracking, and funding readiness.',
  },
  {
    name: 'Affiliate / Infinity Network',
    slug: 'affiliate',
    description: 'Affiliate program email — commission structure, partner tiers, marketing assets.',
  },
];

export default function TemplatesIndexPage() {
  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0f', padding: '60px 20px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ color: '#ffffff', fontSize: 32, fontWeight: 700, margin: '0 0 8px' }}>
          Email Templates
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: 15, margin: '0 0 40px', lineHeight: 1.6 }}>
          Professional email templates for Memelli OS. Each template is viewable as a web page and can be sent via the API.
          All templates use inline styles for maximum email client compatibility.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {templates.map((t) => (
            <Link
              key={t.slug}
              href={`/templates/${t.slug}`}
              style={{
                display: 'block',
                padding: '20px 24px',
                background: '#12121a',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                textDecoration: 'none',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <h2 style={{ color: '#ffffff', fontSize: 18, fontWeight: 600, margin: 0 }}>
                  {t.name}
                </h2>
                <span style={{ color: '#E11D2E', fontSize: 13, fontWeight: 500 }}>
                  View Template
                </span>
              </div>
              <p style={{ color: '#71717a', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                {t.description}
              </p>
              <p style={{ color: '#52525b', fontSize: 12, margin: '8px 0 0' }}>
                API: GET /api/email-templates/{t.slug}
              </p>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 40, padding: '20px 24px', background: 'rgba(225,29,46,0.06)', border: '1px solid rgba(225,29,46,0.15)', borderRadius: 12 }}>
          <h3 style={{ color: '#E11D2E', fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>
            API Endpoints
          </h3>
          <p style={{ color: '#a1a1aa', fontSize: 13, margin: '0 0 4px', fontFamily: 'monospace' }}>
            GET /api/email-templates — List all templates
          </p>
          <p style={{ color: '#a1a1aa', fontSize: 13, margin: '0 0 4px', fontFamily: 'monospace' }}>
            GET /api/email-templates/:name — Get raw HTML
          </p>
          <p style={{ color: '#a1a1aa', fontSize: 13, margin: 0, fontFamily: 'monospace' }}>
            POST /api/email-templates/send — Send a template email
          </p>
        </div>
      </div>
    </div>
  );
}
