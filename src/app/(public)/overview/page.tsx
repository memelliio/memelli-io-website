import Link from 'next/link';

/* ── Metadata ──────────────────────────────────────────────────────────────── */

export const metadata = {
  title: 'Memelli OS — Work Hard, Dream Big',
  description:
    'Your business IO. Business compliance, business funding, AI agents, marketing, commerce, and the supporting tools (including credit) your business needs to run.',
};

/* ── Section wrapper ───────────────────────────────────────────────────────── */

function Section({
  children,
  alt = false,
  id,
}: {
  children: React.ReactNode;
  alt?: boolean;
  id?: string;
}) {
  return (
    <section
      id={id}
      style={{
        width: '100%',
        background: alt ? '#0a0a0f' : '#050507',
        padding: '80px 24px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>{children}</div>
    </section>
  );
}

/* ── Heading helpers ───────────────────────────────────────────────────────── */

function SectionHeading({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 48, textAlign: 'center' as const }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <h2
        style={{
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: 800,
          color: '#ffffff',
          marginBottom: 12,
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </h2>
      <p style={{ fontSize: 18, color: '#a0a0b0', maxWidth: 700, margin: '0 auto', lineHeight: 1.6 }}>
        {subtitle}
      </p>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 14,
        fontSize: 16,
        color: '#c8c8d8',
        lineHeight: 1.5,
      }}
    >
      <span style={{ color: '#E11D2E', fontWeight: 700, flexShrink: 0 }}>&#x2713;</span>
      <span>{children}</span>
    </li>
  );
}

function FeatureGrid({ items }: { items: { icon: string; title: string; desc: string }[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
        marginTop: 32,
      }}
    >
      {items.map((item) => (
        <div
          key={item.title}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: 28,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>{item.icon}</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{item.title}</h3>
          <p style={{ fontSize: 14, color: '#999', lineHeight: 1.6 }}>{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Red accent line ───────────────────────────────────────────────────────── */

function RedDivider() {
  return (
    <div
      style={{
        width: 60,
        height: 3,
        background: '#E11D2E',
        margin: '0 auto 32px',
        borderRadius: 2,
      }}
    />
  );
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function OverviewPage() {
  return (
    <div style={{ background: '#050507', color: '#ffffff', fontFamily: "'Geist', system-ui, sans-serif" }}>
      {/* ─── 1. HERO ─────────────────────────────────────────────────────── */}
      <section
        style={{
          width: '100%',
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '80px 24px',
          background: 'radial-gradient(ellipse at 50% 30%, rgba(225,29,46,0.08) 0%, #050507 70%)',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #E11D2E 0%, #8b1120 100%)',
            marginBottom: 32,
            boxShadow: '0 0 60px rgba(225,29,46,0.3)',
          }}
        />
        <h1
          style={{
            fontSize: 'clamp(36px, 7vw, 72px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          Memelli OS
        </h1>
        <p
          style={{
            fontSize: 'clamp(16px, 3vw, 24px)',
            color: '#E11D2E',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          Work Hard, Dream Big
        </p>
        <p
          style={{
            fontSize: 'clamp(18px, 2.5vw, 22px)',
            color: '#a0a0b0',
            maxWidth: 680,
            lineHeight: 1.6,
            marginBottom: 48,
          }}
        >
          Your business IO — the AI-powered operating system that handles business
          compliance, funding, formation, marketing, commerce, and communications, with
          12,000+ autonomous AI agents working for your business 24/7. Personal credit is
          a supporting tool inside the IO, only when the business needs it.
        </p>
        <Link
          href="/register"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '16px 48px',
            background: '#E11D2E',
            color: '#fff',
            fontWeight: 700,
            fontSize: 18,
            borderRadius: 8,
            textDecoration: 'none',
            transition: 'transform 0.2s',
          }}
        >
          Get Started
        </Link>
      </section>

      {/* ─── 2. CREDIT REPAIR ────────────────────────────────────────────── */}
      <Section alt id="credit">
        <SectionHeading
          icon="&#x1F4CA;"
          title="Credit Repair Engine"
          subtitle="Fix your credit with AI-powered dispute strategies that actually work."
        />
        <RedDivider />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40 }}>
          <div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <Bullet>3-bureau credit analysis — Equifax, Experian, TransUnion</Bullet>
              <Bullet>AI-generated dispute letters tailored to each negative item</Bullet>
              <Bullet>40-80 point improvement in as little as 60 days</Bullet>
              <Bullet>Real-time credit monitoring and score tracking</Bullet>
              <Bullet>Automated dispute cycle management</Bullet>
              <Bullet>Dedicated AI credit agent assigned to your case</Bullet>
            </ul>
          </div>
          <div
            style={{
              background: 'rgba(225,29,46,0.06)',
              border: '1px solid rgba(225,29,46,0.15)',
              borderRadius: 16,
              padding: 40,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 56, fontWeight: 900, color: '#E11D2E', marginBottom: 8 }}>40-80</div>
            <div style={{ fontSize: 18, color: '#999' }}>Point Improvement</div>
            <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>in as little as 60 days</div>
          </div>
        </div>
      </Section>

      {/* ─── 3. FUNDING ──────────────────────────────────────────────────── */}
      <Section id="funding">
        <SectionHeading
          icon="&#x1F4B0;"
          title="Funding Solutions"
          subtitle="Access capital your business needs — from personal credit lines to SBA loans."
        />
        <RedDivider />
        <FeatureGrid
          items={[
            {
              icon: '\u{1F4B3}',
              title: 'Personal Credit Lines',
              desc: 'Qualify for $50K-$250K in personal credit lines with 0% intro APR offers.',
            },
            {
              icon: '\u{1F3E2}',
              title: 'Business Credit',
              desc: 'Build Tier 1-4 business credit with Dun & Bradstreet, Experian Business, and Equifax.',
            },
            {
              icon: '\u{1F3DB}',
              title: 'SBA Loans',
              desc: 'SBA 7(a), 504, and Microloans with AI-assisted application preparation.',
            },
            {
              icon: '\u{1F4C8}',
              title: 'Revenue-Based Financing',
              desc: 'Get funded based on your revenue — no credit check required, fast approval.',
            },
            {
              icon: '\u{1F4CE}',
              title: 'Equipment Financing',
              desc: 'Finance equipment purchases with competitive rates and flexible terms.',
            },
            {
              icon: '\u{26A1}',
              title: 'Fast Funding',
              desc: 'Emergency business funding in 24-48 hours for qualified applicants.',
            },
          ]}
        />
      </Section>

      {/* ─── 4. BUSINESS FORMATION ───────────────────────────────────────── */}
      <Section alt id="formation">
        <SectionHeading
          icon="&#x1F3D7;"
          title="Business Formation"
          subtitle="Start your business the right way — fully set up and fundability-ready from day one."
        />
        <RedDivider />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {[
            { step: '01', title: 'Entity Selection', desc: 'LLC, S-Corp, or C-Corp — we help you choose the right structure for tax benefits and liability protection.' },
            { step: '02', title: 'EIN & State Filing', desc: 'Federal EIN registration and state formation documents filed correctly the first time.' },
            { step: '03', title: 'Business Bank Account', desc: 'Open a dedicated business bank account with the right institution for fundability.' },
            { step: '04', title: 'Fundability Setup', desc: 'Business phone, address, website, and DUNS number — all configured for credit approval.' },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 28,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#E11D2E', marginBottom: 12 }}>
                STEP {item.step}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: '#999', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── 5. THE OS ───────────────────────────────────────────────────── */}
      <Section id="os">
        <SectionHeading
          icon="&#x1F9E0;"
          title="The Operating System"
          subtitle='Meet Melli — your AI assistant who runs your entire business. Voice + text. Always on.'
        />
        <RedDivider />
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(225,29,46,0.06) 0%, rgba(0,0,0,0) 60%)',
            border: '1px solid rgba(225,29,46,0.12)',
            borderRadius: 16,
            padding: 48,
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>&#x1F50A;</div>
          <h3 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
            &ldquo;Hey Melli&rdquo;
          </h3>
          <p style={{ fontSize: 16, color: '#999', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            Speak or type. Melli understands your intent, routes work to specialized agents,
            and delivers results in seconds. She sees your screen, hears your voice, and
            proactively suggests actions.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, textAlign: 'center' }}>
          {[
            { num: '12,000+', label: 'AI Agents' },
            { num: '80+', label: 'Specialized Roles' },
            { num: '24/7', label: 'Always Active' },
            { num: '<2s', label: 'Response Time' },
          ].map((s) => (
            <div key={s.label} style={{ padding: 24 }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#E11D2E' }}>{s.num}</div>
              <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── 6. AGENT SCHOOL ─────────────────────────────────────────────── */}
      <Section alt id="school">
        <SectionHeading
          icon="&#x1F393;"
          title="Agent School"
          subtitle="Our agents don't just work — they learn. Continuous education makes them smarter every day."
        />
        <RedDivider />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginBottom: 32 }}>
          {['High School', 'Associate', 'Bachelor', 'Master', 'Doctorate', 'Post-Doc'].map((level) => (
            <div
              key={level}
              style={{
                padding: '12px 24px',
                background: 'rgba(225,29,46,0.08)',
                border: '1px solid rgba(225,29,46,0.2)',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: '#E11D2E',
              }}
            >
              {level}
            </div>
          ))}
        </div>
        <ul style={{ listStyle: 'none', padding: 0, maxWidth: 640, margin: '0 auto' }}>
          <Bullet>1,000+ knowledge topics across credit, funding, sales, marketing, and operations</Bullet>
          <Bullet>Agents earn degrees as they master new skills — from High School to Post-Doc</Bullet>
          <Bullet>Self-learning system that improves from every interaction</Bullet>
          <Bullet>Specialized tracks: Credit Agent, Sales Agent, Marketing Agent, and more</Bullet>
          <Bullet>Knowledge verified through automated testing before deployment</Bullet>
        </ul>
      </Section>

      {/* ─── 7. BANK-LEVEL SECURITY ──────────────────────────────────────── */}
      <Section id="security">
        <SectionHeading
          icon="&#x1F510;"
          title="Bank-Level Security"
          subtitle="Zero-trust architecture with enterprise-grade protection for your data."
        />
        <RedDivider />
        <FeatureGrid
          items={[
            {
              icon: '\u{1F512}',
              title: 'Zero-Trust Architecture',
              desc: 'Every request authenticated and authorized. No implicit trust, ever.',
            },
            {
              icon: '\u{1F5DD}',
              title: 'Field-Level Encryption',
              desc: 'Sensitive data encrypted at the field level — SSN, DOB, financial records.',
            },
            {
              icon: '\u{1F6E1}',
              title: 'RBAC Permissions',
              desc: 'Role-based access control with 4 tiers: Super Admin, Admin, Member, Viewer.',
            },
            {
              icon: '\u{1F4DD}',
              title: 'Audit Logging',
              desc: 'Every action logged with timestamp, user, and IP. Full compliance trail.',
            },
            {
              icon: '\u{1F310}',
              title: 'Tenant Isolation',
              desc: 'Multi-tenant architecture with strict data separation between organizations.',
            },
            {
              icon: '\u{2699}',
              title: 'AI Governance',
              desc: 'AI actions governed by approval controls — no unauthorized data access.',
            },
          ]}
        />
      </Section>

      {/* ─── 8. AUTOMATIC MARKETING ──────────────────────────────────────── */}
      <Section alt id="marketing">
        <SectionHeading
          icon="&#x1F4E3;"
          title="Automatic Marketing"
          subtitle="AI-powered SEO, content generation, and multi-channel marketing that runs itself."
        />
        <RedDivider />
        <FeatureGrid
          items={[
            {
              icon: '\u{1F50D}',
              title: 'SEO Engine',
              desc: 'AI keyword research, cluster building, and automatic IndexNow submission for instant indexing.',
            },
            {
              icon: '\u{270D}',
              title: 'Content Generation',
              desc: 'AI writes SEO-optimized articles, blog posts, and landing pages in your brand voice.',
            },
            {
              icon: '\u{1F4E7}',
              title: 'Email Automation',
              desc: 'Drip campaigns, nurture sequences, and transactional emails — all automated.',
            },
            {
              icon: '\u{1F4F1}',
              title: 'Social Media',
              desc: 'Auto-generated social posts, scheduling, and cross-platform publishing.',
            },
          ]}
        />
      </Section>

      {/* ─── 9. RESIDUAL INCOME ──────────────────────────────────────────── */}
      <Section id="income">
        <SectionHeading
          icon="&#x1F4B8;"
          title="Residual Income — Infinity Network"
          subtitle="Earn $5K-$20K/month in residual commissions through the Infinity affiliate network."
        />
        <RedDivider />
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(225,29,46,0.08) 0%, rgba(0,0,0,0) 50%)',
            border: '1px solid rgba(225,29,46,0.12)',
            borderRadius: 16,
            padding: 48,
            marginBottom: 32,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#E11D2E' }}>$5K-$20K</div>
              <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>Monthly Potential</div>
            </div>
            <div>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#E11D2E' }}>Multi-Tier</div>
              <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>Commission Structure</div>
            </div>
            <div>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#E11D2E' }}>Lifetime</div>
              <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>Attribution</div>
            </div>
          </div>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, maxWidth: 640, margin: '0 auto' }}>
          <Bullet>Refer clients and earn commissions on every service they use</Bullet>
          <Bullet>Multi-tier structure — earn from your referrals and their referrals</Bullet>
          <Bullet>Real-time tracking dashboard with payout history</Bullet>
          <Bullet>Marketing assets, QR codes, and branded referral links provided</Bullet>
          <Bullet>Lifetime attribution — once tagged, always yours</Bullet>
        </ul>
      </Section>

      {/* ─── 10. COMMERCE ENGINE ─────────────────────────────────────────── */}
      <Section alt id="commerce">
        <SectionHeading
          icon="&#x1F6D2;"
          title="Commerce Engine"
          subtitle="Launch your online store with products, subscriptions, digital goods, and more."
        />
        <RedDivider />
        <FeatureGrid
          items={[
            {
              icon: '\u{1F3EA}',
              title: 'Online Stores',
              desc: 'Create branded storefronts with custom domains and white-label options.',
            },
            {
              icon: '\u{1F4E6}',
              title: 'Products & Inventory',
              desc: 'Physical and digital products with variant management and stock tracking.',
            },
            {
              icon: '\u{1F504}',
              title: 'Subscriptions',
              desc: 'Recurring billing with flexible plans, trials, and automated renewals.',
            },
            {
              icon: '\u{1F3AF}',
              title: 'Auctions',
              desc: 'Built-in auction system for competitive bidding on premium items.',
            },
            {
              icon: '\u{1F4B5}',
              title: 'Payment Processing',
              desc: 'Stripe integration with multi-currency support and automatic payouts.',
            },
            {
              icon: '\u{1F4CA}',
              title: 'Commerce Analytics',
              desc: 'Revenue tracking, conversion funnels, and customer lifetime value analysis.',
            },
          ]}
        />
      </Section>

      {/* ─── 11. COACHING PLATFORM ───────────────────────────────────────── */}
      <Section id="coaching">
        <SectionHeading
          icon="&#x1F4DA;"
          title="Coaching Platform"
          subtitle="Create courses, track progress, and issue certificates — all built in."
        />
        <RedDivider />
        <FeatureGrid
          items={[
            {
              icon: '\u{1F4D6}',
              title: 'Course Builder',
              desc: 'Drag-and-drop course creation with modules, lessons, and quizzes.',
            },
            {
              icon: '\u{1F4C8}',
              title: 'Progress Tracking',
              desc: 'Real-time student progress with completion rates and engagement metrics.',
            },
            {
              icon: '\u{1F3C6}',
              title: 'Certificates',
              desc: 'Auto-generated branded certificates upon course completion.',
            },
            {
              icon: '\u{1F916}',
              title: 'AI Coaching Agent',
              desc: 'AI tutor that answers questions and guides students through material.',
            },
          ]}
        />
      </Section>

      {/* ─── 12. COMMUNICATIONS ──────────────────────────────────────────── */}
      <Section alt id="comms">
        <SectionHeading
          icon="&#x1F4AC;"
          title="Omnichannel Communications"
          subtitle="Every channel, one unified thread. Chat, SMS, email, phone, and AI voice."
        />
        <RedDivider />
        <FeatureGrid
          items={[
            {
              icon: '\u{1F4AC}',
              title: 'Live Chat Widget',
              desc: 'AI-powered chat widget with qualification, intent detection, and CRM integration.',
            },
            {
              icon: '\u{1F4F1}',
              title: 'SMS Messaging',
              desc: 'Two-way SMS with templates, automation, and opt-in/opt-out management.',
            },
            {
              icon: '\u{1F4E8}',
              title: 'Email',
              desc: 'Transactional and marketing email with tracking and template builder.',
            },
            {
              icon: '\u{1F4DE}',
              title: 'Phone System',
              desc: 'Cloud phone with IVR, call recording, voicemail, and queue management.',
            },
            {
              icon: '\u{1F399}',
              title: 'AI Voice',
              desc: 'Melli speaks with Deepgram Aurora voice — natural, expressive, always available.',
            },
            {
              icon: '\u{1F4CB}',
              title: 'Ticket System',
              desc: 'Support tickets with SLA tracking, assignment, and escalation workflows.',
            },
          ]}
        />
      </Section>

      {/* ─── 13. API INTEGRATIONS ────────────────────────────────────────── */}
      <Section id="integrations">
        <SectionHeading
          icon="&#x1F517;"
          title="35+ API Integrations"
          subtitle="Connected to the tools and services your business already uses."
        />
        <RedDivider />
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
            marginTop: 32,
          }}
        >
          {[
            'Stripe', 'Twilio', 'SendGrid', 'Plaid', 'CoinGecko',
            'NewsAPI', 'Google Analytics', 'IndexNow', 'Deepgram',
            'OpenAI', 'Anthropic Claude', 'Zapier', 'HubSpot',
            'Salesforce', 'Slack', 'Discord', 'QuickBooks',
            'Dun & Bradstreet', 'Equifax', 'Experian', 'TransUnion',
            'Instagram', 'Facebook', 'LinkedIn', 'Google Ads',
            'Mailchimp', 'Calendly', 'Zoom', 'DocuSign',
            // 'AWS S3', 'Cloudflare', 'Vercel', 'Railway',  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
            'GitHub', 'Notion',
          ].map((name) => (
            <span
              key={name}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                fontSize: 13,
                color: '#bbb',
                fontWeight: 500,
              }}
            >
              {name}
            </span>
          ))}
        </div>
      </Section>

      {/* ─── 14. FINAL CTA ───────────────────────────────────────────────── */}
      <section
        style={{
          width: '100%',
          padding: '120px 24px',
          textAlign: 'center',
          background: 'radial-gradient(ellipse at 50% 70%, rgba(225,29,46,0.1) 0%, #050507 70%)',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 900,
            color: '#fff',
            marginBottom: 16,
            letterSpacing: '-0.02em',
          }}
        >
          Ready to Build Your Empire?
        </h2>
        <p
          style={{
            fontSize: 18,
            color: '#999',
            maxWidth: 560,
            margin: '0 auto 40px',
            lineHeight: 1.6,
          }}
        >
          Join thousands of entrepreneurs using Memelli OS to repair credit, secure funding,
          automate marketing, and grow their business — powered by AI.
        </p>
        <Link
          href="/register"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '18px 56px',
            background: '#E11D2E',
            color: '#fff',
            fontWeight: 700,
            fontSize: 20,
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          Get Started Now
        </Link>
        <p style={{ fontSize: 13, color: '#555', marginTop: 16 }}>
          No credit card required. Free trial available.
        </p>
      </section>
    </div>
  );
}
