import Link from 'next/link';

export default function TermsPage() {
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
            Terms of{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
              Service
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
                These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Memelli
                platform, website, and services (collectively, the &quot;Service&quot;) provided by Memelli
                Inc. (&quot;Memelli,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By accessing or using the Service, you
                agree to be bound by these Terms. If you do not agree, do not use the Service.
              </p>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">1. Account Registration</h2>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  To use the Service, you must create an account and provide accurate, complete
                  information. You are responsible for maintaining the confidentiality of your
                  account credentials and for all activities that occur under your account.
                </p>
                <p>
                  You must be at least 18 years old to use the Service. By creating an account,
                  you represent and warrant that you meet this age requirement and have the legal
                  authority to enter into these Terms.
                </p>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">2. Use of the Service</h2>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Memelli grants you a limited, non-exclusive, non-transferable, revocable license
                  to access and use the Service in accordance with these Terms and your selected
                  subscription plan.
                </p>
                <p>The Service includes AI-powered tools, agents, and automation features. You acknowledge that:</p>
                <ul className="space-y-2.5 pl-4">
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    AI-generated content and actions are provided as-is and may require your review
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    You are responsible for reviewing and approving AI outputs before they are
                    published or sent externally
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    AI capabilities may change, improve, or be modified as part of platform updates
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">3. Acceptable Use</h2>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>You agree not to use the Service to:</p>
                <ul className="space-y-2.5 pl-4">
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    Violate any applicable law, regulation, or third-party rights
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    Send spam, unsolicited messages, or engage in abusive marketing practices
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    Distribute malware, viruses, or other harmful code
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    Attempt to gain unauthorized access to the Service or its infrastructure
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    Reverse-engineer, decompile, or disassemble any part of the Service
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    Use the Service to generate illegal, harmful, defamatory, or misleading content
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    Resell or sublicense the Service without our written consent
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">4. Subscription and Billing</h2>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  The Service is offered on a subscription basis. By selecting a plan, you agree
                  to pay the applicable fees as described on our{' '}
                  <Link href="/pricing" className="text-red-400 hover:text-red-300 transition-colors">
                    Pricing page
                  </Link>.
                </p>
                <ul className="space-y-2.5 pl-4">
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    Subscriptions automatically renew unless canceled before the renewal date
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    Fees are non-refundable except as required by law or our refund policy
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    We may change pricing with 30 days&apos; notice; continued use constitutes acceptance
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    Free trial periods, if offered, convert to paid subscriptions unless canceled
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">5. Intellectual Property</h2>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">Our IP:</strong> The Service, including its software, design, branding,
                  and documentation, is owned by Memelli and protected by intellectual property
                  laws. Nothing in these Terms transfers ownership of our IP to you.
                </p>
                <p>
                  <strong className="text-foreground">Your Content:</strong> You retain ownership of all content you create or upload
                  to the Service (&quot;Your Content&quot;). You grant us a limited license to use, process,
                  and display Your Content solely to provide and improve the Service.
                </p>
                <p>
                  <strong className="text-foreground">AI-Generated Content:</strong> Content generated by AI agents within your
                  workspace is owned by you, subject to any applicable third-party rights.
                </p>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">6. Data and Privacy</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your use of the Service is also governed by our{' '}
                <Link href="/privacy" className="text-red-400 hover:text-red-300 transition-colors">
                  Privacy Policy
                </Link>
                , which describes how we collect, use, and protect your information. By using
                the Service, you consent to the data practices described in the Privacy Policy.
              </p>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">7. Limitation of Liability</h2>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, MEMELLI AND ITS OFFICERS, DIRECTORS,
                  EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                  CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE
                  SERVICE.
                </p>
                <p>
                  OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING UNDER THESE TERMS SHALL NOT EXCEED
                  THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
                </p>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">8. Disclaimer of Warranties</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY
                KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO
                NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
              </p>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">9. Indemnification</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You agree to indemnify, defend, and hold harmless Memelli and its affiliates from
                any claims, damages, losses, liabilities, and expenses (including attorneys&apos; fees)
                arising out of your use of the Service, your violation of these Terms, or your
                violation of any third-party rights.
              </p>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">10. Termination</h2>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  You may terminate your account at any time by contacting us or through your
                  account settings. We may suspend or terminate your access to the Service at
                  any time for any reason, including violation of these Terms.
                </p>
                <p>
                  Upon termination: (a) your right to use the Service ceases immediately;
                  (b) you remain responsible for any outstanding fees; (c) we may delete your
                  data after a reasonable retention period unless required by law to retain it.
                </p>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">11. Governing Law</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of
                the State of Delaware, without regard to its conflict of law provisions. Any
                disputes arising under these Terms shall be resolved in the state or federal
                courts located in Delaware.
              </p>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">12. Changes to These Terms</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We may update these Terms from time to time. We will notify you of material
                changes by email or by posting a notice on the Service. Continued use of the
                Service after changes take effect constitutes acceptance of the revised Terms.
              </p>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">13. Contact</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="mt-4 rounded-2xl border border-border bg-card backdrop-blur-xl p-8 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Memelli Inc.</p>
                <p className="mt-1">Email: <a href="mailto:legal@memelli.com" className="text-red-400 hover:text-red-300 transition-colors">legal@memelli.com</a></p>
                <p>Web: <Link href="/contact" className="text-red-400 hover:text-red-300 transition-colors">memelli.com/contact</Link></p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
