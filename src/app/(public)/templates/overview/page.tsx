export const metadata = { title: 'Platform Overview Email Template — Memelli OS' };

const LOGO_URL = 'https://memelli.com/memelli-logo-white.png';

function OverviewEmailHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Memelli OS — Full Platform Overview</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:Arial,Helvetica,sans-serif;color:#e4e4e7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Logo -->
<tr><td align="center" style="padding:0 0 24px;">
<img src="${LOGO_URL}" alt="Memelli" width="180" style="display:block;height:auto;"/>
</td></tr>

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#1a1a24 0%,#12121a 100%);border:1px solid rgba(255,255,255,0.06);border-radius:16px 16px 0 0;padding:40px 40px 0;">
<h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffffff;">The Complete AI Business OS</h1>
<p style="margin:0;font-size:14px;color:#a1a1aa;font-style:italic;">Work Hard, Dream Big</p>
</td></tr>

<!-- Body -->
<tr><td style="background:#12121a;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);padding:32px 40px;">
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#d4d4d8;">
Memelli OS is a unified AI-powered operating system that replaces dozens of separate business tools with one intelligent platform. Here is everything included:
</p>

<!-- Engine 1: Commerce -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
<tr><td style="padding:16px;background:rgba(225,29,46,0.06);border:1px solid rgba(225,29,46,0.15);border-radius:12px;">
<h2 style="margin:0 0 8px;font-size:18px;color:#E11D2E;">Commerce Engine</h2>
<p style="margin:0;font-size:14px;line-height:1.5;color:#a1a1aa;">
Online stores, product management, payment processing, subscriptions, auctions, affiliate tracking, coupon systems, and order fulfillment — all in one place.
</p>
</td></tr>
</table>

<!-- Engine 2: CRM -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
<tr><td style="padding:16px;background:rgba(225,29,46,0.06);border:1px solid rgba(225,29,46,0.15);border-radius:12px;">
<h2 style="margin:0 0 8px;font-size:18px;color:#E11D2E;">CRM &amp; Sales Pipeline</h2>
<p style="margin:0;font-size:14px;line-height:1.5;color:#a1a1aa;">
Visual deal pipelines, contact management, lead scoring, automated follow-ups, communication tracking, custom fields, segments, forecasting, and reporting.
</p>
</td></tr>
</table>

<!-- Engine 3: Coaching -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
<tr><td style="padding:16px;background:rgba(225,29,46,0.06);border:1px solid rgba(225,29,46,0.15);border-radius:12px;">
<h2 style="margin:0 0 8px;font-size:18px;color:#E11D2E;">Coaching Platform</h2>
<p style="margin:0;font-size:14px;line-height:1.5;color:#a1a1aa;">
Build and sell coaching programs with modules, lessons, quizzes, certificates, student enrollments, progress tracking, and AI-powered coaching assistants.
</p>
</td></tr>
</table>

<!-- Engine 4: SEO -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
<tr><td style="padding:16px;background:rgba(225,29,46,0.06);border:1px solid rgba(225,29,46,0.15);border-radius:12px;">
<h2 style="margin:0 0 8px;font-size:18px;color:#E11D2E;">SEO Traffic Engine</h2>
<p style="margin:0;font-size:14px;line-height:1.5;color:#a1a1aa;">
AI article generation, keyword clusters, content calendars, backlink tracking, IndexNow integration, ranking monitoring, and website builder.
</p>
</td></tr>
</table>

<!-- AI -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
<tr><td style="padding:16px;background:rgba(225,29,46,0.06);border:1px solid rgba(225,29,46,0.15);border-radius:12px;">
<h2 style="margin:0 0 8px;font-size:18px;color:#E11D2E;">AI Workforce — 80+ Agents</h2>
<p style="margin:0;font-size:14px;line-height:1.5;color:#a1a1aa;">
Sales agents, marketing agents, support agents, SEO agents, analytics agents — all working 24/7. Voice-enabled with natural language commands via Melli, our AI assistant powered by Claude.
</p>
</td></tr>
</table>

<!-- Communications -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
<tr><td style="padding:16px;background:rgba(225,29,46,0.06);border:1px solid rgba(225,29,46,0.15);border-radius:12px;">
<h2 style="margin:0 0 8px;font-size:18px;color:#E11D2E;">Omnichannel Communications</h2>
<p style="margin:0;font-size:14px;line-height:1.5;color:#a1a1aa;">
Phone, SMS, email, live chat, voicemail, IVR, ticket management — all unified in one thread per contact. AI-first response with human escalation.
</p>
</td></tr>
</table>

<!-- Additional -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
<tr><td style="padding:16px;background:rgba(225,29,46,0.06);border:1px solid rgba(225,29,46,0.15);border-radius:12px;">
<h2 style="margin:0 0 8px;font-size:18px;color:#E11D2E;">Plus: Credit, Leads, Workflows &amp; More</h2>
<p style="margin:0;font-size:14px;line-height:1.5;color:#a1a1aa;">
Credit repair tools, lead generation with LeadPulse, workflow automation with OmniFlow, partner/affiliate network (Infinity), analytics dashboards, and a full website builder.
</p>
</td></tr>
</table>

<!-- CTA Button -->
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
<tr><td align="center" style="background:#E11D2E;border-radius:12px;">
<a href="https://memelli.com/register" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
Start Your Free Trial
</a>
</td></tr>
</table>

<p style="margin:0;font-size:14px;line-height:1.6;color:#a1a1aa;">
Questions? Reply to this email or call us directly.
</p>
</td></tr>

<!-- Contact -->
<tr><td style="background:#12121a;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);padding:24px 40px;border-top:1px solid rgba(255,255,255,0.04);">
<p style="margin:0 0 4px;font-size:13px;color:#71717a;">Contact us</p>
<p style="margin:0 0 2px;font-size:14px;color:#d4d4d8;">admin@memelli.com | (951) 383-2025</p>
<p style="margin:0;font-size:14px;"><a href="https://memelli.com" style="color:#E11D2E;text-decoration:none;">memelli.com</a></p>
</td></tr>

<!-- Footer -->
<tr><td style="background:#0d0d14;border:1px solid rgba(255,255,255,0.06);border-top:none;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
<p style="margin:0 0 8px;font-size:12px;color:#52525b;">&copy; 2026 Memelli. All rights reserved.</p>
<p style="margin:0;font-size:12px;"><a href="https://memelli.com/unsubscribe" style="color:#71717a;text-decoration:underline;">Unsubscribe</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export default function OverviewTemplatePage() {
  const html = OverviewEmailHTML();
  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0f', padding: '40px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ color: '#fff', fontSize: 18, margin: 0 }}>Platform Overview Email Template</h2>
          <a href="/templates" style={{ color: '#E11D2E', fontSize: 14, textDecoration: 'none' }}>Back to Templates</a>
        </div>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}

