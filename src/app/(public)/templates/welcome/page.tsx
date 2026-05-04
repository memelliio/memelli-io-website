export const metadata = { title: 'Welcome Email Template — Memelli OS' };

const LOGO_URL = 'https://memelli.com/memelli-logo-white.png';

function WelcomeEmailHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Welcome to Memelli</title>
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
<h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffffff;">Welcome to Memelli OS</h1>
<p style="margin:0;font-size:14px;color:#a1a1aa;font-style:italic;">Work Hard, Dream Big</p>
</td></tr>

<!-- Body -->
<tr><td style="background:#12121a;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);padding:32px 40px;">
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#d4d4d8;">
Thank you for joining Memelli. You now have access to a complete AI-powered business operating system designed to help you grow, scale, and succeed.
</p>

<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#d4d4d8;">
Here is what you can start with today:
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr><td style="padding:12px 16px;background:rgba(225,29,46,0.08);border-left:3px solid #E11D2E;border-radius:0 8px 8px 0;margin-bottom:8px;">
<p style="margin:0;font-size:14px;color:#d4d4d8;"><strong style="color:#ffffff;">Commerce Engine</strong> — Launch your online store, manage products, process payments</p>
</td></tr>
<tr><td style="height:8px;"></td></tr>
<tr><td style="padding:12px 16px;background:rgba(225,29,46,0.08);border-left:3px solid #E11D2E;border-radius:0 8px 8px 0;">
<p style="margin:0;font-size:14px;color:#d4d4d8;"><strong style="color:#ffffff;">CRM System</strong> — Track leads, manage pipelines, close deals</p>
</td></tr>
<tr><td style="height:8px;"></td></tr>
<tr><td style="padding:12px 16px;background:rgba(225,29,46,0.08);border-left:3px solid #E11D2E;border-radius:0 8px 8px 0;">
<p style="margin:0;font-size:14px;color:#d4d4d8;"><strong style="color:#ffffff;">AI Workforce</strong> — 80+ AI agents working for your business 24/7</p>
</td></tr>
<tr><td style="height:8px;"></td></tr>
<tr><td style="padding:12px 16px;background:rgba(225,29,46,0.08);border-left:3px solid #E11D2E;border-radius:0 8px 8px 0;">
<p style="margin:0;font-size:14px;color:#d4d4d8;"><strong style="color:#ffffff;">Coaching Platform</strong> — Create and sell coaching programs</p>
</td></tr>
</table>

<!-- CTA Button -->
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
<tr><td align="center" style="background:#E11D2E;border-radius:12px;">
<a href="https://memelli.com/dashboard" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
Go to Your Dashboard
</a>
</td></tr>
</table>

<p style="margin:0;font-size:14px;line-height:1.6;color:#a1a1aa;">
Need help getting started? Just reply to this email or reach out to our team.
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

export default function WelcomeTemplatePage() {
  const html = WelcomeEmailHTML();
  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0f', padding: '40px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ color: '#fff', fontSize: 18, margin: 0 }}>Welcome Email Template</h2>
          <a href="/templates" style={{ color: '#E11D2E', fontSize: 14, textDecoration: 'none' }}>Back to Templates</a>
        </div>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}

