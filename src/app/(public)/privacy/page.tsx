import Link from 'next/link';

export default function PrivacyPage() {
  const lastUpdated = 'March 1, 2025';

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
      {/* Hero */}
      <section className="relative px-6 py-24 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center">
          <div className="h-64 w-64 rounded-full bg-red-600/8 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Privacy{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-10">
            {/* Intro */}
            <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-8">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Memelli Inc. (&quot;Memelli,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting
                your privacy. This Privacy Policy explains how we collect, use, disclose, and
                safeguard your information when you use our platform, website, and services
                (collectively, the &quot;Service&quot;). By using the Service, you agree to the
                collection and use of information in accordance with this policy.
              </p>
            </div>

            {/* Sections */}
            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">1. Information We Collect</h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <div>
                  <h3 className="mb-2 font-medium text-foreground">Personal Information</h3>
                  <p>
                    When you create an account, we collect information such as your name, email address,
                    phone number, billing address, and payment information. If you sign up through a
                    referral link, we also record the referring affiliate&apos;s identifier.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-medium text-foreground">Business Information</h3>
                  <p>
                    We collect information about your business including business name, industry,
                    website URL, and any data you input into the platform such as customer records,
                    communications, and business documents.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-medium text-foreground">Usage Data</h3>
                  <p>
                    We automatically collect information about how you interact with the Service,
                    including pages visited, features used, timestamps, device information, IP address,
                    browser type, and referring URLs.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-medium text-foreground">Cookies and Tracking</h3>
                  <p>
                    We use cookies, web beacons, and similar technologies to maintain sessions,
                    remember preferences, and analyze usage patterns. You can control cookie
                    preferences through your browser settings.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">2. How We Use Your Information</h2>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                  To provide, maintain, and improve the Service
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                  To process transactions and send related notifications
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                  To personalize your experience and deliver AI-generated content and recommendations
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                  To communicate with you about updates, security alerts, and support
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                  To detect, prevent, and address fraud, abuse, and technical issues
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                  To train and improve our AI models (using anonymized/aggregated data only)
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                  To comply with legal obligations
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">3. Data Sharing and Disclosure</h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>We do not sell your personal information. We may share your data in the following circumstances:</p>
                <div>
                  <h3 className="mb-2 font-medium text-foreground">Service Providers</h3>
                  <p>
                    We share data with trusted third-party service providers who assist us in operating
                    the platform, including cloud hosting, payment processing, email delivery, and analytics.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-medium text-foreground">Legal Requirements</h3>
                  <p>
                    We may disclose information if required by law, regulation, legal process, or
                    governmental request, or to protect the rights, property, or safety of Memelli,
                    our users, or the public.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-medium text-foreground">Business Transfers</h3>
                  <p>
                    In the event of a merger, acquisition, or sale of assets, your information may
                    be transferred. We will notify you before your data becomes subject to a different
                    privacy policy.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">4. Data Security</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We implement industry-standard security measures to protect your information,
                including encryption at rest and in transit (TLS 1.3), secure access controls,
                regular security audits, and monitoring. However, no method of transmission over
                the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">5. Data Retention</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We retain your personal information for as long as your account is active or as
                needed to provide the Service. You may request deletion of your account and
                associated data at any time. Some information may be retained as required by law
                or for legitimate business purposes (e.g., fraud prevention).
              </p>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">6. Your Rights</h2>
              <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                <p>Depending on your jurisdiction, you may have the following rights:</p>
                <ul className="space-y-2.5 pl-4">
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    <strong className="text-foreground">Access:</strong> Request a copy of your personal data
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    <strong className="text-foreground">Correction:</strong> Request correction of inaccurate data
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    <strong className="text-foreground">Deletion:</strong> Request deletion of your personal data
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    <strong className="text-foreground">Portability:</strong> Request your data in a portable format
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    <strong className="text-foreground">Opt-out:</strong> Opt out of marketing communications at any time
                  </li>
                </ul>
                <p className="mt-4">
                  To exercise any of these rights, contact us at{' '}
                  <a href="mailto:privacy@memelli.com" className="text-red-400 hover:text-red-300 transition-colors">
                    privacy@memelli.com
                  </a>.
                </p>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">7. Children&apos;s Privacy</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Service is not directed to individuals under the age of 18. We do not
                knowingly collect personal information from children. If we become aware that
                we have collected data from a child, we will take steps to delete it promptly.
              </p>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">8. International Data Transfers</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than
                your own. We ensure appropriate safeguards are in place to protect your data
                in compliance with applicable data protection laws.
              </p>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">9. Changes to This Policy</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of
                material changes by posting the updated policy on our website and updating the
                &quot;Last updated&quot; date. Continued use of the Service after changes constitutes
                acceptance of the updated policy.
              </p>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">10. Contact Us</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you have questions or concerns about this Privacy Policy or our data
                practices, contact us at:
              </p>
              <div className="mt-4 rounded-2xl border border-border bg-card backdrop-blur-xl p-8 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Memelli Inc.</p>
                <p className="mt-1">Email: <a href="mailto:privacy@memelli.com" className="text-red-400 hover:text-red-300 transition-colors">privacy@memelli.com</a></p>
                <p>Web: <Link href="/contact" className="text-red-400 hover:text-red-300 transition-colors">memelli.com/contact</Link></p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
